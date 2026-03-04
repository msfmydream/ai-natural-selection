---
title: "读 Kubernetes Scheduler 源码的一些笔记"
date: 2026-03-12T09:00:00+08:00
draft: false
tags: ["kubernetes", "源码", "scheduler"]
categories: ["云原生"]
description: "读 kube-scheduler 源码的笔记，包括调度流程、预选优选算法、抢占机制"
---

最近在看 Kubernetes Scheduler 的源码，记录一下关键流程。

Scheduler 的代码在 `kubernetes/pkg/scheduler/` 下面，主入口是 `scheduler.go`。

## 调度流程

一个 Pod 被创建后，调度流程大概是：

```
1. 进入调度队列（PriorityQueue）
2. 调度周期：选出合适的节点
   - 预选（Predicates）：过滤不符合条件的节点
   - 优选（Priorities）：给剩余节点打分，选最高分
3. 绑定周期：把 Pod 和节点绑定
   - 抢占（如果需要）：驱逐低优先级 Pod
   - 执行绑定
```

## 调度队列

Scheduler 内部有三个队列：

- **activeQ**：可以调度的 Pod，按优先级排序
- **unschedulableQ**：暂时调度失败的 Pod
- **backoffQ**：重试的 Pod，防止频繁重试

代码在 `pkg/scheduler/internal/queue/scheduling_queue.go`。

```go
type PriorityQueue struct {
    activeQ *heap.Heap
    unschedulableQ map[string]*framework.QueuedPodInfo
    backoffQ *heap.Heap
}
```

Pod 的优先级在 `pod.spec.priority` 里设置，数字越大优先级越高。

## 预选阶段（Predicates）

预选就是过滤掉明显不能跑这个 Pod 的节点。

主要检查项：

| 插件名 | 检查内容 |
|--------|----------|
| NodeName | 如果 Pod 指定了 nodeName，只保留匹配的节点 |
| NodeResourcesFit | 节点资源是否充足（CPU/内存/GPU）|
| NodePorts | 端口是否冲突 |
| TaintToleration | Pod 是否容忍节点的污点 |
| NodeAffinity | 节点亲和性 |
| PodTopologySpread | 拓扑分布约束 |

代码在 `pkg/scheduler/framework/plugins/` 下面。

比如资源检查的代码：

```go
func (f *NodeResourcesFit) Filter(ctx context.Context, state *framework.CycleState,
    pod *v1.Pod, nodeInfo *framework.NodeInfo) *framework.Status {
    
    // 计算 Pod 资源请求
    podResources := calcPodResourceRequest(pod)
    
    // 检查节点剩余资源
    if !nodeInfo.HaveEnoughResources(podResources) {
        return framework.NewStatus(framework.Unschedulable, "Insufficient resources")
    }
    
    return nil
}
```

预选通过后，通常只剩下部分节点（比如 10 个节点里通过 5 个）。

## 优选阶段（Priorities）

优选是给通过预选的节点打分，选最高分。

主要评分项：

| 插件名 | 评分依据 |
|--------|----------|
| NodeResourcesBalancedAllocation | 资源均衡程度 |
| NodeResourcesFit | 资源匹配度 |
| ImageLocality | 镜像是否已在节点上 |
| InterPodAffinity | Pod 间亲和性 |
| NodeAffinity | 节点亲和性 |

每个插件返回 0-100 的分数，最后加权平均。

```go
func prioritizeNodes(pod *v1.Pod, nodes []*v1.Node, plugins []framework.ScorePlugin) {
    scores := make(framework.NodeScoreList, len(nodes))
    
    // 并行打分
    workqueue.ParallelizeUntil(ctx, 16, len(nodes), func(index int) {
        nodeName := nodes[index].Name
        totalScore := int64(0)
        
        for _, plugin := range plugins {
            score := plugin.Score(ctx, state, pod, nodeName)
            totalScore += score.Score
        }
        
        scores[index] = framework.NodeScore{
            Name:  nodeName,
            Score: totalScore / int64(len(plugins)),
        }
    })
    
    return scores
}
```

## 抢占机制

如果 Pod 调度失败（比如资源不足），Scheduler 会尝试**抢占**——驱逐一些低优先级的 Pod，腾出资源。

抢占流程：

```
1. 找出所有可能被抢占的 Pod（优先级低于当前 Pod）
2. 评估抢占代价（要驱逐多少 Pod、影响多大）
3. 选择代价最小的方案
4. 执行抢占（删除低优先级 Pod）
5. 等待被抢占 Pod 删除后，重新调度当前 Pod
```

代码在 `pkg/scheduler/framework/plugins/defaultpreemption/default_preemption.go`。

抢占是个复杂操作，可能会导致服务中断，所以：

- 被抢占的 Pod 会收到 SIGTERM，有优雅终止的时间
- PDB（PodDisruptionBudget）可以保护 Pod 不被抢占

## 绑定过程

选好节点后，Scheduler 会执行绑定：

```go
func (sched *Scheduler) bind(ctx context.Context, pod *v1.Pod, nodeName string) error {
    binding := &v1.Binding{
        ObjectMeta: metav1.ObjectMeta{
            Name:      pod.Name,
            Namespace: pod.Namespace,
        },
        Target: v1.ObjectReference{
            Kind: "Node",
            Name: nodeName,
        },
    }
    
    // 调用 API 执行绑定
    err := sched.Client.CoreV1().Pods(pod.Namespace).Bind(ctx, binding, metav1.CreateOptions{})
    return err
}
```

绑定是异步执行的，Scheduler 不会等绑定完成就去调度下一个 Pod。

## 调度框架

K8s 1.18 之后引入了**调度框架**（Scheduling Framework），允许自定义调度插件。

插件扩展点：

- **PreFilter**：预处理
- **Filter**：预选
- **PostFilter**：预选后处理（抢占在这里）
- **Score**：优选
- **Reserve**：预留资源
- **Permit**：允许/拒绝调度
- **PreBind**：绑定前
- **Bind**：绑定
- **PostBind**：绑定后

自定义插件的例子：

```go
type MyPlugin struct{}

func (m *MyPlugin) Name() string {
    return "MyPlugin"
}

func (m *MyPlugin) Filter(ctx context.Context, state *framework.CycleState,
    pod *v1.Pod, nodeInfo *framework.NodeInfo) *framework.Status {
    
    // 自定义过滤逻辑
    if !checkMyCondition(nodeInfo.Node()) {
        return framework.NewStatus(framework.Unschedulable)
    }
    return nil
}
```

然后在 Scheduler 配置里启用：

```yaml
apiVersion: kubescheduler.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- schedulerName: default-scheduler
  plugins:
    filter:
      enabled:
      - name: MyPlugin
```

## 一些问题

1. **调度器是单点的**：虽然可以跑多个 Scheduler 实例，但只有一个在工作（leader election），其他是备用的。

2. **大规模集群性能**：节点数太多（几千个）的时候，预选阶段会很慢。可以开启动态调度（通过节点拓扑约束减少候选节点）。

3. **调度结果不可预期**：同样的 Pod，可能因为节点分数一样而被调度到不同节点。如果需要确定性，可以用 pod.spec.nodeName 硬指定。

## 参考

- 官方文档：https://kubernetes.io/docs/concepts/scheduling-eviction/
- 源码：https://github.com/kubernetes/kubernetes/tree/master/pkg/scheduler

---

如果有理解不对的地方欢迎指正，有些地方读得不太仔细。
