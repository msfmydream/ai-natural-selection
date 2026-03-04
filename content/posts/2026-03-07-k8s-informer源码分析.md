---
title: "Kubernetes Informer 源码阅读笔记"
date: 2026-03-07T09:00:00+08:00
draft: false
tags: ["kubernetes", "源码", "informer", "client-go"]
categories: ["云原生"]
description: "读 client-go Informer 源码的一些笔记，包括 List-Watch 机制、本地缓存设计、事件处理流程"
---

最近在看 client-go 的源码，Informer 这块的设计挺有意思的，记录一下。

## 为什么要用 Informer

刚开始写 K8s operator 的时候，我直接调 API 获取资源：

```go
pods, _ := clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
```

然后每隔几秒轮询一次。后来 leader review 代码的时候说这样不行，API Server 压力太大，让我用 Informer。

Informer 的核心思想是：

1. **List 全量数据**到本地缓存
2. **Watch 增量更新**，保持缓存同步
3. 业务逻辑**只读本地缓存**，不直接调 API

这样把对 API Server 的压力转移到了本地内存，而且能做到近实时的事件响应。

## 整体架构

Informer 主要由这几个组件组成：

- **Reflector**：负责 List-Watch，把事件放到 DeltaFIFO
- **DeltaFIFO**：一个带增量标记的队列，存储对象变更事件
- **Indexer**：本地缓存，支持索引查询
- **Controller**：协调上面几个组件的运行

数据流向大概是：

```
API Server --(List&Watch)--> Reflector --(Delta)--> DeltaFIFO --(Pop)--> Indexer --(查询)--> 业务代码
```

## Reflector 的实现

Reflector 的代码在 `client-go/tools/cache/reflector.go`。

核心逻辑是 `ListAndWatch` 方法：

```go
func (r *Reflector) ListAndWatch(stopCh <-chan struct{}) error {
    // 1. List 全量数据
    list, err := r.listerWatcher.List(options)
    
    // 2. 拿到 ResourceVersion，后面 Watch 要用
    resourceVersion = listMetaInterface.GetResourceVersion()
    
    // 3. 把数据同步到 DeltaFIFO（标记为 Sync/Replaced）
    for _, item := range items {
        r.store.Replace(item, resourceVersion)
    }
    
    // 4. 开始 Watch
    w, err := r.listerWatcher.Watch(options)
    
    // 5. 处理 Watch 事件
    for {
        select {
        case event := <- w.ResultChan():
            switch event.Type {
            case watch.Added:
                r.store.Add(event.Object)
            case watch.Modified:
                r.store.Update(event.Object)
            case watch.Deleted:
                r.store.Delete(event.Object)
            }
        }
    }
}
```

有几个细节值得注意：

1. **ResourceVersion**：K8s 用这个字段实现乐观锁和增量同步。Watch 的时候带上这个版本号，API Server 只会返回这个版本之后的事件。

2. **断线重连**：如果 Watch 连接断了，Reflector 会自动用最新的 ResourceVersion 重新 Watch。如果版本太旧（被 compact 了），会退化成重新 List。

## DeltaFIFO 的设计

DeltaFIFO 和普通 FIFO 队列的区别是，它存储的是**Delta**（变更记录），而不是对象本身。

```go
type Delta struct {
    Type   DeltaType  // Added/Updated/Deleted/Replaced/Sync
    Object interface{}
}

type Deltas []Delta
```

为什么要这么设计？

因为同一个对象可能在短时间内多次变更，如果每变更一次都同步到 Indexer，会有性能问题。DeltaFIFO 会把同一个对象的多个 Delta 合并（比如多次 Update 合并成一次），减少处理次数。

代码在 `client-go/tools/cache/delta_fifo.go`，感兴趣可以看看 `queueActionLocked` 方法。

## Indexer 的索引

Indexer 不只是简单的 map，它支持**多索引**。

比如我可以给 Pod 建两个索引：

```go
indexers := cache.Indexers{
    cache.NamespaceIndex: cache.MetaNamespaceIndexFunc,  // 按 namespace
    "nodeName": func(obj interface{}) ([]string, error) {
        pod := obj.(*v1.Pod)
        return []string{pod.Spec.NodeName}, nil
    },
}

informer := coreinformer.NewPodInformer(clientset, 0, indexers)
```

然后就能按 nodeName 查 Pod：

```go
pods, _ := podInformer.GetIndexer().ByIndex("nodeName", "node-1")
```

这个功能在写调度器或者节点相关控制器的时候很有用。

## 使用示例

```go
factory := informers.NewSharedInformerFactory(clientset, 10*time.Minute)
podInformer := factory.Core().V1().Pods().Informer()

// 注册事件处理器
podInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
    AddFunc: func(obj interface{}) {
        pod := obj.(*v1.Pod)
        fmt.Printf("Pod added: %s/%s\n", pod.Namespace, pod.Name)
    },
    UpdateFunc: func(oldObj, newObj interface{}) {
        oldPod := oldObj.(*v1.Pod)
        newPod := newObj.(*v1.Pod)
        if oldPod.ResourceVersion != newPod.ResourceVersion {
            fmt.Printf("Pod updated: %s/%s\n", newPod.Namespace, newPod.Name)
        }
    },
    DeleteFunc: func(obj interface{}) {
        pod := obj.(*v1.Pod)
        fmt.Printf("Pod deleted: %s/%s\n", pod.Namespace, pod.Name)
    },
})

// 启动 Informer
stopCh := make(chan struct{})
factory.Start(stopCh)
factory.WaitForCacheSync(stopCh)

<- stopCh
```

注意一定要用 `SharedInformerFactory`，它会复用同一个 Informer，避免对同一种资源建立多个 Watch 连接。

## 一些踩坑经验

1. **Delete 事件的对象可能是 `DeletedFinalStateUnknown`**：当 Watch 断线重连期间有对象被删除，Informer 会收到这个类型的对象，里面的 `Obj` 字段才是真正的被删除对象。

2. **Update 事件会频繁触发**：K8s 的很多字段（比如 `status`）会不断变化，如果只想处理 spec 的变化，需要自己比较新旧对象。

3. **内存占用**：Informer 会缓存整个 namespace 甚至集群的对象，如果资源很多，内存占用会很大。可以用 `NewFilteredSharedInformerFactory` 限制只 watch 特定标签的资源。

---

源码读起来还是挺费劲的，有很多细节（比如 thread-safe、错误处理）需要慢慢啃。

如果你也在读 client-go 源码，欢迎一起交流。有什么理解不对的地方也请指出。
