# AI文本转Word工具

一个简单实用的在线工具，用于将AI助手（如Deepseek、ChatGPT等）生成的文本快速转换为规范的Word文档。

## 特点

- 🚀 即时预览：实时查看Markdown渲染效果
- 📝 格式支持：支持标题、加粗、表格、列表等Markdown格式
- 💾 一键转换：轻松将文本转换为Word文档
- 📱 响应式设计：完美支持移动端和PC端
- 🎨 简洁界面：清爽的用户界面，专注于内容

## 在线使用

访问 [https://carsonfeng.github.io/markdown](https://carsonfeng.github.io/markdown) 即可使用。

## 本地开发

1. 克隆仓库：
```bash
git clone git@github.com:carsonfeng/markdown.git
cd markdown
```

2. 安装依赖：
```bash
npm install marked docx file-saver
```

3. 使用任意HTTP服务器运行，例如：
```bash
python -m http.server 8000
# 或
npx http-server
```

## 技术栈

- marked.js - Markdown解析
- docx.js - Word文档生成
- FileSaver.js - 文件保存

## 开源协议

MIT License 