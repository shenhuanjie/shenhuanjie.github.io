---
title: 单Agent vs 多Agent：何时使用哪种架构
date: '2026-05-11 12:00:00'
updated: '2026-05-11 12:00:00'
excerpt: >-
  本文深入对比单Agent与多Agent架构的优劣，分析各自适用场景，并提供架构选择决策框架，帮助开发者在实际项目中做出正确的技术选型。
categories:
  - AI
tags:
  - AI Agent
  - Multi-Agent
  - 架构设计
  - Agent协作
  - 系统设计
permalink: /post/single-agent-vs-multi-agent-architecture-20260511.html
comments: true
toc: true
---

> T47.1 AI Agent 系列专题 - 第三篇（基础概念）✅

# 一、架构选择的重要性

## 1.1 背景

在构建 AI Agent 系统时，开发者面临的第一个关键决策是：**应该使用单Agent还是多Agent架构？**

这个选择会直接影响：
- 系统的复杂度和开发成本
- 任务处理的准确性和效率
- 系统的可扩展性和维护性
- 最终的用户体验

## 1.2 两种架构的直观对比

```
┌─────────────────────────────────┬─────────────────────────────────┐
│           单 Agent 架构          │          多 Agent 架构           │
├─────────────────────────────────┼─────────────────────────────────┤
│                                 │                                 │
│     ┌─────────────────┐         │     ┌─────────┐  ┌─────────┐   │
│     │                 │         │     │ Agent A │  │ Agent B │   │
│     │   ┌───────────┐ │         │     └────┬────┘  └────┬────┘   │
│     │   │  Single   │ │         │          │            │        │
│     │   │   Agent   │ │         │          └─────┬──────┘        │
│     │   └───────────┘ │         │           ┌─────┴─────┐         │
│     │                 │         │           │ Coordinator│         │
│     └────────┬────────┘         │           └─────┬─────┘         │
│              │                  │          ┌──────┴──────┐        │
│              │                  │     ┌────┴────┐  ┌────┴────┐    │
│              ▼                  │     │SubAgent1│  │SubAgent2│    │
│         ┌────────┐              │     └─────────┘  └─────────┘    │
│         │  输出  │              │                                 │
│         └────────┘              │                                 │
└─────────────────────────────────┴─────────────────────────────────┘
```

---

# 二、单Agent架构详解

## 2.1 什么是单Agent架构

单Agent架构是指整个系统围绕**一个核心Agent**构建，所有任务都由这个Agent处理。Agent可能配备多个工具，但决策和执行都集中在同一实体。

## 2.2 核心特征

```
单Agent架构特征：
├── 单一决策中心
├── 共享上下文和记忆
├── 工具集合（Tool Use）
├── 顺序或并行任务执行
└── 统一输出接口
```

## 2.3 典型实现

```python
class SingleAgent:
    """单Agent架构示例"""

    def __init__(self, llm, tools: List[callable], memory: Memory):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
        self.memory = memory

    def process(self, task: str) -> str:
        """
        处理单一任务
        """
        # 1. 理解任务
        understanding = self.llm.generate(f"理解任务: {task}")

        # 2. 规划步骤
        plan = self.plan(understanding)

        # 3. 顺序执行
        results = []
        for step in plan:
            result = self.execute_step(step)
            results.append(result)
            self.memory.add_step(step, result)

        # 4. 生成最终输出
        return self.synthesize(results)

    def plan(self, task: str) -> List[dict]:
        """规划任务步骤"""
        prompt = f"""
        任务：{task}
        可用工具：{list(self.tools.keys())}

        将任务分解为步骤，并选择每步使用的工具。
        """
        response = self.llm.generate(prompt)
        return self._parse_plan(response)

    def execute_step(self, step: dict) -> str:
        """执行单个步骤"""
        tool_name = step['tool']
        params = step['parameters']

        if tool_name in self.tools:
            return self.tools[tool_name](**params)
        else:
            return f"Error: Unknown tool {tool_name}"

    def process_batch(self, tasks: List[str]) -> List[str]:
        """
        批量处理任务（并行）
        """
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(self.process, task) for task in tasks]
            return [f.result() for f in futures]
```

## 2.4 适用场景

| 场景 | 说明 | 示例 |
|------|------|------|
| 简单问答 | 单一问题快速响应 | FAQ 机器人 |
| 单一工具调用 | 只需使用1-2个工具 | 天气查询、日程管理 |
| 线性流程 | 任务可以顺序执行 | 文章撰写、数据格式化 |
| 资源受限 | 计算资源有限 | 边缘设备部署 |
| 快速原型 | 需要快速验证概念 | POC 开发 |

## 2.5 优势与劣势

