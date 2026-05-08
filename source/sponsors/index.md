---
title: 支持作者
layout: sponsors
---

<div class="sponsors-page">
  <div class="sponsors-header">
    <h1>支持作者</h1>
    <p class="sponsors-intro">如果您觉得博客对您有帮助，欢迎支持</p>
  </div>

  <div class="sponsors-content">
    <p>创作不易，如果您觉得博客的内容对您有所帮助，欢迎使用以下方式支持一下：</p>

    <div class="sponsors-methods">
      <div class="sponsor-card">
        <h3>微信打赏</h3>
        <div class="qrcode-wrapper">
          <img src="/images/sponsors/wechat-pay.png" alt="微信收款码" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="qrcode-placeholder">
            <span class="placeholder-icon">&#127760;</span>
            <span class="placeholder-text">[待添加微信收款码]</span>
          </div>
        </div>
        <p class="tip">扫码添加助手微信打赏</p>
      </div>

      <div class="sponsor-card">
        <h3>支付宝打赏</h3>
        <div class="qrcode-wrapper">
          <img src="/images/sponsors/alipay.png" alt="支付宝收款码" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="qrcode-placeholder">
            <span class="placeholder-icon">&#127760;</span>
            <span class="placeholder-text">[待添加支付宝收款码]</span>
          </div>
        </div>
        <p class="tip">扫码添加助手支付宝打赏</p>
      </div>
    </div>

    <div class="sponsors-note">
      <h4>感谢您的支持</h4>
      <p>您的打赏将用于：</p>
      <ul>
        <li>支付服务器费用</li>
        <li>购买开发工具和资源</li>
        <li>持续产出优质内容</li>
      </ul>
    </div>

    <div class="sponsors-社群入口">
      <h4>也欢迎加入社群</h4>
      <p>加入 AI 资讯社群，与 1000+ 开发者交流：</p>
      <div class="community-qrcode">
        <div class="qrcode-wrapper">
          <img src="/images/sponsors/zhishixingqiu.png" alt="知识星球二维码" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="qrcode-placeholder">
            <span class="placeholder-icon">&#128218;</span>
            <span class="placeholder-text">[待添加知识星球二维码]</span>
          </div>
        </div>
        <p class="tip">扫码加入知识星球</p>
      </div>
      <p class="wechat-tip">或添加微信：shenhuanjie，备注「社群」</p>
    </div>
  </div>
</div>

<style>
.sponsors-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.sponsors-header {
  text-align: center;
  margin-bottom: 2rem;
}

.sponsors-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.sponsors-intro {
  font-size: 1.1rem;
  color: #666;
}

.sponsors-content > p {
  font-size: 1rem;
  color: #555;
  line-height: 1.8;
  margin-bottom: 2rem;
}

.sponsors-methods {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 600px) {
  .sponsors-methods {
    grid-template-columns: 1fr;
  }
}

.sponsor-card {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.sponsor-card h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #333;
}

.qrcode-wrapper {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto 1rem;
  background: #fff;
  border: 2px dashed #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.qrcode-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qrcode-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.placeholder-icon {
  font-size: 48px;
  line-height: 1;
}

.placeholder-text {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}

.tip {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.sponsors-note {
  background: #f0f7ff;
  border: 1px solid #b3d4fc;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.sponsors-note h4 {
  margin: 0 0 0.75rem;
  color: #333;
}

.sponsors-note p {
  margin: 0 0 0.5rem;
  color: #555;
}

.sponsors-note ul {
  margin: 0.5rem 0 0;
  padding-left: 1.5rem;
  color: #666;
}

.sponsors-note li {
  margin: 0.25rem 0;
}

.sponsors-社群入口 {
  text-align: center;
  padding: 1.5rem;
  background: #fff8f0;
  border: 1px dashed #ffd699;
  border-radius: 8px;
}

.sponsors-社群入口 h4 {
  margin: 0 0 0.5rem;
  color: #333;
}

.sponsors-社群入口 > p {
  margin: 0 0 1rem;
  color: #666;
}

.community-qrcode {
  display: inline-block;
}

.community-qrcode .qrcode-wrapper {
  width: 160px;
  height: 160px;
}

.wechat-tip {
  margin-top: 1rem;
  font-size: 13px;
  color: #666;
}
</style>