---
title: RAG 评估指标与优化：构建可量化的检索增强生成系统
date: '2026-05-11 15:00:00'
updated: '2026-05-11 15:00:00'
excerpt: >-
  本文系统梳理 RAG 系统的评估指标体系，包括检索质量评估、生成质量评估、端到端评估，以及针对性的优化策略与实战技巧。
categories:
  - AI
tags:
  - RAG
  - 评估指标
  - 优化
  - 质量评估
  - Retriever
  - Generator
permalink: /post/rag-evaluation-metrics-optimization-20260511.html
comments: true
toc: true
---

> T47.2 RAG 技术系列补充 ✅

# 一、RAG 评估概述

## 1.1 为什么需要评估 RAG

RAG 系统的质量评估至关重要，因为：

```
RAG 评估的重要性：
├── 检索质量直接影响生成效果
├── 生成质量难以直接优化，需要量化指标
├── 系统优化需要明确的评估基准
├── 生产环境需要持续监控质量变化
└── 业务需求需要可量化的质量标准
```

## 1.2 RAG 评估框架

```
┌──────────────────────────────────────────────────────────────────┐
│                      RAG 评估金字塔                                │
└──────────────────────────────────────────────────────────────────┘

                        ┌─────────┐
                        │ 端到端  │
                        │  评估   │
                        └────┬────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
        │  生成质量 │  │ 检索质量  │  │  系统性能 │
        │  评估     │  │  评估     │  │  评估     │
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │              │              │
    ┌─────────┼─────────┐    │    ┌─────────┼─────────┐
    │         │         │    │    │         │         │
┌───┴───┐ ┌───┴───┐ ┌───┴───┐┌───┴───┐┌───┴───┐ ┌───┴───┐
│答案质量│ │相关性 │ │流畅性 ││召回率  ││精确率  ││延迟   │
└───┘   └─────────┘─────────┘└───┘   └─────────┘ └───────┘
```

---

# 二、检索质量评估

## 2.1 核心评估指标

### 2.1.1 召回率（Recall）

**定义**：相关文档被检索出来的比例

```python
def calculate_recall(retrieved_docs: List[str], relevant_docs: List[str]) -> float:
    """
    计算召回率

    Recall = |Retrieved ∩ Relevant| / |Relevant|
    """
    retrieved_set = set(retrieved_docs)
    relevant_set = set(relevant_docs)

    intersection = retrieved_set.intersection(relevant_set)

    return len(intersection) / len(relevant_set) if relevant_set else 0.0
```

### 2.1.2 精确率（Precision）

**定义**：检索结果中被召回的相关文档比例

```python
def calculate_precision(retrieved_docs: List[str], relevant_docs: List[str]) -> float:
    """
    计算精确率

    Precision = |Retrieved ∩ Relevant| / |Retrieved|
    """
    retrieved_set = set(retrieved_docs)
    relevant_set = set(relevant_docs)

    intersection = retrieved_set.intersection(relevant_set)

    return len(intersection) / len(retrieved_set) if retrieved_set else 0.0
```

### 2.1.3 MRR（Mean Reciprocal Rank）

**定义**：第一个相关文档出现位置的平均倒数

```python
def calculate_mrr(rankings: List[List[str]], relevant_docs: List[str]) -> float:
    """
    计算 MRR

    MRR = (1/N) * Σ(1/rank_i)

    其中 rank_i 是第 i 个查询的第一个相关文档的位置
    """
    reciprocal_ranks = []

    for ranked_docs in rankings:
        for i, doc in enumerate(ranked_docs, 1):
            if doc in relevant_docs:
                reciprocal_ranks.append(1.0 / i)
                break
        else:
            reciprocal_ranks.append(0.0)

    return sum(reciprocal_ranks) / len(reciprocal_ranks) if reciprocal_ranks else 0.0
```

### 2.1.4 NDCG（Normalized Discounted Cumulative Gain）

**定义**：考虑位置因素的排序质量指标