**优势：**
- **简单直观**：架构清晰，易于理解和实现
- **低延迟**：无需多Agent通信开销
- **成本可控**：单一LLM调用，成本可预测
- **易于调试**：问题定位简单，流程透明

**劣势：**
- **扩展性有限**：任务复杂度增加时，Agent负担加重
- **容错性差**：单点故障影响整体
- **并行能力弱**：难以同时处理多个相关子任务
- **专业性受限**：通用Agent在特定领域不如专家Agent

---

# 三、多Agent架构详解

## 3.1 什么是多Agent架构

多Agent架构由**多个专业化Agent组成**，每个Agent负责特定职责，通过协作完成复杂任务。

## 3.2 核心特征

```
多Agent架构特征：
├── 专业化分工（Role-based）
├── 分布式决策
├── Agent间通信协议
├── 协调器（Coordinator）
├── 共享或私有记忆
└── 协作决策机制
```

## 3.3 协作模式

### 3.3.1 层级模式（Hierarchical）

```
┌─────────────────────────────────────┐
│           Orchestrator              │
│         （协调器/编排器）              │
└───────────────┬─────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌───────┐  ┌───────┐  ┌───────┐
│Agent A│  │Agent B│  │Agent C│
│(专家1)│  │(专家2)│  │(专家3)│
└───────┘  └───────┘  └───────┘
```

```python
class HierarchicalMultiAgent:
    """层级式多Agent架构"""

    def __init__(self, orchestrator, sub_agents: Dict[str, Agent]):
        self.orchestrator = orchestrator
        self.sub_agents = sub_agents

    def process(self, task: str) -> str:
        """
        层级处理流程
        """
        # 1. 协调器分析任务
        task_analysis = self.orchestrator.analyze(task)

        # 2. 协调器决定分配给哪些子Agent
        assignments = self.orchestrator.assign(task_analysis)

        # 3. 并行执行子任务
        results = {}
        with ThreadPoolExecutor() as executor:
            futures = {
                agent_name: executor.submit(
                    self.sub_agents[agent_name].process,
                    assignment['task']
                )
                for agent_name, assignment in assignments.items()
            }
            results = {name: f.result() for name, f in futures.items()}

        # 4. 协调器整合结果
        return self.orchestrator.synthesize(results)
```

### 3.3.2 对等模式（Peer-to-Peer）

```
┌─────────────────────────────────────┐
│           Agent Network             │
├─────────────────────────────────────┤
│                                     │
│    ┌───────┐    ┌───────┐           │
│    │Agent A│◄──►│Agent B│           │
│    └───┬───┘    └───┬───┘           │
│        │           │               │
│        └─────┬─────┘               │
│              ▼                     │
│         ┌───────┐                  │
│         │Agent C│                  │
│         └───────┘                  │
│                                     │
└─────────────────────────────────────┘
```

```python
class PeerToPeerAgent:
    """对等式多Agent"""

    def __init__(self, agents: List[Agent], communication_protocol):
        self.agents = {a.name: a for a in agents}
        self.protocol = communication_protocol

    def broadcast(self, sender: str, message: dict):
        """广播消息给所有Agent"""
        for name, agent in self.agents.items():
            if name != sender:
                agent.receive(message)

    def send_message(self, from_agent: str, to_agent: str, message: dict):
        """向特定Agent发送消息"""
        self.protocol.send(
            from_agent, to_agent, message
        )
        self.agents[to_agent].receive(message)

    def consensus(self, topic: str) -> str:
        """达成共识"""
        # 收集各Agent的意见
        opinions = {}
        for name, agent in self.agents.items():
            opinions[name] = agent.opine(topic)

        # 投票或加权平均
        return self.protocol.resolve(opinions)
```

### 3.3.3 雾件模式（Fan-out/Fan-in）

```
┌─────────────────────────────────────┐
│           Fan-out / Fan-in          │
├─────────────────────────────────────┤
│                                     │
│              ┌───────┐              │
│              │Router │              │
│              └───┬───┘              │
│         ┌───────┼───────┐           │
│         ▼       ▼       ▼           │
│    ┌───────┐┌───────┐┌───────┐       │
│    │Agent A││Agent B││Agent C│       │
│    └───┬───┘└───┬───┘└───┬───┘       │
│        └───────┼───────┘           │
│                ▼                     │
│           ┌───────┐                 │
│           │Reducer│                 │
│           └───────┘                 │
│                                     │
└─────────────────────────────────────┘
```

