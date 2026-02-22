const i18n = {
    "zh": {
        "hero.title": "AI 驱动的浏览器书签管理器",
        "hero.subtitle": "让 AI 帮你整理杂乱的书签，自动分类、智能归档、一键管理",
        "hero.install": "⬇️ 安装到 Chrome",
        "hero.source": "查看源码",
        "features.title": "功能亮点",
        "features.ai.title": "AI 智能分类",
        "features.ai.desc": "支持 OpenAI / Claude / Ollama / 自定义 API，AI 分析书签内容并自动建议分类方案。",
        "features.plan.title": "分类规划",
        "features.plan.desc": "AI 先生成目录结构方案，你确认后再执行，全程可控，拒绝混乱。",
        "features.auto.title": "新书签自动归类",
        "features.auto.desc": "每次收藏新书签时实时分析，页面内 Toast 通知提示归类建议。",
        "features.rules.title": "自定义规则",
        "features.rules.desc": "支持域名匹配、通配符、正则表达式，规则优先于 AI，精准控制。",
        "features.sort.title": "拖放排序",
        "features.sort.desc": "拖动书签和文件夹调整顺序，拖入文件夹快速移动，操作流畅。",
        "features.backup.title": "备份与恢复",
        "features.backup.desc": "整理前自动备份，支持导入/导出 JSON，随时一键回滚，安全无忧。",
        "features.i18n.title": "中英双语",
        "features.i18n.desc": "界面完整支持中文和 English，无缝切换。",
        "features.privacy.title": "隐私安全",
        "features.privacy.desc": "用户自持 API Key，数据本地化处理，开源代码透明可查。",
        "workflow.title": "三步整理流程",
        "workflow.step1.title": "选择范围",
        "workflow.step1.desc": "选择整理全部书签或仅整理未分类书签。",
        "workflow.step2.title": "AI 生成方案",
        "workflow.step2.desc": "AI 分析并生成建议的目录结构，你可以修改或重新生成。",
        "workflow.step3.title": "预览确认",
        "workflow.step3.desc": "预览每条移动建议，确认无误后执行整理。",
        "ai.title": "支持的 AI 服务",
        "ai.openai": "推荐使用，性价比高，分类准确。",
        "ai.claude": "逻辑推理能力强，适合复杂分类。",
        "ai.ollama": "本地运行，完全免费，保护隐私。",
        "ai.custom": "支持任意兼容 OpenAI 接口的服务。",
        "footer.privacy": "隐私政策"
    },
    "en": {
        "hero.title": "AI-Powered Bookmark Manager",
        "hero.subtitle": "Let AI organize your messy bookmarks. Auto-categorize, smart filing, one-click management.",
        "hero.install": "⬇️ Add to Chrome",
        "hero.source": "View Source",
        "features.title": "Key Features",
        "features.ai.title": "AI Categorization",
        "features.ai.desc": "Supports OpenAI / Claude / Ollama / Custom API. AI analyzes content and suggests categories.",
        "features.plan.title": "Category Planning",
        "features.plan.desc": "AI generates a folder structure plan first. You confirm before execution. Full control.",
        "features.auto.title": "Auto-File New Bookmarks",
        "features.auto.desc": "Real-time analysis when you add a bookmark. In-page Toast notification for suggestions.",
        "features.rules.title": "Custom Rules",
        "features.rules.desc": "Domain matching, wildcards, regex. Rules take precedence over AI for precise control.",
        "features.sort.title": "Drag & Drop Sort",
        "features.sort.desc": "Drag to reorder bookmarks and folders. Drop into folders to move quickly.",
        "features.backup.title": "Backup & Restore",
        "features.backup.desc": "Auto-backup before organizing. Import/Export JSON. One-click rollback anytime.",
        "features.i18n.title": "Bilingual Support",
        "features.i18n.desc": "Full interface support for Chinese and English. Seamless switching.",
        "features.privacy.title": "Privacy & Security",
        "features.privacy.desc": "Bring your own API Key. Data processed locally. Open source and transparent.",
        "workflow.title": "3-Step Workflow",
        "workflow.step1.title": "Select Scope",
        "workflow.step1.desc": "Choose to organize all bookmarks or just unclassified ones.",
        "workflow.step2.title": "AI Generate Plan",
        "workflow.step2.desc": "AI analyzes and suggests a folder structure. Modify or regenerate as needed.",
        "workflow.step3.title": "Preview & Confirm",
        "workflow.step3.desc": "Preview every move suggestion. Confirm before executing the organization.",
        "ai.title": "Supported AI Services",
        "ai.openai": "Recommended. High performance and cost-effective.",
        "ai.claude": "Strong reasoning capabilities. Great for complex categorization.",
        "ai.ollama": "Run locally. Completely free. Privacy focused.",
        "ai.custom": "Supports any OpenAI-compatible API service.",
        "footer.privacy": "Privacy Policy"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const langToggle = document.getElementById('lang-toggle');
    let currentLang = localStorage.getItem('lang') || 'zh';

    function updateContent() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18n[currentLang][key]) {
                el.innerText = i18n[currentLang][key];
            }
        });
        langToggle.innerText = currentLang === 'zh' ? 'EN' : '中文';
        document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    }

    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'zh' ? 'en' : 'zh';
        localStorage.setItem('lang', currentLang);
        updateContent();
    });

    // Initial load
    updateContent();

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.feature-card, .ai-card, .step').forEach(el => {
        observer.observe(el);
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });

    // Add visible class styles dynamically or rely on inline styles being overridden?
    // Let's add a style block for the visible class logic if not present in CSS
    // Or just inline the logic here:
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
});
