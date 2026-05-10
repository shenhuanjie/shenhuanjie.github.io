---
title: 从 ReAct 到 Agentic RAG：推理框架演进
date: '2026-05-11 11:00:00'
updated: '2026-05-11 11:00:00'
excerpt: >-
  本文深入解析 AI Agent 推理框架的发展历程，从 ReAct 的推理-行动协作，到 Agentic RAG 的知识增强自主智能体，全面梳理关键技术的演进脉络与实现细节。
categories:
  - AI
tags:
  - AI Agent
  - ReAct
  - Agentic RAG
  - RAG
  - 推理框架
  - 思维链
permalink: /post/react-to-agentic-rag-evolution-20260511.html
comments: true
toc: true
---

> T47.1 AI Agent 系列专题 - 第二篇（基础概念）✅

# 一、推理框架概述

## 1.1 为什么需要推理框架

大型语言模型（LLM）本身具备强大的知识储备和推理能力，但默认情况下：
- 无法实时获取最新信息
- 无法访问私有知识库
- 无法验证生成内容的准确性
- 缺乏主动规划能力

**推理框架**的核心目标，就是解决上述问题，让 LLM 能够：
1. 主动规划行动路径
2. 调用外部工具和知识源
3. 根据反馈调整策略
4. 完成复杂多步骤任务

## 1.2 推理框架演进历程

```
┌──────────────────────────────────────────────────────────────────┐
│                    推理框架演进时间线                              │
└──────────────────────────────────────────────────────────────────┘

2017  │  Chain-of-Thought (CoT)
      │  思维链：分步推理
      │
2018  │  Self-Consistency
      │  自我一致性：多路径投票
      │
2022  │  ReAct
      │  推理+行动协同
      │
2023  │  Toolformer / Tool Learning
      │  工具学习框架
      │
2023  │  AutoGPT / BabyAGI
      │  自主Agent雏形
      │
2024  │  Agentic RAG
      │  知识增强的智能体
      │
2024  │  Multi-Agent Collaboration
      │  多Agent协作框架
```

---

# 二、Chain-of-Thought (CoT) 思维链

## 2.1 核心思想

CoT 由 Google 在 2022 年提出，核心思想是：**让模型在给出最终答案之前，先生成中间的推理步骤**。

## 2.2 实现原理

```python
# 标准提示 vs CoT 提示

# 标准提示
prompt_standard = """
Q: 小明有5个苹果，小红给了他又3个苹果。他吃掉了1个，还剩多少？
A: 7个
"""

# CoT 提示
prompt_cot = """
Q: 小明有5个苹果，小红给了他又3个苹果。他吃掉了1个，还剩多少？
A: 让我们一步步思考：
   1. 小明一开始有5个苹果
   2. 小红又给了他3个，现在有 5 + 3 = 8 个
   3. 他吃掉了1个，还剩 8 - 1 = 7 个
   所以答案是7个。
"""
```

## 2.3 CoT 的局限性

- 仅生成文本推理，未与外部环境交互
- 无法验证推理正确性
- 无法根据结果调整策略

---

# 三、ReAct 框架详解

## 3.1 核心思想

**ReAct = Reasoning + Acting**

ReAct 由普林斯顿大学和 Google 在 2023 年提出，将**推理**和**行动**紧密结合，形成一个迭代循环：

```
Thought → Action → Observation → Thought → Action → ...
```

## 3.2 工作流程

```
┌──────────────────────────────────────────────────────────────────┐
│                      ReAct 工作流程                               │
└──────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   用户输入   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           Thought (思考)                  │
│   基于当前状态决定下一步做什么             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           Action (行动)                   │
│   调用工具：搜索、查数据库、执行代码...     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Observation (观察)                │
│   获取行动结果                           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌───────┴───────┐
         │  任务完成？    │
         └───────┬───────┘
           Yes   │   No
                 │    │
                 ▼    │
            ┌─────────┐
            │ 返回结果 │ ◄──── 继续循环
            └─────────┘
```

## 3.3 代码实现