```python
class FanOutFanInAgent:
    """雾件模式多Agent"""

    def __init__(self, router, workers: List[Agent], reducer):
        self.router = router
        self.workers = workers
        self.reducer = reducer

    def process(self, task: str) -> str:
        """
        雾件模式处理
        """
        # Fan-out: 路由器分发任务
        sub_tasks = self.router.distribute(task, len(self.workers))

        # 并行执行
        results = []
        for worker, sub_task in zip(self.workers, sub_tasks):
            result = worker.process(sub_task)
            results.append(result)

        # Fan-in: 归约器整合结果
        return self.reducer.combine(results)
```

## 3.4 通信协议设计

```python
from enum import Enum
from dataclasses import dataclass
from typing import Any

class MessageType(Enum):
    REQUEST = "request"
    RESPONSE = "response"
    QUERY = "query"
    RESULT = "result"
    ERROR = "error"
    HEARTBEAT = "heartbeat"

@dataclass
class AgentMessage:
    """Agent间消息格式"""
    sender: str
    receiver: str  # "broadcast" for all
    type: MessageType
    content: Any
    metadata: dict = None
    timestamp: float = None

class AgentProtocol:
    """Agent通信协议"""

    def __init__(self):
        self.inbox = {}  # agent_name -> list of messages

    def send(self, from_agent: str, to_agent: str, content: Any):
        """发送消息"""
        msg = AgentMessage(
            sender=from_agent,
            receiver=to_agent,
            type=MessageType.RESPONSE,
            content=content,
            timestamp=time.time()
        )

        if to_agent not in self.inbox:
            self.inbox[to_agent] = []
        self.inbox[to_agent].append(msg)

    def broadcast(self, from_agent: str, content: Any, recipients: List[str]):
        """广播消息"""
        for recipient in recipients:
            self.send(from_agent, recipient, content)

    def receive(self, agent_name: str) -> List[AgentMessage]:
        """接收消息"""
        messages = self.inbox.get(agent_name, [])
        self.inbox[agent_name] = []  # 清空
        return messages
```

## 3.5 适用场景

| 场景 | 说明 | 示例 |
|------|------|------|
| 复杂工作流 | 多步骤、多角色协作 | 软件开发团队Agent |
| 专业领域 | 需要领域专家 | 法律/医疗咨询 |
| 并行处理 | 独立子任务可并行 | 市场调研报告 |
| 容错要求 | 需要冗余设计 | 关键业务系统 |
| 多职能 | 需要多种能力 | 智能客服+销售+售后 |

## 3.6 优势与劣势

**优势：**
- **专业化**：每个Agent可成为特定领域专家
- **并行性**：独立任务可同时处理
- **容错性**：单Agent故障不影响整体
- **可扩展性**：新增Agent即可扩展功能
- **模块化**：易于独立开发和测试

**劣势：**
- **复杂度高**：架构设计和调试难度大
- **通信开销**：Agent间通信增加延迟和成本
- **一致性挑战**：多Agent决策可能冲突
- **资源消耗**：多Agent需要更多计算资源
- **协调成本**：需要有效的协调机制

---

# 四、架构选择决策框架

## 4.1 决策流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                   Agent 架构选择决策树                            │
└─────────────────────────────────────────────────────────────────┘

                         ┌─────────────┐
                         │ 任务复杂度   │
                         └──────┬──────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
         简单 (<3步)        中等 (3-7步)        复杂 (>7步)
              │                 │                 │
              ▼                 ▼                 ▼
        ┌──────────┐      ┌──────────┐      ┌──────────────┐
        │单Agent   │      │评估专业性│      │多Agent       │
        │足够      │      │需求      │      │协作架构      │
        └──────────┘      └────┬─────┘      └──────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                    ▼          ▼          ▼
               不需要       需要        复杂
               专家        专家         协作
                    │          │          │
                    ▼          ▼          ▼
              ┌──────────┐ ┌──────────┐ ┌──────────────┐
              │ 单Agent  │ │多Agent   │ │层级+对等混合 │
              │+多工具   │ │角色分工  │ │架构         │
              └──────────┘ └──────────┘ └──────────────┘
