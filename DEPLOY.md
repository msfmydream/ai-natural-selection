# GitHub Pages 部署指南

## 推荐的仓库名称

- **natural-selection** （推荐）- 自然选择号
- **starship-blog** - 星舰博客
- **dark-forest-log** - 黑暗森林日志
- **ahead-four** - 前进四

## 部署步骤

### 第一步：创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名称填写：`natural-selection`（或你喜欢的名称）
4. 选择 "Public"（公开）
5. 不要勾选 "Initialize this repository with a README"
6. 点击 "Create repository"

### 第二步：初始化本地仓库并推送

在项目根目录打开终端，执行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Natural Selection Starship"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/natural-selection.git

# 推送到 main 分支
git branch -M main
git push -u origin main
```

### 第三步：配置 GitHub Actions 自动部署

在项目根目录创建文件：`.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      with:
        submodules: true
        
    - name: Setup Hugo
      uses: peaceiris/actions-hugo@v2
      with:
        hugo-version: '0.145.0'
        extended: true
        
    - name: Build
      run: hugo --minify
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./public
```

### 第四步：修改 Hugo 配置（⚠️ 重要！）

编辑 `hugo.toml`，将 `baseURL` 改为你的 GitHub Pages 地址：

```toml
baseURL = 'https://YOUR_USERNAME.github.io/natural-selection/'
```

> ⚠️ **警告**：如果不修改 baseURL，部署后网站会丢失样式！
> 
> 本地开发时使用 `baseURL = '/'`，部署到 GitHub Pages 前必须改为完整的 GitHub Pages URL。

### 第五步：提交并推送配置文件

```bash
git add .
git commit -m "Add GitHub Actions workflow"
git push
```

### 第六步：启用 GitHub Pages

1. 打开 GitHub 仓库页面
2. 点击 "Settings" → "Pages"
3. Source 选择 "Deploy from a branch"
4. Branch 选择 "gh-pages"（等待第一次自动部署完成）
5. 点击 "Save"

等待几分钟后，访问 `https://YOUR_USERNAME.github.io/natural-selection/` 即可看到你的网站！

## 可选：绑定自定义域名

如果你想用自己的域名：

1. 在 `static/` 目录下创建 `CNAME` 文件，内容为你的域名：
   ```
   yourdomain.com
   ```

2. 在你的域名 DNS 设置中添加 CNAME 记录：
   - 主机记录：`www` 或 `@`
   - 记录值：`YOUR_USERNAME.github.io`

3. 在 GitHub Pages 设置中添加自定义域名

## 更新网站

每次修改内容后，只需执行：

```bash
git add .
git commit -m "更新内容"
git push
```

GitHub Actions 会自动构建并部署！