```python
def calculate_ndcg(ranked_docs: List[str], relevant_docs: List[str],
                   relevance_scores: Dict[str, float], k: int = 10) -> float:
    """
    计算 NDCG@K

    DCG = Σ(rel_i / log2(i+1))
    NDCG = DCG / IDCG
    """
    # 计算 DCG
    dcg = 0.0
    for i, doc in enumerate(ranked_docs[:k], 1):
        rel = relevance_scores.get(doc, 0.0)
        dcg += rel / math.log2(i + 1)

    # 计算 IDCG（理想情况下的 DCG）
    ideal_ranking = sorted(
        relevant_docs,
        key=lambda x: relevance_scores.get(x, 0.0),
        reverse=True
    )
    idcg = 0.0
    for i, doc in enumerate(ideal_ranking[:k], 1):
        rel = relevance_scores.get(doc, 0.0)
        idcg += rel / math.log2(i + 1)

    return dcg / idcg if idcg > 0 else 0.0
```

## 2.2 检索质量综合评估表

| 指标 | 公式 | 理想值 | 说明 |
|------|------|--------|------|
| Recall@K | 相关文档被召回比例 | 1.0 | K越大越容易接近1 |
| Precision@K | 检索结果中相关比例 | 1.0 | K越大越难保持高 |
| MRR | 首个相关文档排名的倒数 | 1.0 | 越高越好 |
| NDCG@K | 位置加权的排序质量 | 1.0 | 综合考虑相关性排序 |
| MAP | 平均精确率 | 1.0 | 多查询的平均表现 |

## 2.3 实战评估代码

```python
class RetrievalEvaluator:
    """
    检索系统评估器
    """

    def __init__(self, retriever, ground_truth: List[dict]):
        self.retriever = retriever
        self.ground_truth = ground_truth

    def evaluate(self, test_queries: List[str]) -> dict:
        """
        全面评估检索系统
        """
        results = {
            'recall': [],
            'precision': [],
            'mrr': [],
            'ndcg': []
        }

        for query in test_queries:
            # 执行检索
            retrieved = self.retriever.search(query, top_k=10)

            # 获取 ground truth
            gt = self._get_ground_truth(query)

            # 计算各项指标
            results['recall'].append(
                self._recall_at_k(retrieved, gt['relevant'], k=10)
            )
            results['precision'].append(
                self._precision_at_k(retrieved, gt['relevant'], k=10)
            )
            results['mrr'].append(
                self._mrr([retrieved], gt['relevant'])
            )
            results['ndcg'].append(
                self._ndcg_at_k(retrieved, gt['relevant'], gt['relevance_scores'], k=10)
            )

        # 汇总结果
        return {
            'recall@10': np.mean(results['recall']),
            'precision@10': np.mean(results['precision']),
            'mrr': np.mean(results['mrr']),
            'ndcg@10': np.mean(results['ndcg'])
        }

    def _get_ground_truth(self, query: str) -> dict:
        """获取查询的 ground truth 数据"""
        for item in self.ground_truth:
            if item['query'] == query:
                return item
        return {'relevant': [], 'relevance_scores': {}}
```

---

# 三、生成质量评估

## 3.1 评估维度

| 维度 | 说明 | 评估方法 |
|------|------|----------|
| 答案质量 | 答案是否正确、完整 | ROUGE、BERT-Score |
| 忠实度 | 答案是否基于检索内容 | 幻觉检测 |
| 相关性 | 答案是否针对问题 | 相关性打分 |
| 流畅性 | 答案是否通顺 | 语言模型评估 |
| 有用性 | 答案对用户的帮助程度 | 人工评估/用户反馈 |

## 3.2 自动评估指标

### 3.2.1 ROUGE 分数

```python
from rouge import Rouge

def evaluate_with_rouge(candidate: str, reference: str) -> dict:
    """
    使用 ROUGE 评估生成质量
    """
    rouge = Rouge()

    scores = rouge.get_scores(candidate, reference)

    return {
        'rouge-1': scores[0]['rouge-1']['f'],
        'rouge-2': scores[0]['rouge-2']['f'],
        'rouge-l': scores[0]['rouge-l']['f']
    }

# 示例
candidate = "RAG是一种结合检索和生成的技术"
reference = "RAG是检索增强生成技术"

result = evaluate_with_rouge(candidate, reference)
# {'rouge-1': 0.85, 'rouge-2': 0.66, 'rouge-l': 0.85}
```

### 3.2.2 BERTScore