```

## 4.2 决策检查清单

在选择架构时，请逐项检查：

### 任务特性
- [ ] 任务是否可以分解为独立子任务？
- [ ] 子任务是否需要不同领域的专业知识？
- [ ] 子任务之间是否有依赖关系？
- [ ] 是否需要并行处理提升效率？

### 系统要求
- [ ] 对延迟的容忍度如何？
- [ ] 对容错性的要求如何？
- [ ] 系统资源的限制（计算力、内存）？

### 开发考量
- [ ] 团队是否有能力维护多Agent系统？
- [ ] 是否需要快速原型验证？

## 4.3 选型建议表

| 因素 | 倾向单Agent | 倾向多Agent |
|------|-------------|-------------|
| 任务复杂度 | 低 | 高 |
| 领域多样性 | 单一 | 多领域 |
| 并行需求 | 低 | 高 |
| 容错要求 | 一般 | 高 |
| 响应延迟 | 敏感 | 可容忍 |
| 开发资源 | 有限 | 充足 |
| 扩展预期 | 低 | 高 |

---

# 五、实战案例分析

## 5.1 案例一：智能客服系统

**场景**：电商平台的智能客服，需要处理咨询、售后、推荐等多种需求。

**分析**：
- 任务类型多样（咨询、售后、推荐）
- 需要不同专业知识
- 用户期望快速响应

**推荐架构**：多Agent + 对等通信

```
┌────────────────────────────────────────┐
│           Customer Service              │
├────────────────────────────────────────┤
│                                        │
│   ┌────────┐  ┌────────┐  ┌────────┐  │
│   │ 咨询   │  │ 售后   │  │ 推荐   │  │
│   │ Agent  │  │ Agent  │  │ Agent  │  │
│   └───┬────┘  └───┬────┘  └───┬────┘  │
│       │           │           │        │
│       └───────────┴───────────┘        │
│                   │                    │
│              ┌────┴────┐               │
│              │ Router  │               │
│              └─────────┘               │
│                                        │
└────────────────────────────────────────┘
```

## 5.2 案例二：代码审查助手

**场景**：帮助开发者审查代码、检测bug、提供优化建议。

**分析**：
- 任务相对单一
- 需要代码执行和静态分析
- 需要理解多种编程语言

**推荐架构**：单Agent + 多工具

```python
class CodeReviewAgent:
    """
    单Agent架构的代码审查助手
    """
    def __init__(self, llm):
        self.llm = llm
        self.tools = [
            StaticAnalyzer(),
            Linter(),
            SecurityScanner(),
            CodeFormatter()
        ]

    def review(self, code: str, language: str) -> dict:
        # 使用单一Agent协调多个工具
        # 无需多个专业Agent
        pass
```

## 5.3 案例三：金融分析助手

**场景**：投资银行使用的金融分析助手，需要整合财报分析、市场数据、行业研究等。

**分析**：
- 多数据源整合
- 专业领域知识要求高
- 需要多维度交叉验证
- 容错要求高

**推荐架构**：多Agent层级架构

```
┌─────────────────────────────────────────┐
│         金融分析 Orchestrator            │
├─────────────────────────────────────────┤
│  任务分解 | 结果整合 | 质量控制          │
└───────────────────┬─────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌────────┐   ┌────────┐      ┌────────┐
│财报分析│   │市场数据│      │行业研究│
│ Agent  │   │ Agent  │      │ Agent  │
└───┬────┘   └───┬────┘      └───┬────┘
    │            │                │
    └────────────┴────────────────┘
                    │
              ┌────┴────┐
              │ 报告生成 │
              │ Agent   │
              └─────────┘
```

---

# 六、架构演进策略

## 6.1 从单Agent到多Agent的演进路径

```
阶段1: 单Agent MVP
    │
    │ 发现瓶颈
    ▼
阶段2: 单Agent + 增强工具
    │
    │ 复杂度增加
    ▼
阶段3: 垂直拆分（领域专家）
    │
    │ 协作需求增加
    ▼
阶段4: 多Agent协作
    │
    │ 规模扩大
    ▼
阶段5: 层级+对等混合架构
```

## 6.2 演进信号

**何时应该考虑多Agent：**
1. 单Agent处理时间超过预期
2. 不同任务的准确率差异显著
3. 需要集成多个外部API/数据源
4. 系统需要支持多用户并发
5. 维护单一Agent变得困难

---

# 七、总结

| 维度 | 单Agent | 多Agent |
|------|---------|---------|
| 架构复杂度 | 低 | 高 |
| 开发成本 | 低 | 高 |
| 任务复杂度支持 | 中 | 高 |
| 并行处理能力 | 弱 | 强 |
| 容错性 | 差 | 好 |
| 扩展性 | 差 | 好 |
| 延迟 | 低 | 中-高 |
| 成本 | 低 | 中-高 |

**最终建议**：
- **起步选单Agent**：简单场景先用单Agent，快速验证
- **按需演进**：遇到瓶颈再考虑多Agent
- **渐进式拆分**：从垂直拆分开始，逐步演进
- **工具优先**：优先考虑工具增强，再考虑架构变更

---

**相关阅读：**
- [AI Agent 是什么？定义、架构与核心能力](/post/ai-agent-what-is-definition-architecture-core-capabilities-20260511.html)
- [从 ReAct 到 Agentic RAG：推理框架演进](/post/react-to-agentic-rag-evolution-20260511.html)
