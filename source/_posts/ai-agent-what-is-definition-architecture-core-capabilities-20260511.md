---
title: AI Agent 是什么？定义、架构与核心能力
date: '2026-05-11 10:00:00'
updated: '2026-05-11 10:00:00'
excerpt: >-
  本文深入解析 AI Agent 的定义、核心组件（感知、规划、行动、记忆）、技术架构，以及当前主流的 Agent 框架对比，帮助读者建立对 AI Agent 的系统性认知。
categories:
  - AI
tags:
  - AI Agent
  - LLM
  - 人工智能
  - Agent架构
  - 自主智能体
permalink: /post/ai-agent-what-is-definition-architecture-core-capabilities-20260511.html
comments: true
toc: true
---

> T47.1 AI Agent 系列专题 - 第一篇（基础概念）✅

# 一、AI Agent 的定义

## 1.1 什么是 AI Agent

AI Agent（人工智能智能体）是一种能够**自主感知环境、做出决策并执行行动**以完成特定目标的智能系统。与传统程序不同，AI Agent 不依赖预设的固定流程，而是基于大型语言模型（LLM）的推理能力，动态规划行动路径。

用一句话概括：**AI Agent = LLM（大模型）+ 规划能力 + 工具使用 + 记忆管理**

## 1.2 AI Agent 与传统程序的区别

| 特性 | 传统程序 | AI Agent |
|------|----------|----------|
| 决策方式 | 预设规则/逻辑分支 | LLM 推理生成 |
| 流程灵活性 | 固定流程，难以适应新场景 | 动态规划，可应对未知场景 |
| 输入处理 | 结构化数据 | 自然语言、图像、文档等多模态 |
| 错误处理 | 异常捕获处理 | 自我反思、尝试替代方案 |
| 交互方式 | 命令式 | 对话式/自主式 |

## 1.3 AI Agent 的核心特征

根据 OpenAI 的研究，一个成熟的 AI Agent 应具备以下核心特征：

1. **自主性（Autonomy）**：能够独立完成任务，无需人类实时干预
2. **感知能力（Perception）**：能够理解多模态输入（文本、图像、音频）
3. **推理能力（Reasoning）**：基于上下文进行逻辑推理和决策
4. **行动能力（Action）**：能够调用工具、执行操作、影响环境
5. **学习能力（Learning）**：从交互中持续优化性能

---

# 二、AI Agent 的技术架构

## 2.1 核心组件

一个完整的 AI Agent 系统由以下四大核心组件构成：

```
┌─────────────────────────────────────────────────────────────┐
│                        AI Agent                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   感知模块   │ -> │   规划模块   │ -> │   行动模块   │     │
│  │  Perception │    │   Planning  │    │    Action   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│          ↑                                    │             │
│          └────────────    记忆模块    ◄───────┘             │
│                      Memory                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.1.1 感知模块（Perception）

感知模块负责从外部环境获取信息并将其转换为 Agent 可处理的内部表示。

**主要功能：**
- 多模态信息解析（文本、图像、音频、文档）
- 用户意图识别
- 环境状态监测
- 上下文信息提取

**技术实现：**
```python
class PerceptionModule:
    """感知模块示例"""
    def __init__(self, llm, vision_model=None):
        self.llm = llm
        self.vision_model = vision_model

    def process(self, input_data):
        """
        处理多种类型的输入
        """
        if isinstance(input_data, str):
            return self._process_text(input_data)
        elif isinstance(input_data, Image):
            return self._process_image(input_data)
        elif isinstance(input_data, Audio):
            return self._process_audio(input_data)

    def _process_text(self, text):
        """文本处理"""
        return {
            'type': 'text',
            'content': text,
            'embedding': self.llm.embed(text)
        }

    def _process_image(self, image):
        """图像处理"""
        description = self.vision_model.describe(image)
        return {
            'type': 'image',
            'content': description,
            'embedding': self.vision_model.extract_features(image)
        }