```python
from bert_score import score

def evaluate_with_bertscore(candidates: List[str], references: List[str]) -> dict:
    """
    使用 BERTScore 评估语义相似度
    """
    P, R, F1 = score(candidates, references, lang='zh', verbose=True)

    return {
        'precision': P.mean().item(),
        'recall': R.mean().item(),
        'f1': F1.mean().item()
    }
```

### 3.2.3 幻觉检测

```python
class HallucinationDetector:
    """
    幻觉检测器 - 检测生成内容是否忠实于检索内容
    """

    def __init__(self, llm):
        self.llm = llm

    def detect(self, question: str, context: List[str], answer: str) -> dict:
        """
        检测答案中的幻觉
        """
        prompt = f"""
        给定以下信息：
        问题：{question}
        检索到的上下文：{context}
        生成的答案：{answer}

        请检测答案中是否存在幻觉（与检索内容不符的信息）。

        输出格式：
        - 幻觉程度：低/中/高
        - 具体幻觉内容（如有）：列出具体的不符信息
        - 忠实度评分：0-10
        """

        response = self.llm.generate(prompt)

        return self._parse_hallucination_response(response)
```

## 3.3 端到端评估框架

```python
class RAGEvaluator:
    """
    RAG 系统端到端评估器
    """

    def __init__(
        self,
        retriever,
        generator,
        retrieval_ground_truth: List[dict],
        generation_ground_truth: List[dict]
    ):
        self.retriever = retriever
        self.generator = generator
        self.retrieval_gt = retrieval_ground_truth
        self.generation_gt = generation_ground_truth

    def evaluate(self, test_queries: List[str]) -> dict:
        """
        执行完整的 RAG 评估
        """
        results = {
            'retrieval': {'recall': [], 'precision': [], 'mrr': [], 'ndcg': []},
            'generation': {'rouge': [], 'bertscore': [], 'hallucination': []},
            'end_to_end': {'accuracy': [], 'relevance': [], 'user_satisfaction': []}
        }

        for query in test_queries:
            # 1. 检索评估
            retrieved_docs = self.retriever.search(query, top_k=10)
            retrieval_result = self._evaluate_retrieval(query, retrieved_docs)

            for key in results['retrieval']:
                results['retrieval'][key].append(retrieval_result[key])

            # 2. 生成评估
            context = [doc['content'] for doc in retrieved_docs]
            generated_answer = self.generator.generate(query, context)
            generation_result = self._evaluate_generation(query, context, generated_answer)

            for key in results['generation']:
                results['generation'][key].append(generation_result[key])

            # 3. 端到端评估
            e2e_result = self._evaluate_end_to_end(
                query, retrieved_docs, generated_answer
            )
            for key in results['end_to_end']:
                results['end_to_end'][key].append(e2e_result[key])

        return self._aggregate_results(results)

    def _aggregate_results(self, results: dict) -> dict:
        """汇总评估结果"""
        aggregated = {}

        for category, metrics in results.items():
            aggregated[category] = {}
            for metric_name, values in metrics.items():
                aggregated[category][f'{metric_name}_mean'] = np.mean(values)
                aggregated[category][f'{metric_name}_std'] = np.std(values)

        return aggregated
```

---

# 四、RAG 优化策略

## 4.1 检索优化

### 4.1.1 查询优化

```python
class QueryOptimizer:
    """
    查询优化器
    """

    def __init__(self, llm):
        self.llm = llm

    def optimize(self, query: str) -> str:
        """
        优化用户查询
        """
        # 1. 查询扩展
        expanded = self._expand_query(query)

        # 2. 查询重写
        rewritten = self._rewrite_query(expanded)

        # 3. 查询分解（如适用）
        if self._is_complex_query(query):
            decomposed = self._decompose_query(rewritten)
            return decomposed
        else:
            return rewritten

    def _expand_query(self, query: str) -> str:
        """查询扩展 - 添加同义词和相关词"""
        prompt = f"""
        用户查询：{query}

        请生成3个相关的查询扩展，用于更全面地检索相关信息。
        每个扩展应该从不同角度丰富原查询。
        """
        response = self.llm.generate(prompt)
        # 解析扩展查询
        return query  # 简化返回原查询

    def _rewrite_query(self, query: str) -> str:
        """查询重写 - 改善查询表述"""
        prompt = f"""
        用户查询：{query}

        请重写这个查询，使其更清晰、更适合检索。
        保持原意，但使用更精确的表达。
        """
        return self.llm.generate(prompt)

    def _decompose_query(self, query: str) -> List[str]:
        """查询分解 - 将复杂查询分解为简单子查询"""
        prompt = f"""
        用户查询：{query}

        如果这是一个复杂查询（包含多个子问题），请分解为多个简单查询。
        如果可以单一回答，返回原查询。

        输出格式：
        - 如果可分解：[子查询1] | [子查询2] | ...
        - 如果不可分解：[原查询]
        """
        response = self.llm.generate(prompt)
        # 解析分解结果
        return [query]
```