```python
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class ReActStep:
    """ReAct 单步执行记录"""
    thought: str
    action: str
    action_input: Dict[str, Any]
    observation: str

class ReActAgent:
    """ReAct 推理框架实现"""

    def __init__(self, llm, tools: Dict[str, callable]):
        self.llm = llm
        self.tools = tools

    def run(self, question: str, max_iterations: int = 5) -> str:
        """
        执行 ReAct 推理

        Args:
            question: 用户问题
            max_iterations: 最大迭代次数
        """
        steps = []
        context = ""

        for i in range(max_iterations):
            # 1. Thought: 生成思考
            thought_prompt = f"""
            问题：{question}
            已有信息：{context}

            你需要决定下一步做什么。使用以下格式：
            Thought: 你现在的思考
            Action: 要执行的行动（从可用工具中选择）
            Action Input: 行动参数（JSON格式）
            """
            thought_response = self.llm.generate(thought_prompt)
            thought, action, action_input = self._parse_response(thought_response)

            # 2. Action: 执行行动
            if action == "finish":
                # 任务完成
                return action_input['answer']

            if action in self.tools:
                observation = self.tools[action](**action_input)
            else:
                observation = f"Error: Unknown action '{action}'"

            # 3. Observation: 记录观察
            steps.append(ReActStep(
                thought=thought,
                action=action,
                action_input=action_input,
                observation=str(observation)
            ))

            # 更新上下文
            context += f"\n行动 {i+1}: {action}\n结果: {observation}"

        return "达到最大迭代次数，未能完成任务"

    def _parse_response(self, response: str) -> tuple:
        """解析 LLM 输出"""
        lines = response.strip().split('\n')
        thought = action = action_input = ""

        for line in lines:
            if line.startswith('Thought:'):
                thought = line[8:].strip()
            elif line.startswith('Action:'):
                action = line[7:].strip()
            elif line.startswith('Action Input:'):
                action_input = line[13:].strip()

        return thought, action, action_input
```

## 3.4 ReAct 的优势与局限

**优势：**
- 推理过程透明可追溯
- 可与任意外部工具集成
- 适合复杂多步骤任务

**局限：**
- 依赖 LLM 的推理质量
- 行动空间受限于预设工具
- 缺乏全局规划和自我反思机制

---

# 四、Toolformer 与工具学习

## 4.1 背景

Toolformer（Meta, 2023）探索了如何让 LLM **自主学习使用工具**，而不需要人工预设工具调用。

## 4.2 核心思想

```
传统方式：
  人工定义工具 → 提示词调用

Toolformer 方式：
  LLM 自动发现工具 → 自我训练调用 → 泛化使用
```

## 4.3 工具分类

| 类型 | 示例 | 用途 |
|------|------|------|
| 搜索引擎 | Google, Bing | 获取实时信息 |
| 知识库 | Wikipedia, 私有文档 | 领域知识检索 |
| 计算工具 | Calculator, Python REPL | 数学计算、代码执行 |
| API | Weather, Calendar, Email | 外部服务集成 |
| 数据库 | SQL, Vector DB | 结构化/向量查询 |

---

# 五、Agentic RAG：知识增强的智能体

## 5.1 为什么需要 Agentic RAG

传统 RAG 的局限性：
- **被动检索**：只在被问到时检索
- **单次检索**：无法迭代优化检索结果
- **缺乏推理**：检索与生成割裂

**Agentic RAG** 将 RAG 与 Agent 框架结合，实现：
- **主动规划**：判断何时需要检索
- **迭代优化**：根据反馈优化检索策略
- **多步推理**：复杂问题多跳检索

## 5.2 Agentic RAG 架构

```
┌──────────────────────────────────────────────────────────────────┐
│                    Agentic RAG 架构                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      Agent 核心层                                 │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  规划器     │  │  记忆模块   │  │  工具集     │               │
│  │  Planner    │  │  Memory     │  │  Tools      │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    ┌─────┴─────┐                                 │
│                    │  控制器   │                                 │
│                    │ Controller│                                 │
│                    └─────┬─────┘                                 │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      RAG 执行层                                   │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  查询重写   │  │  检索引擎   │  │  生成器     │               │
│  │Query Rewrite│  │  Retrieval  │  │  Generator  │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

## 5.3 核心组件实现

### 5.3.1 查询重写器（Query Rewriter）

```python
class QueryRewriter:
    """将原始问题重写为多个检索query"""

    def __init__(self, llm):
        self.llm = llm

    def rewrite(self, query: str) -> List[str]:
        """
        生成多个检索query
        """
        prompt = f"""
        问题：{query}

        请将这个问题重写为3个不同的检索query，用于从知识库中检索相关信息。
        每个query应该从不同角度提问，以确保检索的全面性。

        输出格式：
        1. [第一个query]
        2. [第二个query]
        3. [第三个query]
        """
        response = self.llm.generate(prompt)
        queries = [q.strip() for q in response.split('\n') if q.strip()]
        return queries[:3]