```

### 2.1.2 规划模块（Planning）

规划模块是 Agent 的"大脑"，负责分析任务、制定行动策略。

**核心能力：**
- 任务分解（Task Decomposition）
- 目标排序（Goal Prioritization）
- 路径规划（Path Planning）
- 自我反思（Self-Reflection）

**常见规划方法：**

```python
class PlanningModule:
    """规划模块示例"""

    def plan(self, task, context):
        """
        基于不同策略进行任务规划
        """
        # 方法1：单一推理链（Chain-of-Thought）
        plan = self.chain_of_thought(task, context)

        # 方法2：多路径探索（Tree-of-Thought）
        # plan = self.tree_of_thought(task, context)

        # 方法3：推理与行动结合（ReAct）
        # plan = self.react(task, context)

        return plan

    def chain_of_thought(self, task, context):
        """
        思维链模式：逐步推理
        """
        prompt = f"""
        任务：{task}
        上下文：{context}

        请逐步推理完成这个任务，展示你的思考过程。
        """
        reasoning = self.llm.generate(prompt)
        return {
            'strategy': 'cot',
            'steps': self._parse_steps(reasoning),
            'final_answer': reasoning[-1]
        }

    def tree_of_thought(self, task, context):
        """
        思维树模式：探索多个可能的解决方案
        """
        # 生成多个候选方案
        candidates = self.llm.generatemany(
            f"针对任务'{task}'，给出3种不同的解决思路",
            n=3
        )

        # 评估每个方案
        evaluated = [self._evaluate(c, context) for c in candidates]

        # 选择最优方案
        best = max(evaluated, key=lambda x: x['score'])
        return {
            'strategy': 'tot',
            'candidates': candidates,
            'selected': best
        }
```

### 2.1.3 行动模块（Action）

行动模块负责执行规划模块生成的行动，并处理执行结果。

**行动类型：**
1. **工具调用（Tool Use）**：调用外部 API、函数、数据库
2. **信息检索（Retrieval）**：从知识库获取相关信息
3. **内容生成（Generation）**：生成文本、代码、图像等
4. **环境交互（Interaction）**：与用户或其他 Agent 交互

```python
class ActionModule:
    """行动模块示例"""

    def __init__(self):
        self.tools = self._register_tools()

    def _register_tools(self):
        """注册可用工具"""
        return {
            'web_search': self.web_search,
            'calculator': self.calculator,
            'code_executor': self.code_executor,
            'database_query': self.database_query,
            'file_reader': self.file_reader,
        }

    def execute(self, action):
        """
        执行行动
        """
        tool_name = action['tool']
        params = action['parameters']

        if tool_name in self.tools:
            result = self.tools[tool_name](**params)
            return {
                'success': True,
                'result': result,
                'tool': tool_name
            }
        else:
            return {
                'success': False,
                'error': f'Unknown tool: {tool_name}'
            }

    def web_search(self, query, **kwargs):
        """网页搜索工具"""
        # 实现搜索逻辑
        pass

    def calculator(self, expression, **kwargs):
        """计算器工具"""
        return eval(expression)
```

### 2.1.4 记忆模块（Memory）

记忆模块是 Agent 保持连贯性和持续学习的关键。

**记忆类型：**

| 类型 | 特点 | 存储方式 | 用途 |
|------|------|----------|------|
| 短期记忆 | 临时、有限 | 工作上下文 | 当前任务处理 |
| 长期记忆 | 持久、容量大 | 向量数据库/知识图谱 | 跨会话知识 |
| 情景记忆 | 事件序列 | 时间索引存储 | 经验回顾 |

```python
class MemoryModule:
    """记忆模块示例"""

    def __init__(self, vector_store):
        self.vector_store = vector_store
        self.short_term = []  # 短期记忆
        self.long_term = []    # 长期记忆

    def add_short_term(self, item):
        """添加短期记忆"""
        self.short_term.append({
            'content': item,
            'timestamp': time.time()
        })
        # 限制短期记忆长度
        if len(self.short_term) > MAX_SHORT_TERM:
            self.short_term.pop(0)

    def add_long_term(self, item, metadata=None):
        """添加长期记忆（向量化存储）"""
        embedding = self.embed(item)
        self.vector_store.insert(
            vector=embedding,
            text=item,
            metadata=metadata or {}
        )
        self.long_term.append(item)

    def retrieve(self, query, top_k=5):
        """检索相关记忆"""
        query_embedding = self.embed(query)

        # 合并搜索短期和长期记忆
        short_results = self._search_short_term(query, top_k)
        long_results = self.vector_store.search(query_embedding, top_k)

        return {
            'short_term': short_results,
            'long_term': long_results
        }

    def _search_short_term(self, query, top_k):
        """在短期记忆中搜索"""
        # 简单实现：基于关键词匹配
        keywords = query.lower().split()
        scored = []
        for item in self.short_term:
            score = sum(1 for kw in keywords if kw in item['content'].lower())
            if score > 0:
                scored.append((score, item))
        scored.sort(reverse=True)
        return [item for _, item in scored[:top_k]]
```

## 2.2 Agent 工作流程

```
┌──────────────────────────────────────────────────────────────────┐
│                        Agent 工作流程                              │
└──────────────────────────────────────────────────────────────────┘

     ┌─────────┐
     │   用户   │
     │   输入   │
     └────┬────┘
          │
          ▼
