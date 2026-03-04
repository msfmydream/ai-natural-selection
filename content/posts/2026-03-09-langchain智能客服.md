---
title: "用 LangChain 搭了个智能客服，上线一周后的总结"
slug: langchain智能客服
date: 2026-03-09T09:00:00+08:00
draft: false
tags: ["ai", "langchain", "llm", "rag"]
categories: ["AI"]
description: "记录用 LangChain + GPT 搭建智能客服系统的过程，包括踩的坑和上线后的效果"
---

前段时间搞了个智能客服系统，用 LangChain + GPT-3.5 做的，现在已经上线跑了一周，记录一下过程。

## 需求背景

公司的客服团队每天要回答大量重复问题：产品怎么用、订单怎么查、退款流程是什么...

这些问题其实都有标准答案，但用户不看文档，就喜欢在对话框里问。我们想用 AI 来自动回复，减轻人工客服压力。

## 技术选型

考虑过几个方案：

1. **直接用 GPT-4**：简单，但问题是模型不知道我们产品的具体信息，而且 API 费用贵
2. **微调模型**：需要准备大量训练数据，成本太高
3. **RAG（检索增强生成）**：把我们的知识库给模型参考，让它基于这些内容回答

最后选了方案3，用 LangChain 实现。

## 系统架构

```
用户提问 --> 意图识别 --> 知识库检索 --> GPT 生成回答 --> 返回给用户
```

核心组件：

- **向量数据库**：存知识库的向量表示，用 FAISS
- **Embedding 模型**：把文本转成向量，用的 BAAI/bge-large-zh-v1.5（开源的，效果还行）
- **LLM**：GPT-3.5-turbo，便宜够用
- **LangChain**：胶水代码，串联各个组件

## 核心代码

### 1. 知识库准备

先把产品文档、FAQ 这些整理成文本文件，然后切分、向量化：

```python
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS

# 加载文档
loader = TextLoader("knowledge_base.txt")
documents = loader.load()

# 切分，每段500字，重叠50字
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
texts = text_splitter.split_documents(documents)

# 向量化
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-large-zh-v1.5")
vectorstore = FAISS.from_documents(texts, embeddings)
vectorstore.save_local("faiss_index")
```

这里有个坑：chunk_size 不能太大，否则检索的时候容易把不相关的内容也带进去；也不能太小，否则上下文不完整。500字是我们试出来比较合适的值。

### 2. 问答链

```python
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=ChatOpenAI(model_name="gpt-3.5-turbo"),
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
    memory=memory,
    return_source_documents=True
)

# 使用
result = qa_chain({"question": "怎么退款？"})
print(result["answer"])
```

### 3. 意图识别

不是所有问题都要走 RAG 流程。比如"转人工"这种指令，应该直接处理。

简单写了个分类器：

```python
def classify_intent(query: str) -> str:
    if any(word in query for word in ["人工", "客服", "找你们的人"]):
        return "human_handoff"
    elif any(word in query for word in ["投诉", "举报"]):
        return "complaint"
    else:
        return "faq"
```

复杂的意图识别可以用专门的小模型，但我们目前用关键词就够用了。

## 上线后的问题

### 问题1：幻觉

有时候 GPT 会瞎编，比如用户问"支持哪些支付方式"，它可能会说支持"比特币"（实际上不支持）。

解决办法：

1. Prompt 里加约束："只能基于提供的内容回答，不知道就说不知道"
2. 检索结果里带上来源，让用户知道回答来自哪篇文档
3. 敏感问题（如价格、政策）人工二次确认

### 问题2：上下文理解

多轮对话的时候，模型有时候会忘记之前说过什么。

比如：
- 用户："我订单号是 12345"
- 客服："好的，请问有什么问题？"
- 用户："什么时候发货？"
- 客服：（忘记订单号了）

这个问题用 ConversationBufferMemory 能缓解，但时间长了还是会丢上下文。

### 问题3：响应速度

完整的流程：检索（~200ms）+ GPT 生成（~2s），用户要等待 2-3 秒。

优化方案：

1. 把向量数据库放内存（FAISS 本来就很快）
2. 热点问题缓存
3. 流式输出，让用户看到回复在逐步生成

## 效果数据

跑了一周的统计：

| 指标 | 数值 |
|------|------|
| 总对话数 | 3,200 |
| AI 直接解决 | 68% |
| 转人工 | 32% |
| 用户满意度 | 4.2/5 |

68% 的问题不需要人工介入，整体还算满意。转人工的主要原因是：

- 问题太复杂，AI 解决不了（40%）
- 用户坚持要找人工（35%）
- AI 回答不满意（25%）

## 后续优化计划

1. **收集 bad case**：每周 review 一次转人工的对话，优化知识库
2. **Prompt 调优**：不同场景用不同的 prompt
3. **尝试其他模型**：Claude 3 Haiku 便宜又快，准备试试

## 代码开源

完整代码放 GitHub 了，有需要可以参考：
https://github.com/xxx/ai-customer-service

---

**踩坑总结**：

- RAG 确实比微调省事，但检索质量是关键
- Prompt 工程比想象中重要，同样的模型，prompt 好坏效果差很多
- 上线前一定要测试边界情况，特别是"不知道"的情况

有问题欢迎留言讨论。
