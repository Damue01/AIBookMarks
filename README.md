<p align="center">
  <img src="public/icons/icon.svg" width="128" height="128" alt="AIBookMarks Logo">
</p>

<h1 align="center">AIBookMarks</h1>

<p align="center">
  <strong>🔖 AI 驱动的浏览器书签管理器</strong><br>
  让 AI 帮你整理杂乱的书签，自动分类、智能归档、一键管理
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-MV3-brightgreen?logo=googlechrome" alt="Chrome MV3">
  <img src="https://img.shields.io/badge/Firefox-MV2-orange?logo=firefox" alt="Firefox MV2">
  <img src="https://img.shields.io/badge/Edge-MV3-blue?logo=microsoftedge" alt="Edge MV3">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License">
</p>

---

## ✨ 功能亮点

- 🤖 **AI 智能分类** — 支持 OpenAI / Claude / Ollama / 自定义 API，AI 分析书签内容并自动建议分类方案
- 📂 **分类规划** — AI 先生成目录结构方案，你确认后再执行，全程可控
- ⚡ **新书签自动归类** — 每次收藏新书签时实时分析，页面内 Toast 通知提示归类建议
- 📏 **自定义规则** — 支持域名匹配、通配符、正则表达式，规则优先于 AI
- 🔄 **拖放排序** — 拖动书签和文件夹调整顺序，拖入文件夹快速移动
- 💾 **备份与恢复** — 整理前自动备份，支持导入/导出 JSON，一键回滚
- 🌐 **中英双语** — 界面完整支持中文和 English

---

## 📸 功能概览

### 浏览书签

在弹出窗口中浏览所有书签，像文件管理器一样层级导航：

- **文件夹导航** — 面包屑路径 + 返回按钮，点击任意层级跳转
- **全局搜索** — 实时搜索书签标题和 URL
- **6 种排序** — 默认 / 名称升降序 / 日期新旧 / 按域名，支持永久写入排序
- **拖放操作** — 拖动调整顺序，拖入文件夹快速移动
- **多选批量删除** — 进入选择模式，勾选后一键删除
- **文件夹管理** — 新建 / 重命名（双击行内编辑）/ 删除
- **书签编辑** — 行内编辑标题和 URL、打开链接、复制链接

### AI 智能整理

三步完成书签整理：

```
1️⃣ 选择范围  →  2️⃣ AI 生成分类方案  →  3️⃣ 预览并确认执行
```

#### 第一步：选择整理范围

| 模式 | 说明 |
|------|------|
| 🗂️ 整理全部 | 分析所有书签 |
| 📌 仅未分类 | 只分析未归入文件夹的书签 |

#### 第二步：分类规划

AI 根据你的书签域名分布、现有文件夹结构、书签标题自动生成建议的目录结构（8-20 个分类），你可以：

- ✏️ 编辑分类名称
- ❌ 删除不需要的分类
- ➕ 手动添加自定义分类（支持多级路径，如 `开发/前端`）
- 🔁 不满意可重新生成

确认后，AI 将**严格按照你批准的分类**来整理书签。

#### 第三步：预览与执行

AI 分析完成后，每条建议展示：

- 书签标题、URL、favicon
- 当前路径 → 建议路径
- AI 给出的分类理由
- 新建文件夹标记 🆕

你可以逐条 **接受 / 拒绝 / 修改目标文件夹**，支持按类型过滤（移动 / 新建文件夹 / 待确认），也支持全选操作。

执行整理时自动：
- ✅ 整理前创建备份（可配置）
- ✅ 合并同名重复文件夹
- ✅ 清理空文件夹

> 💡 分析在后台 Service Worker 中运行，关闭 popup 也不会中断。重新打开时自动恢复进度。

---

### 新书签自动归类

每次收藏新书签时自动触发：

1. **规则匹配优先** — 先检查自定义规则，命中则直接使用规则的目标文件夹
2. **AI 智能兜底** — 规则未命中时，AI 实时分析给出归类建议
3. **页面内 Toast 通知** — 在当前网页右上角显示浮动通知（Shadow DOM 隔离，不受页面样式影响）
4. **一键接受** — 点击"接受"自动移动书签到建议文件夹

支持两种模式：
| 模式 | 行为 |
|------|------|
| 🔔 通知模式 | 页面内显示 Toast，用户确认后移动 |
| 🤫 静默模式 | 直接自动移动，无任何提示 |

