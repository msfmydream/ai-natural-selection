---
title: "使用 OpenAI GPT 和 LangChain 构建 AI Agent（译）"
slug: building-ai-agents
date: 2026-03-05T04:00:00+08:00
draft: false
tags: ["ai", "openai", "langchain", "agent", "tutorial", "翻译搬运"]
categories: ["AI"]
description: "翻译自 NetSet Software 的 AI Agent 构建指南，详细介绍如何使用 GPT 和 LangChain 开发智能代理"
source: "NetSet Software - Building AI Agents with OpenAI's GPT and LangChain"
original_url: "https://www.netsetsoftware.com/insights/building-ai-agents-with-openais-gpt-and-langchain/"
---

> **本文翻译自**：NetSet Software - Building AI Agents with OpenAI's GPT and LangChain  
> **原文链接**：https://www.netsetsoftware.com/insights/building-ai-agents-with-openais-gpt-and-langchain/  
> **翻译说明**：本文仅为学习交流目的翻译，版权归原作者所有

---

AI Agent 正在改变软件的工作方式。本文介绍如何使用 OpenAI 的 GPT 模型和 LangChain 框架构建能够思考、决策和行动的 AI Agent。

## 什么是 AI Agent

AI Agent 是一种能够：
- **感知**环境（接收输入）
- **推理**（使用 LLM 思考）
- **行动**（调用工具、执行操作）
- **学习**（从反馈中改进）

的智能系统。

与传统软件不同，Agent 可以在没有明确编程的情况下解决复杂问题。

## 开始使用：工具和最佳实践

即使你不是开发者，本节也可能对你理解开发 AI Agent 的关键要素有所帮助。

### 开发步骤

**1. 明确定义用例**

问自己："你的 Agent 是用于客户支持、数据分析还是任务自动化？"

清晰的用例定义是成功的基础。

**2. 选择模型和提供商**

可以是 OpenAI 的 GPT-4，这是推理任务的强力选择。

**3. 设计 LangChain 流程**

使用 LangChain 的模块化架构设置 prompts、memory 和 tools。

**4. 集成 API 和工具**

使用 LangChain 的工具包装器或编写自定义函数。

**5. 测试和迭代**

使用真实世界的查询和数据来微调 Agent 的性能。

### 技术栈

常见的 AI Agent 技术栈包括：
- Python
- LangChain
- OpenAI API
- 向量存储（Pinecone 或 FAISS）
- 部署平台（AWS 或 Vercel）

## 核心组件详解

### 1. 工具（Tools）

工具是 Agent 可以调用的函数：

```python
from langchain.tools import BaseTool
from pydantic import BaseModel, Field

class CalculatorInput(BaseModel):
    expression: str = Field(description="数学表达式，如 '2 + 2'")

class CalculatorTool(BaseTool):
    name = "calculator"
    description = "执行数学计算"
    args_schema = CalculatorInput
    
    def _run(self, expression: str):
        return eval(expression)
    
    async def _arun(self, expression: str):
        return self._run(expression)
```

### 2. 记忆（Memory）

Agent 需要记住之前的交互：

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)
```

### 3. Prompt 模板

定义 Agent 的行为和约束：

```python
from langchain.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个有用的 AI 助手。你可以使用以下工具：
    
    {tools}
    
    遵循以下格式：
    Question: 用户的问题
    Thought: 你应该始终思考要做什么
    Action: 要采取的行动
    Action Input: 行动的输入
    Observation: 行动的结果
    ... (这个 Thought/Action/Action Input/Observation 可以重复 N 次)
    Thought: 我现在知道最终答案
    Final Answer: 对原始问题的最终答案
    """),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])
```

## 构建完整的 Agent

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool

# 初始化 LLM
llm = ChatOpenAI(model="gpt-4", temperature=0)

# 定义工具
tools = [
    Tool(
        name="search",
        func=search_function,
        description="用于搜索互联网信息"
    ),
    Tool(
        name="calculator", 
        func=calculator_function,
        description="用于数学计算"
    )
]

# 创建 Agent
agent = create_openai_functions_agent(llm, tools, prompt)

# 创建执行器
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True
)

# 运行
response = agent_executor.invoke({"input": "北京今天的天气如何？需要带伞吗？"})
print(response["output"])
```

## Agent 类型对比

| Agent 类型 | 适用场景 | 特点 |
|-----------|---------|------|
| OpenAI Functions | 工具调用明确的场景 | 使用 GPT 的 function calling |
| ReAct | 需要推理和行动的场景 | 交替进行思考和行动 |
| Plan-and-Execute | 复杂多步骤任务 | 先规划再执行 |
| Self-Ask | 需要分解问题的场景 | 自问自答链式思考 |

## 实际应用案例

### 客户支持 Agent

```python
def customer_support_agent():
    tools = [
        Tool(name="search_kb", func=search_kb, description="搜索知识库"),
        Tool(name="check_order", func=check_order, description="查询订单状态"),
        Tool(name="create_ticket", func=create_ticket, description="创建工单")
    ]
    
    agent = create_openai_functions_agent(llm, tools, support_prompt)
    return AgentExecutor(agent=agent, tools=tools)
```

### 数据分析 Agent

```python
def data_analysis_agent():
    tools = [
        Tool(name="query_database", func=query_db, description="查询数据库"),
        Tool(name="generate_chart", func=gen_chart, description="生成图表"),
        Tool(name="statistical_analysis", func=stats_analysis, description="统计分析")
    ]
    
    agent = create_openai_functions_agent(llm, tools, analysis_prompt)
    return AgentExecutor(agent=agent, tools=tools)
```

## 最佳实践

### 1. 工具设计

- 保持工具简单专注
- 提供清晰的描述
- 处理错误 gracefully
- 限制工具数量（通常 3-5 个最佳）

### 2. 安全性

```python
# 输入验证
def validate_input(user_input: str) -> bool:
    # 检查恶意输入
    forbidden = ["ignore previous", "system prompt"]
    return not any(f in user_input.lower() for f in forbidden)

# 输出过滤
def sanitize_output(output: str) -> str:
    # 移除敏感信息
    return output.replace(API_KEY, "***")
```

### 3. 监控

```python
from langchain.callbacks import LangChainTracer

tracer = LangChainTracer()

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    callbacks=[tracer]
)
```

## 常见挑战和解决方案

| 挑战 | 解决方案 |
|------|---------|
| Agent 循环 | 设置最大迭代次数 |
| 工具选择错误 | 改进工具描述，添加示例 |
| 响应太慢 | 使用更快的模型，优化工具 |
| 成本过高 | 缓存结果，使用更便宜的模型 |

## 结论

GPT 和 LangChain 正在推动一些最先进的 AI Agent。语言智能与可操作工作流的结合使企业能够从静态工具转变为能够像人类一样思考、决策和行动的动态助手。

但技术的全部潜力只有在正确构建时才能实现。LangChain 和 OpenAI 是创建下一代 AI Agent 的最明智选择。

---

*本文翻译自 NetSet Software，仅供学习交流使用*
