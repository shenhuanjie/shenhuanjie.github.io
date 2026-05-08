---
title: 收藏与历史
layout: favorites
---

<div class="favorites-page">
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