```

### 5.3.2 路由决策器（Router）

```python
class Router:
    """决定查询应该使用哪个知识库或工具"""

    def __init__(self, llm, knowledge_bases: Dict[str, Any]):
        self.llm = llm
        self.kb = knowledge_bases

    def route(self, query: str) -> List[str]:
        """
        路由决策
        返回需要查询的知识库列表
        """
        prompt = f"""
        问题：{query}

        可用知识库：
        {', '.join(self.kb.keys())}

        决定需要查询哪些知识库来回答这个问题。
        可以选择多个知识库，如果不需要外部知识则返回"无需检索"。
        """
        response = self.llm.generate(prompt)

        # 解析响应用于确定要查询的知识库
        selected = []
        for kb_name in self.kb.keys():
            if kb_name.lower() in response.lower():
                selected.append(kb_name)

        return selected if selected else ["无需检索"]
```

### 5.3.3 迭代检索器（Iterative Retriever）

```python
class IterativeRetriever:
    """迭代优化检索"""

    def __init__(self, vector_store, reranker):
        self.vector_store = vector_store
        self.reranker = reranker

    def retrieve(self, query: str, max_iterations: int = 3) -> List[Document]:
        """
        迭代检索
        """
        all_docs = []
        current_query = query

        for i in range(max_iterations):
            # 检索
            docs = self.vector_store.search(current_query, top_k=10)

            # 重排序
            reranked = self.reranker.rerank(query, docs)

            # 检查是否需要继续迭代
            if self._is_satisfied(reranked, query):
                break

            # 生成下一个检索query
            current_query = self._generate_next_query(
                query, reranked
            )

            all_docs.extend(reranked)

        # 去重并返回
        return self._deduplicate(all_docs)

    def _is_satisfied(self, docs: List[Document], query: str) -> bool:
        """检查检索结果是否满足需求"""
        # 检查是否包含答案
        # 检查是否有多跳信息
        return len(docs) >= 3  # 简化判断

    def _generate_next_query(self, original: str, docs: List[Document]) -> str:
        """基于当前结果生成下一个检索query"""
        # 实现查询扩展逻辑
        pass
```

### 5.3.4 Agentic RAG 主流程

```python
class AgenticRAG:
    """Agentic RAG 主类"""

    def __init__(self, llm, components: Dict[str, Any]):
        self.llm = llm
        self.query_rewriter = components['query_rewriter']
        self.router = components['router']
        self.retriever = components['retriever']
        self.generator = components['generator']
        self.memory = components['memory']

    def run(self, question: str) -> str:
        """
        执行 Agentic RAG
        """
        # 1. 记忆检查 - 是否有相关上下文
        relevant_memory = self.memory.retrieve(question)

        # 2. 路由决策 - 确定需要查询的知识库
        target_kbs = self.router.route(question)

        if target_kbs == ["无需检索"]:
            # 直接生成
            context = relevant_memory
            return self.generator.generate(question, context)

        # 3. 查询重写 - 生成多个检索query
        queries = self.query_rewriter.rewrite(question)

        # 4. 迭代检索
        all_docs = []
        for kb in target_kbs:
            for query in queries:
                docs = self.retriever.retrieve(query, kb=kb)
                all_docs.extend(docs)

        # 5. 整合上下文
        context = relevant_memory + all_docs

        # 6. 生成答案
        answer = self.generator.generate(question, context)

        # 7. 更新记忆
        self.memory.add(question, answer)

        return answer
```

---

# 六、框架对比总结

| 框架 | 推理方式 | 工具调用 | 记忆管理 | 适用场景 |
|------|----------|----------|----------|----------|
| CoT | 单步推理 | 无 | 无 | 简单推理任务 |
| ReAct | 推理-行动循环 | 有 | 无 | 中等复杂任务 |
| Toolformer | 自动工具学习 | 自动发现 | 无 | 工具集成场景 |
| Agentic RAG | 多步推理+检索 | 有 | 有 | 知识密集任务 |

## 选型建议

- **简单问答** → CoT 足够
- **需要调用工具** → ReAct
- **知识库检索为主** → Agentic RAG
- **多工具复杂任务** → LangGraph/AutoGen

---

# 七、总结

从 CoT 到 Agentic RAG，推理框架的发展呈现以下趋势：

1. **从被动到主动**：从等待问题到主动规划
2. **从单步到多步**：从一次性推理到迭代优化
3. **从无工具到工具集成**：从纯文本推理到外部世界交互
4. **从无记忆到有记忆**：支持跨会话知识积累

Agentic RAG 代表了当前最前沿的 RAG 演进方向，它将知识检索与智能体推理深度融合，为构建企业级 AI 应用提供了坚实的技术基础。

---

**相关阅读：**
- [AI Agent 是什么？定义、架构与核心能力](/post/ai-agent-what-is-definition-architecture-core-capabilities-20260511.html)
- [单Agent vs 多Agent：何时使用哪种架构](/post/single-agent-vs-multi-agent-architecture-20260511.html)