---

### 自定义规则

自定义规则优先于 AI 建议：

| 匹配方式 | 示例 | 说明 |
|----------|------|------|
| 域名匹配 | `github.com` | 精确匹配域名，自动包含子域名 |
| 通配符 | `*.github.com` | `*` 通配符匹配域名或 URL |
| 正则表达式 | `^https://github\.com` | 完全自定义正则匹配 |

每条规则包含：名称、匹配模式、目标文件夹路径、启用/禁用开关。规则按列表顺序匹配，第一个命中的生效。

---

### 备份与恢复

| 功能 | 说明 |
|------|------|
| 📦 手动备份 | 一键创建当前书签快照 |
| 🔄 整理前自动备份 | 执行 AI 整理前自动创建备份 |
| ⬇️ 导出 | 备份导出为 JSON 文件 |
| ⬆️ 导入 | 从 JSON 文件导入备份 |
| 🔙 恢复 | 一键恢复到任意备份点 |
| 🗑️ 自动清理 | 超过保留上限自动删除最旧备份 |

---

## 🤖 支持的 AI 服务

| 提供商 | 推荐模型 | 需要 API Key | 说明 |
|--------|----------|:---:|------|
| **OpenAI** | gpt-4o-mini, gpt-4o | ✅ | 推荐，性价比高 |
| **Anthropic Claude** | claude-3-5-sonnet, claude-3-5-haiku | ✅ | 分类效果优秀 |
| **Ollama** | llama3.2, qwen2.5, mistral | ❌ | 本地运行，完全免费 |
| **Custom** | 自定义 | ✅ | 兼容 OpenAI API 格式的任意服务 |

每个提供商的 API Key、Base URL、模型选择**独立保存**，切换提供商时互不影响。

---

## 🚀 安装与使用

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/your-username/AIBookMarks.git
cd AIBookMarks

# 安装依赖
npm install

# 开发模式（Chrome）
npm run dev

# 构建
npm run build           # Chrome MV3
npm run build:firefox   # Firefox MV2
npm run build:edge      # Edge MV3
```

### 安装到浏览器

**Chrome / Edge:**
1. 打开 `chrome://extensions`（或 `edge://extensions`）
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `dist/chrome-mv3` 目录（Edge 选择 `dist/edge-mv3`）

**Firefox:**
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「临时载入附加组件」
3. 选择 `dist/firefox-mv2/manifest.json`

### 配置 AI 服务

1. 点击扩展图标 → 右上角设置按钮
2. 在「AI 服务配置」中选择提供商
3. 填入 API Key（Ollama 无需）
4. 点击「测试连接」验证
5. 保存

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 扩展框架 | [WXT](https://wxt.dev/) |
| 前端框架 | React 18 + TypeScript 5 |
| 样式 | Tailwind CSS + tailwindcss-animate |
| UI 组件 | shadcn/ui (Radix UI) |
| 状态管理 | Zustand |
| 数据存储 | Chrome Storage API + IndexedDB (Dexie) |
| 拖放 | dnd-kit |
| 国际化 | i18next + react-i18next |
| 图标 | Lucide React |

---

## 📁 项目结构

```
src/
├── background/          # Service Worker（分析引擎、自动归类、书签操作）
├── components/ui/       # shadcn/ui 基础组件
├── entrypoints/         # 扩展入口点
│   ├── background.ts    # Background 入口
│   ├── popup/           # 弹出窗口
│   ├── options/         # 设置页面
│   └── bkmk-helper.content/  # Content Script（Toast 通知）
├── locales/             # 国际化文案（zh / en）
├── options/             # 设置页面组件
│   └── pages/           # AI 配置 / 通用设置 / 规则管理 / 备份管理
├── popup/               # 弹出窗口组件
│   ├── components/      # FolderCard / BookmarkItem / SortDropdown 等
│   └── pages/           # 浏览 / 整理 / 分类规划 / 预览
├── services/            # 服务层
│   ├── ai/              # AI 提供商实现（OpenAI / Claude / Ollama / Custom）
│   ├── backup.ts        # 备份服务
│   ├── rules.ts         # 规则匹配引擎
│   └── i18n.ts          # 国际化初始化
├── shared/              # 共享模块（类型、常量、工具函数、排序工具）
└── stores/              # Zustand 状态管理（书签 / 整理 / 设置）
```

---

## 📄 License

[MIT](LICENSE)
