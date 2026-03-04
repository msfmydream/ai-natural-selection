# 🚀 自然选择号 - 个人星舰

> "自然选择，前进四！"

一个以《三体》自然选择号为灵感的 Hugo 主题个人博客，配备星空动画和超光速特效。

## ✨ 特性

- 🌌 **动态星空背景** - Canvas 实现的星空动画
- ⚡ **超光速模式** - 点击"自然选择，前进四！"激活
- 🔥 **推进器光效** - 模拟战舰引擎的蓝色光芒
- 💡 **战术指令库** - 管理和展示 AI 提示词
- 📝 **航行日志** - Markdown 文章系统

## 🚀 快速部署到 GitHub Pages

### 1. 创建 GitHub 仓库

登录 GitHub，创建新仓库：
- **仓库名**: `natural-selection` （推荐）
- **可见性**: Public

### 2. 推送代码

在项目目录执行：

```bash
# 初始化仓库
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/YOUR_USERNAME/natural-selection.git
git branch -M main
git push -u origin main
```

### 3. 配置 GitHub Pages

1. 打开 GitHub 仓库 → Settings → Pages
2. Source 选择 "GitHub Actions"
3. 等待自动部署完成

### 4. 修改配置文件

编辑 `hugo.toml`，替换为你的 GitHub 用户名：

```toml
baseURL = 'https://YOUR_USERNAME.github.io/natural-selection/'
```

提交修改：

```bash
git add hugo.toml
git commit -m "Update baseURL"
git push
```

等待几分钟，访问 `https://YOUR_USERNAME.github.io/natural-selection/` 即可！

## 📝 写作指南

### 创建航行日志（文章）

```bash
hugo new posts/my-first-post.md
```

### 创建战术指令（提示词）

```bash
hugo new prompts/my-prompt.md
```

## 🎨 自定义

### 修改站点信息

编辑 `hugo.toml`：

```toml
[params]
  author = '你的名字'
  description = '你的描述'
  github = '你的GitHub用户名'
```

### 添加自定义域名

1. 在 `static/` 目录创建 `CNAME` 文件，写入你的域名
2. 在 DNS 中添加 CNAME 记录指向 `YOUR_USERNAME.github.io`
3. 在 GitHub Pages 设置中配置自定义域名

## 📦 项目结构

```
.
├── .github/workflows/    # GitHub Actions 自动部署
├── archetypes/           # 内容模板
├── content/              # 网站内容
│   ├── posts/           # 文章
│   └── prompts/         # 提示词
├── static/               # 静态资源
├── themes/fresh-theme/   # 主题文件
├── hugo.toml            # 站点配置
└── README.md            # 本文件
```

## 🛠️ 本地预览

```bash
hugo server -D
```

访问 http://localhost:1313

## 📄 License

MIT License

---

> 给岁月以文明，而不是给文明以岁月。
