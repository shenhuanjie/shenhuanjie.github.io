---
title: 收藏与历史
layout: favorites
---

<div class="favorites-page">
    <%# T40.3 收藏分析统计面板 %>
    <div class="stats-panel" id="stats-panel">
        <div class="stats-item">
            <span class="stats-icon">📚</span>
            <span class="stats-label">收藏文章</span>
            <span class="stats-value" id="stats-favorites">0</span>
        </div>
        <div class="stats-item">
            <span class="stats-icon">📖</span>
            <span class="stats-label">阅读历史</span>
            <span class="stats-value" id="stats-history">0</span>
        </div>
        <div class="stats-item">
            <span class="stats-icon">🔥</span>
            <span class="stats-label">本周新增</span>
            <span class="stats-value" id="stats-week">0</span>
        </div>
        <div class="stats-item">
            <span class="stats-icon">⏱️</span>
            <span class="stats-label">平均阅读</span>
            <span class="stats-value" id="stats-avg">0篇</span>
        </div>
    </div>

    <div class="favorites-container">
        <!-- 收藏文章 -->
        <section class="favorites-section" id="favorites-section">
            <div class="section-header">
                <h2 class="section-title">
                    <span class="section-icon">♥</span>
                    <span>我的收藏</span>
                </h2>
                <span class="section-count" id="favorites-count">0</span>
            </div>
            <div class="section-empty" id="favorites-empty">暂无收藏文章</div>
            <ul class="favorites-list" id="favorites-list"></ul>
        </section>

        <!-- 阅读历史 -->
        <section class="history-section" id="history-section">
            <div class="section-header">
                <h2 class="section-title">
                    <span class="section-icon">📖</span>
                    <span>阅读历史</span>
                </h2>
                <span class="section-count" id="history-count">0</span>
            </div>
            <div class="section-empty" id="history-empty">暂无阅读记录</div>
            <ul class="history-list" id="history-list"></ul>
        </section>
    </div>
</div>

<script src="<%- theme.root %>js/favorites-page.js"></script>