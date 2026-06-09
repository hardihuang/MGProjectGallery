#!/bin/bash
# MG Project Gallery — Setup Script
# 一键配置飞书 API 凭证

echo "=== MG 项目画册 配置 ==="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "⚠️  wrangler 未安装（用于 Cloudflare Pages 部署）"
  echo "   需要时运行: npm install -g wrangler"
  echo ""
fi

echo "✅ 项目准备完成！"
echo ""
echo "部署方式："
echo ""
echo "  方案 A (推荐): Cloudflare Pages + Worker"
echo "    1. 在 Cloudflare Dashboard 创建 Pages 项目"
echo "    2. 连接此 GitHub 仓库"
echo "    3. 添加环境变量: FEISHU_APP_ID, FEISHU_APP_SECRET"
echo "    4. 部署后回来自动生效"
echo "    预算: $0（免费额度内）"
echo ""
echo "  方案 B: GitHub Pages + GitHub Action"
echo "    1. 仓库 Settings → Secrets 添加 FEISHU_APP_ID 和 FEISHU_APP_SECRET"
echo "    2. 仓库 Settings → Pages 开启，分支选 gh-pages"
echo "    3. Action 每 6 小时自动同步数据"
echo "    预算: $0"
echo ""
echo "  飞书 App ID: cli_aaadd33fbb3bdbb3"
echo "  多维表格: MVGGbyrUCaTzixs6aoXcZd8sn7k"
echo ""
