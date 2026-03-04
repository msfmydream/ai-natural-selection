---
title: 'Hugo 快速入门指南'
date: '2026-03-02T15:30:00+08:00'
draft: false
tags: ['Hugo', '教程', '静态网站']
categories: ['技术']
description: '一份详细的 Hugo 静态网站生成器入门教程，帮助你快速搭建个人博客。'
---

## 什么是 Hugo

Hugo 是一个用 Go 语言编写的静态网站生成器。它使用 Markdown 文件作为内容源，通过模板引擎生成静态 HTML 文件。

## 安装 Hugo

### Windows

```powershell
# 使用 Chocolatey
choco install hugo-extended

# 或使用 Scoop
scoop install hugo-extended
```

### macOS

```bash
# 使用 Homebrew
brew install hugo
```

### Linux

```bash
# 使用 Snap
snap install hugo
```

## 创建新站点

```bash
# 创建新站点
hugo new site myblog
cd myblog

# 添加主题
git init
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke

# 配置主题
echo "theme = 'ananke'" >> hugo.toml

# 创建内容
hugo new posts/hello.md

# 本地预览
hugo server -D

# 构建（输出到 public 目录）
hugo
```

## 目录结构

```
myblog/
├── archetypes/      # 内容模板
├── assets/          # 需要处理的资源
├── content/         # 网站内容
├── data/            # 数据文件
├── layouts/         # HTML 模板
├── static/          # 静态文件
├── themes/          # 主题
└── hugo.toml        # 站点配置
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `hugo new site <name>` | 创建新站点 |
| `hugo new <path>` | 创建新内容 |
| `hugo server` | 启动开发服务器 |
| `hugo server -D` | 包含草稿 |
| `hugo` | 构建站点 |
| `hugo --minify` | 压缩构建 |

## Front Matter

Front Matter 是内容文件顶部的元数据：

```yaml
---
title: "文章标题"
date: 2026-03-03T10:00:00+08:00
draft: false
tags: ["标签1", "标签2"]
categories: ["分类"]
description: "文章描述"
---
```

## 部署

### GitHub Pages

```bash
# 在 hugo.toml 中设置
baseURL = 'https://username.github.io/repo-name/'

# 构建
hugo

# 部署 public 目录到 gh-pages 分支
```

### Vercel

直接连接 GitHub 仓库，Vercel 会自动检测 Hugo 并部署。

## 总结

Hugo 是一个非常强大的静态网站生成器，特别适合博客、文档等网站。它的构建速度极快，主题丰富，是搭建个人网站的优秀选择。

希望这篇教程对你有帮助！
