// 等待页面加载完成
window.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const markdownInput = document.getElementById('markdown-input');
    const preview = document.getElementById('preview');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');

    // 设置默认文本
    const defaultText = `# AI文本转Word示例文档

这是一个示例文档，展示了支持的Markdown格式。您可以直接修改这些内容，或者清空后粘贴自己的文本。

## 1. 基础文本格式

- **加粗文本**：使用 \`**文本**\`
- *斜体文本*：使用 \`*文本*\`
- 普通段落：直接输入文本即可
- 分隔线：使用 \`---\`

---

## 2. 列表示例

### 2.1 无序列表
- 苹果
- 香蕉
- 橙子

### 2.2 有序列表
1. 第一步
2. 第二步
3. 第三步

## 3. 表格示例

| 功能 | 语法 | 效果 |
|------|------|------|
| 标题 | \`# 文本\` | 大标题 |
| 加粗 | \`**文本**\` | **加粗** |
| 列表 | \`- 文本\` | 列表项 |

## 4. 使用说明

1. 直接在编辑区修改文本
2. 在预览区实时查看效果
3. 点击"生成Word文档"按钮
4. 自动下载转换后的文档

> 提示：Word文档会保持格式，包括标题层级、加粗、表格等样式。`;

    // 设置默认文本
    markdownInput.value = defaultText;

    // 设置marked选项
    marked.setOptions({
        breaks: true,     // 启用换行符
        gfm: true,       // 启用GitHub风格的Markdown
        tables: true,    // 启用表格支持
        sanitize: false  // 允许HTML标签
    });

    // 更新预览
    function updatePreview() {
        const content = markdownInput.value;
        preview.innerHTML = marked.parse(content);
    }

    // 初始化预览
    updatePreview();

    // 监听输入变化
    markdownInput.addEventListener('input', updatePreview);

    // 监听粘贴事件
    markdownInput.addEventListener('paste', () => {
        // 延迟一下，等待内容粘贴完成
        setTimeout(() => {
            showToast('文本已粘贴，正在预览...');
        }, 100);
    });

    // 清空按钮事件
    clearBtn.addEventListener('click', () => {
        if (markdownInput.value.trim() === '') {
            showToast('编辑区已经是空的了');
            return;
        }
        if (confirm('确定要清空所有内容吗？')) {
            markdownInput.value = '';
            updatePreview();
            showToast('内容已清空');
        }
    });

    // 显示提示消息
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 添加显示类以触发动画
        setTimeout(() => toast.classList.add('show'), 10);

        // 3秒后移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 将HTML转换为纯文本（去除HTML标签）
    function stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // 处理文本中的Markdown标记
    function processMarkdownText(text) {
        const runs = [];
        let currentText = '';
        let isBold = false;
        let isItalic = false;
        
        // 移除Markdown符号并保持格式
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '*' || text[i] === '_') {
                if (i + 1 < text.length && (text[i + 1] === '*' || text[i + 1] === '_')) {
                    // 处理加粗
                    if (currentText) {
                        runs.push(new docx.TextRun({
                            text: currentText,
                            bold: isBold,
                            italics: isItalic
                        }));
                        currentText = '';
                    }
                    isBold = !isBold;
                    i++; // 跳过第二个*
                } else {
                    // 处理斜体
                    if (currentText) {
                        runs.push(new docx.TextRun({
                            text: currentText,
                            bold: isBold,
                            italics: isItalic
                        }));
                        currentText = '';
                    }
                    isItalic = !isItalic;
                }
            } else {
                currentText += text[i];
            }
        }
        
        if (currentText) {
            runs.push(new docx.TextRun({
                text: currentText,
                bold: isBold,
                italics: isItalic
            }));
        }

        return runs;
    }

    // 清理Markdown标记
    function cleanMarkdownText(text) {
        // 移除加粗和斜体标记
        return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
                  .replace(/__(.*?)__/g, '$1').replace(/_(.*?)_/g, '$1');
    }

    // 将Markdown转换为docx格式的段落数组
    function convertMarkdownToDocxParagraphs(markdown) {
        const tokens = marked.lexer(markdown);
        const paragraphs = [];
        
        for (const token of tokens) {
            switch (token.type) {
                case 'heading':
                    // 清理标题中的Markdown标记
                    const cleanTitle = cleanMarkdownText(token.text);
                    paragraphs.push(new docx.Paragraph({
                        text: cleanTitle,
                        heading: `Heading${token.depth}`,
                        spacing: { before: 400, after: 200 }
                    }));
                    break;

                case 'paragraph':
                    paragraphs.push(new docx.Paragraph({
                        children: processMarkdownText(token.text),
                        spacing: { before: 200, after: 200 }
                    }));
                    break;

                case 'list':
                    token.items.forEach((item, index) => {
                        paragraphs.push(new docx.Paragraph({
                            children: processMarkdownText(item.text),
                            bullet: {
                                level: 0
                            },
                            spacing: { before: 100, after: 100 }
                        }));
                    });
                    break;

                case 'table':
                    const rows = [];
                    // 添加表头
                    if (token.header) {
                        const headerRow = new docx.TableRow({
                            children: token.header.map(cell => {
                                return new docx.TableCell({
                                    children: [new docx.Paragraph({
                                        children: processMarkdownText(cell.text),
                                        bold: true
                                    })],
                                    shading: {
                                        fill: "F2F2F2"
                                    }
                                });
                            })
                        });
                        rows.push(headerRow);
                    }

                    // 添加表格内容
                    token.rows.forEach(row => {
                        rows.push(new docx.TableRow({
                            children: row.map(cell => {
                                return new docx.TableCell({
                                    children: [new docx.Paragraph({
                                        children: processMarkdownText(cell.text)
                                    })]
                                });
                            })
                        }));
                    });

                    // 创建表格
                    const table = new docx.Table({
                        rows: rows,
                        width: {
                            size: 100,
                            type: docx.WidthType.PERCENTAGE
                        }
                    });
                    paragraphs.push(table);
                    break;

                case 'code':
                    paragraphs.push(new docx.Paragraph({
                        text: token.text,
                        style: 'Code',
                        spacing: { before: 200, after: 200 },
                        shading: {
                            fill: "F8F8F8"
                        }
                    }));
                    break;

                case 'hr':
                    paragraphs.push(new docx.Paragraph({
                        children: [new docx.TextRun({
                            text: '',
                            break: 1
                        })],
                        border: {
                            bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "999999" }
                        }
                    }));
                    break;
            }
        }

        return paragraphs;
    }

    // 转换为Word文档
    convertBtn.addEventListener('click', () => {
        try {
            if (!markdownInput.value.trim()) {
                showToast('请先粘贴或输入要转换的文本');
                return;
            }

            showToast('正在生成Word文档...');
            // 创建新文档
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: convertMarkdownToDocxParagraphs(markdownInput.value)
                }],
                styles: {
                    paragraphStyles: [
                        {
                            id: "Heading1",
                            name: "Heading 1",
                            run: {
                                size: 32,
                                bold: true,
                                color: "000000"
                            },
                            paragraph: {
                                spacing: { before: 400, after: 200 }
                            }
                        },
                        {
                            id: "Heading2",
                            name: "Heading 2",
                            run: {
                                size: 28,
                                bold: true,
                                color: "000000"
                            },
                            paragraph: {
                                spacing: { before: 350, after: 200 }
                            }
                        },
                        {
                            id: "Heading3",
                            name: "Heading 3",
                            run: {
                                size: 24,
                                bold: true,
                                color: "000000"
                            },
                            paragraph: {
                                spacing: { before: 300, after: 200 }
                            }
                        },
                        {
                            id: "Code",
                            name: "Code",
                            run: {
                                font: "Consolas",
                                size: 20
                            },
                            paragraph: {
                                spacing: { before: 200, after: 200 },
                                indent: { left: 720 }  // 720 = 0.5 inch
                            }
                        }
                    ]
                }
            });

            // 生成文档并下载
            docx.Packer.toBlob(doc).then(blob => {
                saveAs(blob, 'AI文本转换.docx');
                showToast('Word文档已生成，正在下载...');
            });
        } catch (error) {
            console.error('转换失败:', error);
            showToast('转换失败：' + error.message);
        }
    });
}); 