### 4.1.2 检索策略优化

```python
class AdaptiveRetrieval:
    """
    自适应检索策略
    """

    def __init__(self, vector_store, keyword_store, graph_store):
        self.stores = {
            'vector': vector_store,
            'keyword': keyword_store,
            'graph': graph_store
        }

    def retrieve(self, query: str, query_type: str = None) -> List[dict]:
        """
        根据查询类型自适应选择检索策略
        """
        # 自动判断查询类型
        if query_type is None:
            query_type = self._classify_query(query)

        # 根据类型选择策略
        strategy = self._select_strategy(query_type)

        # 执行检索
        results = []
        for source, params in strategy.items():
            source_results = self.stores[source].search(
                query,
                top_k=params['top_k']
            )
            results.extend(source_results)

        # 融合排序
        return self._fusion_rerank(results, strategy)

    def _classify_query(self, query: str) -> str:
        """分类查询类型"""
        prompt = f"""
        查询：{query}

        判断这个查询的类型：
        - factual: 事实性问题（如"什么是..."、"谁发明了..."）
        - conceptual: 概念性问题（如"解释...原理"）
        - relational: 关系性问题（如"...和...有什么关系"）
        - procedural: 程序性问题（如"如何..."）
        """
        response = self.llm.generate(prompt)
        return response.strip().lower()

    def _select_strategy(self, query_type: str) -> dict:
        """根据查询类型选择检索策略"""
        strategies = {
            'factual': {
                'vector': {'top_k': 10, 'weight': 0.7},
                'keyword': {'top_k': 5, 'weight': 0.3}
            },
            'conceptual': {
                'vector': {'top_k': 15, 'weight': 0.8},
                'graph': {'top_k': 5, 'weight': 0.2}
            },
            'relational': {
                'graph': {'top_k': 10, 'weight': 0.6},
                'vector': {'top_k': 10, 'weight': 0.4}
            },
            'procedural': {
                'vector': {'top_k': 10, 'weight': 0.5},
                'keyword': {'top_k': 10, 'weight': 0.5}
            }
        }
        return strategies.get(query_type, strategies['factual'])
```

## 4.2 生成优化

### 4.2.1 提示词优化

```python
class PromptOptimizer:
    """
    RAG 生成提示词优化器
    """

    def __init__(self, llm):
        self.llm = llm

    def optimize_prompt(
        self,
        question: str,
        retrieved_context: List[str],
        current_prompt: str = None
    ) -> str:
        """
        优化 RAG 提示词
        """
        base_prompt = """你是一个专业的AI助手。请基于以下检索到的信息回答用户问题。

检索到的信息：
{context}

用户问题：{question}

回答要求：
1. 只使用检索到的信息回答，不要编造信息
2. 如果检索信息不足以回答，请明确指出
3. 回答要清晰、有条理
4. 在回答末尾注明信息来源

回答："""

        # 根据问题类型调整提示词
        question_type = self._classify_question(question)

        type_specific_instructions = {
            'factual': '直接给出准确答案，简洁明了。',
            'explanatory': '详细解释概念原理，必要时可举例说明。',
            'comparative': '从多个角度对比分析，列出优缺点。',
            'procedural': '分步骤说明操作流程，注明注意事项。'
        }

        optimized_prompt = base_prompt + '\n\n' + \
            type_specific_instructions.get(
                question_type,
                '准确、完整地回答问题。'
            )

        return optimized_prompt

    def _classify_question(self, question: str) -> str:
        """分类问题类型"""
        keywords = {
            'factual': ['什么', '谁是', '哪一年', '在哪里'],
            'explanatory': ['为什么', '解释', '原理', '原因'],
            'comparative': ['比较', '区别', '不同', '优劣'],
            'procedural': ['如何', '怎么', '步骤', '方法']
        }

        for qtype, kws in keywords.items():
            if any(kw in question for kw in kws):
                return qtype
        return 'factual'
```

