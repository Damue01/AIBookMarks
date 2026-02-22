// ============================================================
//  AIBookMarks Landing Page - script.js
//  i18n: 中文 (default) / English toggle
// ============================================================

const i18n = {
  zh: {
    // Navbar
    "nav.brand":   "AIBookMarks",
    "nav.lang":    "English",
    "nav.github":  "GitHub",

    // Hero
    "hero.title1":  "AI 驱动的",
    "hero.title2":  "书签管理器",
    "hero.sub":     "让 AI 帮你整理杂乱的书签，自动分类、智能归档、一键管理。支持 OpenAI、Claude、Ollama 等多种 AI 服务。",
    "hero.cta1":    "🚀 即将上架 Chrome 商店",
    "hero.cta2":    "⭐ GitHub 源码",
    "hero.badge.chrome":  "Chrome MV3",
    "hero.badge.firefox": "Firefox MV2",
    "hero.badge.edge":    "Edge MV3",

    // Features
    "features.label":    "核心功能",
    "features.title":    "一切你需要的书签管理功能",
    "features.subtitle": "从 AI 智能整理到自定义规则，从拖放排序到数据备份，全面覆盖你的书签管理需求。",
    "f1.title": "AI 智能分类",
    "f1.desc":  "支持 OpenAI / Claude / Ollama / 自定义 API，AI 分析书签内容并自动建议分类方案。",
    "f2.title": "分类规划",
    "f2.desc":  "AI 先生成目录结构方案，你确认后再执行，AI 严格按你批准的分类整理书签。",
    "f3.title": "新书签自动归类",
    "f3.desc":  "每次收藏新书签时实时分析，页面内 Toast 通知提示归类建议，一键接受。",
    "f4.title": "自定义规则",
    "f4.desc":  "支持域名匹配、通配符、正则表达式，规则优先于 AI 建议，精准可控。",
    "f5.title": "拖放排序",
    "f5.desc":  "拖动书签和文件夹调整顺序，拖入文件夹快速移动，交互自然流畅。",
    "f6.title": "备份与恢复",
    "f6.desc":  "整理前自动备份，支持导入/导出 JSON，一键恢复到任意备份点，操作无忧。",
    "f7.title": "中英双语",
    "f7.desc":  "界面完整支持简体中文和 English，无障碍切换，全球用户都能使用。",

    // Workflow
    "workflow.label":    "使用流程",
    "workflow.title":    "三步完成书签整理",
    "workflow.subtitle": "全程可控，整理前预览，确认后执行。",
    "w1.title": "选择整理范围",
    "w1.desc":  "选择整理全部书签，或仅整理尚未归入文件夹的未分类书签。",
    "w2.title": "AI 生成分类方案",
    "w2.desc":  "AI 自动生成 8–20 个分类的目录结构方案，你可以编辑、删除或添加自定义分类。",
    "w3.title": "预览并确认执行",
    "w3.desc":  "逐条预览 AI 建议，接受 / 拒绝 / 修改目标文件夹，全选或批量操作后一键执行。",

    // Auto-classify
    "auto.label":    "自动归类",
    "auto.title":    "每次收藏，实时智能归档",
    "auto.subtitle": "规则优先，AI 兜底，双重保障不漏分。",
    "auto.s1.title": "规则匹配优先",
    "auto.s1.desc":  "先检查自定义规则，命中则直接使用规则的目标文件夹，无需 AI 调用。",
    "auto.s2.title": "AI 智能兜底",
    "auto.s2.desc":  "规则未命中时，AI 实时分析给出归类建议，准确率高。",
    "auto.s3.title": "页面内 Toast 通知",
    "auto.s3.desc":  "在当前网页右上角显示浮动通知，Shadow DOM 隔离，不受页面样式影响。",
    "auto.s4.title": "一键接受",
    "auto.s4.desc":  "点击「接受」自动移动书签到建议文件夹，也支持静默模式直接移动。",
    "mode.notify.title": "🔔 通知模式",
    "mode.notify.desc":  "页面内显示 Toast，用户确认后移动书签。",
    "mode.silent.title": "🤫 静默模式",
    "mode.silent.desc":  "直接自动移动，无任何提示，完全无感。",

    // AI Services
    "ai.label":    "AI 服务",
    "ai.title":    "支持 4 种 AI 提供商",
    "ai.subtitle": "每个提供商的 API Key、Base URL、模型选择独立保存，切换互不影响。",
    "ai.openai.model":  "gpt-4o-mini, gpt-4o",
    "ai.openai.badge":  "需要 API Key",
    "ai.openai.desc":   "推荐选择，性价比最高，响应速度快。",
    "ai.claude.model":  "claude-3-5-sonnet, claude-3-5-haiku",
    "ai.claude.badge":  "需要 API Key",
    "ai.claude.desc":   "分类效果优秀，理解能力强。",
    "ai.ollama.model":  "llama3.2, qwen2.5, mistral",
    "ai.ollama.badge":  "本地免费",
    "ai.ollama.desc":   "本地运行，完全免费，隐私最佳。",
    "ai.custom.model":  "任意兼容模型",
    "ai.custom.badge":  "自定义",
    "ai.custom.desc":   "兼容 OpenAI API 格式，接入任意第三方服务。",

    // Privacy
    "privacy.label":    "隐私与安全",
    "privacy.title":    "你的数据，始终在你手中",
    "privacy.subtitle": "我们不收集任何个人数据，所有信息均存储在你的浏览器本地。",
    "p1.title": "用户自持 API Key",
    "p1.desc":  "API Key 直接存储在浏览器本地，不经过任何中间服务器，只在你的设备上使用。",
    "p2.title": "数据本地化",
    "p2.desc":  "书签数据、备份、规则全部保存在本地，不上传云端，不依赖第三方存储。",
    "p3.title": "开源透明",
    "p3.desc":  "完整源代码在 GitHub 公开，MIT 许可，可随时审计与自定义。",
    "p4.title": "无追踪 / 无广告",
    "p4.desc":  "不含任何跟踪代码、广告 SDK 或数据收集逻辑，纯粹的工具。",

    // Footer
    "footer.copy": "© 2026 AIBookMarks · MIT License",
    "footer.github": "GitHub",
    "footer.privacy": "隐私政策",
    "footer.issues": "反馈问题",
  },

  en: {
    "nav.brand":   "AIBookMarks",
    "nav.lang":    "中文",
    "nav.github":  "GitHub",

    "hero.title1":  "AI-Powered",
    "hero.title2":  "Bookmark Manager",
    "hero.sub":     "Let AI organize your messy bookmarks — auto-classify, smart archiving, one-click management. Supports OpenAI, Claude, Ollama and more.",
    "hero.cta1":    "🚀 Coming to Chrome Store",
    "hero.cta2":    "⭐ View on GitHub",
    "hero.badge.chrome":  "Chrome MV3",
    "hero.badge.firefox": "Firefox MV2",
    "hero.badge.edge":    "Edge MV3",

    "features.label":    "Features",
    "features.title":    "Everything you need to manage bookmarks",
    "features.subtitle": "From AI-powered organizing to custom rules, drag & drop to data backup — fully covering your bookmark management needs.",
    "f1.title": "AI Smart Classification",
    "f1.desc":  "Supports OpenAI / Claude / Ollama / Custom API. AI analyzes bookmark content and automatically suggests a category plan.",
    "f2.title": "Category Planning",
    "f2.desc":  "AI proposes a folder structure first. You review and approve before any action — full control guaranteed.",
    "f3.title": "Auto-classify New Bookmarks",
    "f3.desc":  "Every new bookmark is analyzed in real-time. An in-page Toast notification shows the suggestion for one-click accept.",
    "f4.title": "Custom Rules",
    "f4.desc":  "Domain match, wildcards, and regex patterns. Rules take priority over AI — precise and controllable.",
    "f5.title": "Drag & Drop Sorting",
    "f5.desc":  "Drag bookmarks and folders to reorder, or drag into a folder to move quickly. Smooth natural interaction.",
    "f6.title": "Backup & Restore",
    "f6.desc":  "Auto-backup before organizing. Import/export JSON. Restore to any checkpoint with one click.",
    "f7.title": "Bilingual UI",
    "f7.desc":  "Full support for Simplified Chinese and English. Switch instantly — usable by anyone worldwide.",

    "workflow.label":    "How It Works",
    "workflow.title":    "3 Steps to Organized Bookmarks",
    "workflow.subtitle": "Full visibility at every step — preview before execution, confirm before committing.",
    "w1.title": "Choose Scope",
    "w1.desc":  "Organize all bookmarks, or only unclassified ones not yet placed in any folder.",
    "w2.title": "AI Generates Plan",
    "w2.desc":  "AI auto-generates a folder structure with 8–20 categories. Edit, delete, or add custom categories.",
    "w3.title": "Preview & Execute",
    "w3.desc":  "Review each AI suggestion, accept / reject / edit target folder, then execute with one click.",

    "auto.label":    "Auto-classify",
    "auto.title":    "Every bookmark, intelligently filed",
    "auto.subtitle": "Rules first, AI backup — double protection so nothing gets missed.",
    "auto.s1.title": "Rules First",
    "auto.s1.desc":  "Custom rules are checked first. If matched, the target folder is used directly — no AI call needed.",
    "auto.s2.title": "AI Fallback",
    "auto.s2.desc":  "When no rule matches, AI analyzes in real-time and provides a classification suggestion.",
    "auto.s3.title": "In-page Toast",
    "auto.s3.desc":  "A floating notification appears in the top-right of the current page. Shadow DOM isolated, unaffected by page styles.",
    "auto.s4.title": "One-click Accept",
    "auto.s4.desc":  "Click Accept to move the bookmark. Silent mode also supported for fully automatic operation.",
    "mode.notify.title": "🔔 Notify Mode",
    "mode.notify.desc":  "Shows a Toast on the page. User confirms before bookmark is moved.",
    "mode.silent.title": "🤫 Silent Mode",
    "mode.silent.desc":  "Bookmark is moved automatically with no notification at all.",

    "ai.label":    "AI Services",
    "ai.title":    "4 AI Providers Supported",
    "ai.subtitle": "Each provider's API Key, Base URL, and model choice are stored independently.",
    "ai.openai.model":  "gpt-4o-mini, gpt-4o",
    "ai.openai.badge":  "API Key Required",
    "ai.openai.desc":   "Recommended — best cost-performance ratio and fast response.",
    "ai.claude.model":  "claude-3-5-sonnet, claude-3-5-haiku",
    "ai.claude.badge":  "API Key Required",
    "ai.claude.desc":   "Excellent classification quality and strong comprehension.",
    "ai.ollama.model":  "llama3.2, qwen2.5, mistral",
    "ai.ollama.badge":  "Free / Local",
    "ai.ollama.desc":   "Runs locally, completely free, best privacy.",
    "ai.custom.model":  "Any compatible model",
    "ai.custom.badge":  "Custom",
    "ai.custom.desc":   "Compatible with OpenAI API format — connect any third-party service.",

    "privacy.label":    "Privacy & Security",
    "privacy.title":    "Your data, always in your hands",
    "privacy.subtitle": "We collect no personal data. All information stays locally in your browser.",
    "p1.title": "You Hold the API Key",
    "p1.desc":  "API Keys are stored locally in your browser — never sent to any intermediate server.",
    "p2.title": "Local-first Data",
    "p2.desc":  "Bookmarks, backups, and rules are all stored locally. No cloud uploads, no third-party storage.",
    "p3.title": "Open Source",
    "p3.desc":  "Full source code on GitHub under MIT license. Audit or customize anytime.",
    "p4.title": "No Tracking · No Ads",
    "p4.desc":  "Zero tracking code, advertising SDKs, or data collection logic. A pure tool.",

    "footer.copy": "© 2026 AIBookMarks · MIT License",
    "footer.github": "GitHub",
    "footer.privacy": "Privacy Policy",
    "footer.issues": "Report Issue",
  }
};

// ---- State ----
let currentLang = localStorage.getItem("aibm-lang") || "zh";

// ---- Apply translations ----
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("aibm-lang", lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const text = i18n[lang][key];
    if (text !== undefined) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });
}

// ---- Language toggle ----
document.addEventListener("DOMContentLoaded", () => {
  applyLang(currentLang);

  const langBtn = document.getElementById("langBtn");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      applyLang(currentLang === "zh" ? "en" : "zh");
    });
  }

  // ---- Fade-in observer ----
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".fade-in").forEach(el => observer.observe(el));
});
