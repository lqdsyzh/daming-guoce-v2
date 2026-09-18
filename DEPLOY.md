# 《大明国策》部署指南

> 真联机/真云端**做不了**（沙箱限制），但**静态部署**很简单——这游戏是纯前端，扔到任何静态托管即可。

---

## 1. 本地服务器（最快）

```bash
cd daming_guoce
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000/
```

或用 Node.js：
```bash
npx http-server daming_guoce -p 8000
```

或用 PHP：
```bash
cd daming_guoce
php -S 0.0.0.0:8000
```

---

## 2. 部署到公网（免费方案）

### 方案 A：GitHub Pages（最简单）

```bash
# 1. 创建 GitHub 仓库
# 2. 推送所有文件
git init
git add .
git commit -m "大明国策"
git branch -M main
git remote add origin https://github.com/你的用户名/daming-guoce.git
git push -u origin main

# 3. 在 GitHub 仓库 Settings > Pages
#    Source: Deploy from a branch
#    Branch: main / (root)
# 4. 访问 https://你的用户名.github.io/daming-guoce/
```

### 方案 B：Netlify（拖拽即部署）

1. 访问 https://app.netlify.com/drop
2. 把整个 `daming_guoce` 文件夹拖到页面上
3. 自动得到 `xxx.netlify.app` 的网址

### 方案 C：Vercel（推荐，国内访问快）

```bash
npm i -g vercel
cd daming_guoce
vercel
# 按提示登录 + 部署
```

### 方案 D：腾讯云 / 阿里云 OSS

1. 创建 OSS bucket，开启"静态网站托管"
2. 把所有文件上传
3. 绑定自定义域名

### 方案 E：VPS + Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/daming_guoce;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 3. "联机"功能说明

本游戏提供**模拟联机**：

- **分享码**：导出朝代 → base64 分享码 → 朋友导入查看
- **本机联机**：同浏览器多窗口通过 `BroadcastChannel` 自动通信
- **本地排行榜**：localStorage 记录多档分数

**真"跨网络联机"需要**：
- 后端服务（Node.js + WebSocket / Socket.io）
- 数据库（PostgreSQL / MongoDB）
- 用户系统（OAuth / JWT）

**沙箱里我没法提供这些**——但游戏本身是纯前端的，部署到任何静态托管即可。

如要升级为真联机，需要：
- 后端：Node.js + Express + Socket.io
- 数据库：玩家、朝代、消息
- 推送：实时事件通知

需要我做**后端参考实现**吗？（这需要更多积分，但可以做出来给你参考。）

---

## 4. PWA 化（可安装到桌面）

要让游戏像 App 一样可安装，添加 `manifest.json` 和 Service Worker。已留出扩展位。

---

## 5. 性能优化建议

- 游戏是纯前端，所有数据都在浏览器 localStorage
- 存档位置：DevTools → Application → Local Storage → `daming_*` 开头
- 单局游戏数据 < 50KB，可玩 20 年约 200KB

---

## 6. 数据安全

- 存档**仅存在你本地浏览器**
- 关闭浏览器不会丢（除非清缓存）
- 想分享：用"分享"页生成分享码发给朋友
- 想备份：复制 localStorage 里的 JSON

---

**有问题随时叫我。**