### 4.2.2 上下文管理优化

```python
class ContextManager:
    """
    上下文管理器 - 优化输入给 LLM 的上下文
    """

    def __init__(self, max_tokens: int = 4000):
        self.max_tokens = max_tokens

    def manage(
        self,
        question: str,
        retrieved_docs: List[dict],
        generation_prompt: str
    ) -> List[dict]:
        """
        管理上下文，选择最相关的内容
        """
        # 1. 计算可用 token 预算
        prompt_tokens = self._count_tokens(generation_prompt)
        available_tokens = self.max_tokens - prompt_tokens - 100  # 留余量

        # 2. 按相关性排序
        sorted_docs = self._sort_by_relevance(question, retrieved_docs)

        # 3. 选择能放入上下文的内容
        selected_docs = []
        current_tokens = 0

        for doc in sorted_docs:
            doc_tokens = self._count_tokens(doc['content'])
            if current_tokens + doc_tokens <= available_tokens:
                selected_docs.append(doc)
                current_tokens += doc_tokens
            else:
                # 尝试截断文档
                truncated = self._truncate_doc(doc, available_tokens - current_tokens)
                if truncated:
                    selected_docs.append(truncated)

        return selected_docs

    def _sort_by_relevance(self, question: str, docs: List[dict]) -> List[dict]:
        """按与问题的相关性排序"""
        scored = []
        for doc in docs:
            score = self._calculate_relevance(question, doc)
            scored.append((score, doc))

        scored.sort(reverse=True, key=lambda x: x[0])
        return [doc for _, doc in scored]
```

---

# 五、评估实战工具

## 5.1 RAGAS 框架

[RAGAS](https://github.com/explodinggradients/ragas) 是一个专门用于评估 RAG 系统的框架：

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_relevancy,
    context_precision
)

# 定义评估数据集
test_dataset = [
    {
        'user_input': '什么是RAG？',
        'retrieved_contexts': ['RAG是检索增强生成...', 'RAG可以减少幻觉...'],
        'response': 'RAG（检索增强生成）是一种...',
        'reference': 'RAG是检索增强生成（Retrieval-Augmented Generation）的缩写...'
    }
]

# 执行评估
result = evaluate(
    test_dataset,
    metrics=[
        faithfulness,
        answer_relevancy,
        context_relevancy,
        context_precision
    ]
)
```

## 5.2 持续监控方案

```yaml
# 生产环境监控配置
monitoring:
  metrics:
    - name: retrieval_recall_at_10
      type: gauge
      threshold: 0.7
      alert: slack

    - name: generation_hallucination_score
      type: gauge
      threshold: 0.3
      alert: email

    - name: end_to_end_latency_p99
      type: gauge
      threshold: 2000ms
      alert: pagerduty

    - name: cache_hit_rate
      type: gauge
      threshold: 0.5
      alert: slack

  dashboard:
    - retrieval_metrics
    - generation_metrics
    - latency_distribution
    - error_rate_by_type
```

---

# 六、总结

RAG 评估是一个系统化工程，需要：

1. **多层次评估**：检索、生成、端到端三管齐下
2. **量化指标**：建立可追踪的指标体系
3. **自动化工具**：使用 RAGAS 等框架自动化评估
4. **持续监控**：生产环境实时监控质量变化
5. **迭代优化**：基于评估结果持续优化系统

关键指标总结：

| 类别 | 核心指标 | 目标值 |
|------|----------|--------|
| 检索 | Recall@10, NDCG@10 | > 0.8 |
| 生成 | Faithfulness, Relevance | > 0.8 |
| 端到端 | 答案准确率, 用户满意度 | > 0.85 |

---

**相关阅读：**
- [从 ReAct 到 Agentic RAG：推理框架演进](/post/react-to-agentic-rag-evolution-20260511.html)
- [Agentic RAG 实战：从架构设计到企业级部署](/post/agentic-rag-implementation-guide-20260511.html)
