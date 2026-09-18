#!/usr/bin/env bash
# ============================================
# 《大明国策》一键部署到 GitHub Pages
# 用法：
#   1. 在 https://github.com/settings/tokens 生成新 token（勾选 repo）
#   2. 把它设到环境变量：export GH_TOKEN=ghp_xxxx
#   3. ./deploy.sh 你的GitHub用户名
# ============================================

set -e

REPO_NAME="daming-guoce"
USERNAME="$1"

if [ -z "$USERNAME" ]; then
    echo "用法: ./deploy.sh 你的GitHub用户名"
    exit 1
fi

if [ -z "$GH_TOKEN" ]; then
    echo "请先设置: export GH_TOKEN=你的token"
    echo "生成地址: https://github.com/settings/tokens"
    exit 1
fi

echo "📦 准备文件..."
mkdir -p .deploy
cp -r data modules.js script.js style.css index.html manifest.json sw.js DEPLOY.md .deploy/

# 创建 repo（如果不存在）
echo "🔧 创建 GitHub 仓库..."
curl -s -X POST \
    -H "Authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"大明国策 - 明朝皇帝模拟器\",\"public\":true}"

cd .deploy
git init -q
git config user.email "deploy@damingguoce.local"
git config user.name "deploy"
git add .
git commit -q -m "v3.2 大明国策"
git branch -M main
git remote add origin "https://$GH_TOKEN@github.com/$USERNAME/$REPO_NAME.git"

echo "🚀 推送代码..."
git push -f origin main

echo "🌐 启用 GitHub Pages..."
curl -s -X POST \
    -H "Authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/$USERNAME/$REPO_NAME/pages \
    -d '{"source":{"branch":"main","path":"/"}}'

echo ""
echo "✅ 完成！"
echo "🌍 访问地址: https://$USERNAME.github.io/$REPO_NAME/"
echo "⏱️  Pages 部署需要 1-2 分钟生效"