┌─────────────────┐
│   感知模块      │  解析用户输入，理解意图
│   (Perception) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   规划模块      │  分解任务，制定执行计划
│   (Planning)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   行动模块      │  调用工具，执行操作
│   (Action)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   记忆模块      │  存储经验，更新上下文
│   (Memory)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   评估结果      │  检查目标达成，必要时重试
│   (Evaluation)  │
└────────┬────────┘
         │
         └──► 返回给用户
```

---

# 三、主流 Agent 框架对比

## 3.1 框架概览

| 框架 | 开发方 | 特点 | 适用场景 |
|------|--------|------|----------|
| LangGraph | LangChain | 状态机图结构，支持复杂流程 | 企业级应用 |
| AutoGen | Microsoft | 多Agent协作，代码执行 | 编程助手 |
| CrewAI | CrewAI | 角色扮演，任务编排 | 自动化工作流 |
| LlamaIndex | LlamaIndex | 知识检索增强 | RAG 应用 |
| DSPy | Stanford | 编程式提示优化 | 提示工程 |

## 3.2 LangGraph 框架详解

LangGraph 是目前最流行的 Agent 开发框架之一，它使用**有向图**来定义 Agent 的工作流程。

```python
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from typing import TypedDict, Annotated
import operator

# 定义状态
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    task: str
    result: str

# 创建图
graph = StateGraph(AgentState)

# 添加节点
graph.add_node("input", input_node)
graph.add_node("planner", planner_node)
graph.add_node("executor", executor_node)
graph.add_node("output", output_node)

# 定义边
graph.add_edge("input", "planner")
graph.add_edge("planner", "executor")
graph.add_edge("executor", "output")
graph.add_edge("output", END)

# 编译图
app = graph.compile()
```

## 3.3 AutoGen 框架详解

AutoGen 是微软开源的多Agent框架，专注于**多Agent协作**和**代码执行**。

```python
from autogen import ConversableAgent, GroupChat, GroupChatManager

# 创建助手Agent
assistant = ConversableAgent(
    name="assistant",
    system_message="你是一个专业的Python编程助手。",
    llm_config={"model": "gpt-4"}
)

# 创建代码执行Agent
code_executor = ConversableAgent(
    name="code_executor",
    system_message="你负责执行Python代码并返回结果。",
    code_execution_config={"use_docker": True}
)

# 创建组聊管理器
group_chat = GroupChat(
    agents=[assistant, code_executor],
    messages=[],
    max_round=10
)

manager = GroupChatManager(groupchat=group_chat)

# 启动对话
assistant.initiate_chat(
    manager,
    message="编写一个函数计算斐波那契数列第n项。"
)
```

## 3.4 CrewAI 框架详解

CrewAI 以**角色扮演**和**任务编排**为核心特点。

```python
from crewai import Agent, Task, Crew

# 定义Agent（具有特定角色的AI）
researcher = Agent(
    role="研究分析师",
    goal="收集并分析最新AI技术动态",
    backstory="你是一位资深的技术研究员，擅长从多渠道获取信息。",
    tools=[search_tool, browse_tool]
)

writer = Agent(
    role="技术作家",
    goal="将复杂技术内容转化为易懂的报告",
    backstory="你是一位专业技术作家，擅长清晰表达。",
    tools=[write_tool]
)

# 定义任务
research_task = Task(
    description="调研2024年AI Agent最新进展",
    agent=researcher
)

write_task = Task(
    description="撰写研究报告",
    agent=writer,
    context=[research_task]  # 依赖research_task的输出
)

# 创建Crew并执行
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task]
)

result = crew.kickoff()
```

---

# 四、总结

AI Agent 代表了人工智能从**被动响应**向**主动执行**的关键转变。通过感知、规划、行动、记忆四大核心组件的协作，Agent 能够：

1. **自主完成复杂任务**：无需人类每一步指导
2. **动态适应新场景**：基于推理而非固定规则
3. **持续学习和优化**：通过记忆积累经验
4. **调用外部工具**：扩展能力边界

掌握 AI Agent 的核心概念和架构，是构建智能应用的基础。下一篇文章我们将深入探讨 **ReAct 到 Agentic RAG 的推理框架演进**。

---

**相关阅读：**
- [从 ReAct 到 Agentic RAG：推理框架演进](/post/react-to-agentic-rag-evolution-20260511.html)
- [单Agent vs 多Agent：何时使用哪种架构](/post/single-agent-vs-multi-agent-architecture-20260511.html)
