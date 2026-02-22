// ============================================
// AIBookMarks 宣传网站 — 增强交互版
// ============================================

// ===== 中英文翻译数据 =====
const translations = {
    zh: {
        nav_github: 'GitHub',
        hero_title: 'AI 驱动的浏览器书签管理器',
        hero_subtitle: '让 AI 帮你整理杂乱的书签，自动分类、智能归档、一键管理',
        btn_install: 'Chrome 安装 (即将上线)',
        btn_github: 'GitHub 源码',
        features_title: '功能亮点',
        feat_ai_title: '智能分类',
        feat_ai_desc: '基于大语言模型，自动分析网页内容并归类到合适的文件夹。',
        feat_auto_title: '自动归档',
        feat_auto_desc: '添加新书签时自动触发分类，无需手动整理。',
        feat_rules_title: '自定义规则',
        feat_rules_desc: '支持正则匹配和域名规则，规则优先，AI 兜底。',
        feat_search_title: '全局搜索',
        feat_search_desc: '快速检索所有书签，支持拼音和模糊搜索。',
        feat_batch_title: '批量管理',
        feat_batch_desc: '一键整理整个文件夹或所有未分类书签。',
        feat_models_title: '多模型支持',
        feat_models_desc: '内置支持 OpenAI、Claude、Ollama 及自定义 API。',
        feat_privacy_title: '隐私安全',
        feat_privacy_desc: 'API Key 本地存储，数据不经过第三方服务器。',
        workflow_title: '工作流程',
        step1_title: '选择范围',
        step1_desc: '选择需要整理的书签或文件夹',
        step2_title: 'AI 生成方案',
        step2_desc: 'AI 分析并生成分类建议',
        step3_title: '预览确认',
        step3_desc: '检查无误后一键应用更改',
        auto_title: '无感自动归类',
        auto_desc: '开启自动分类后，每次添加新书签都会在后台静默处理。',
        auto_feat1_title: '规则优先：',
        auto_feat1_desc: '优先匹配自定义规则，匹配失败再调用 AI。',
        auto_feat2_title: '两种模式：',
        auto_feat2_desc: '支持「直接移动」和「仅建议」模式。',
        auto_feat3_title: '即时通知：',
        auto_feat3_desc: '分类完成后通过 Toast 弹窗通知结果。',
        toast_title: '书签已分类',
        toast_message: '"GitHub - AIBookMarks" 已移动至 "开发工具"',
        ai_title: '支持的 AI 服务',
        ai_openai_model: '推荐：gpt-4o-mini',
        ai_openai_desc: '速度快，分类准确率高，适合日常使用。',
        ai_claude_model: '推荐：claude-3-haiku',
        ai_claude_desc: '理解能力强，适合复杂网页的分类。',
        ai_ollama_model: '推荐：qwen2.5',
        ai_ollama_desc: '本地部署，完全免费，极致隐私保护。',
        ai_custom_title: '自定义 API',
        ai_custom_model: '兼容 OpenAI 格式',
        ai_custom_desc: '支持 DeepSeek、通义千问等第三方兼容接口。',
        privacy_title: '隐私与安全',
        privacy_key_title: '自持 API Key',
        privacy_key_desc: '我们不提供也不收集 API Key，所有调用均在本地直接请求服务商。',
        privacy_data_title: '数据本地化',
        privacy_data_desc: '书签数据仅保存在您的浏览器中，绝不上传至任何第三方服务器。',
        privacy_open_title: '开源透明',
        privacy_open_desc: '代码完全开源，接受社区监督，安全可靠。',
        footer_privacy: '隐私政策'
    },
    en: {
        nav_github: 'GitHub',
        hero_title: 'AI-Powered Bookmark Manager',
        hero_subtitle: 'Let AI organize your messy bookmarks. Auto-categorize, smart filing, one-click management.',
        btn_install: 'Install for Chrome (Coming Soon)',
        btn_github: 'View on GitHub',
        features_title: 'Key Features',
        feat_ai_title: 'Smart Categorization',
        feat_ai_desc: 'Leverages Large Language Models to analyze webpage content and categorize into appropriate folders.',
        feat_auto_title: 'Auto-Filing',
        feat_auto_desc: 'Automatically triggers classification when adding new bookmarks, no manual sorting needed.',
        feat_rules_title: 'Custom Rules',
        feat_rules_desc: 'Supports regex and domain matching rules, with rules taking priority over AI.',
        feat_search_title: 'Global Search',
        feat_search_desc: 'Quickly search all bookmarks with pinyin and fuzzy search support.',
        feat_batch_title: 'Batch Management',
        feat_batch_desc: 'Organize entire folders or all uncategorized bookmarks with one click.',
        feat_models_title: 'Multi-Model Support',
        feat_models_desc: 'Built-in support for OpenAI, Claude, Ollama, and custom APIs.',
        feat_privacy_title: 'Privacy & Security',
        feat_privacy_desc: 'API Keys stored locally, data never goes through third-party servers.',
        workflow_title: 'Workflow',
        step1_title: 'Select Scope',
        step1_desc: 'Choose bookmarks or folders to organize',
        step2_title: 'AI Generate Plan',
        step2_desc: 'AI analyzes and suggests categories',
        step3_title: 'Preview & Confirm',
        step3_desc: 'Review and apply changes with one click',
        auto_title: 'Seamless Auto-Classification',
        auto_desc: 'Once enabled, every new bookmark is automatically processed in the background.',
        auto_feat1_title: 'Rules First:',
        auto_feat1_desc: 'Custom rules are matched first, AI kicks in on mismatch.',
        auto_feat2_title: 'Two Modes:',
        auto_feat2_desc: 'Supports "Direct Move" and "Suggest Only" modes.',
        auto_feat3_title: 'Instant Notification:',
        auto_feat3_desc: 'Shows toast notification when classification completes.',
        toast_title: 'Bookmark Classified',
        toast_message: '"GitHub - AIBookMarks" moved to "Dev Tools"',
        ai_title: 'Supported AI Services',
        ai_openai_model: 'Recommended: gpt-4o-mini',
        ai_openai_desc: 'Fast and accurate, perfect for daily use.',
        ai_claude_model: 'Recommended: claude-3-haiku',
        ai_claude_desc: 'Strong comprehension, great for complex categorization.',
        ai_ollama_model: 'Recommended: qwen2.5',
        ai_ollama_desc: 'Local deployment, completely free, maximum privacy.',
        ai_custom_title: 'Custom API',
        ai_custom_model: 'OpenAI-compatible',
        ai_custom_desc: 'Supports DeepSeek, Qwen, and other compatible services.',
        privacy_title: 'Privacy & Security',
        privacy_key_title: 'Bring Your Own Key',
        privacy_key_desc: 'We do not provide or collect API Keys. All requests go directly to the service provider.',
        privacy_data_title: 'Local Data',
        privacy_data_desc: 'Bookmark data is only stored in your browser, never uploaded to any third-party server.',
        privacy_open_title: 'Open Source',
        privacy_open_desc: 'Fully open-source code, community-audited for security and reliability.',
        footer_privacy: 'Privacy Policy'
    }
};

let currentLang = localStorage.getItem('aibookmarks_lang') || 'zh';

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initScrollProgress();
    initNavbarScroll();
    initScrollAnimations();
    initTiltCards();
    initParticleCanvas();
    initAutoFeatureReveal();
    initSmoothAnchors();
});

// ===== 语言切换 =====
function initLanguage() {
    var langBtn = document.getElementById('lang-switch');
    updateLangButton();
    applyTranslations();
    langBtn.addEventListener('click', function () {
        currentLang = currentLang === 'zh' ? 'en' : 'zh';
        localStorage.setItem('aibookmarks_lang', currentLang);
        updateLangButton();
        applyTranslations();
    });
}

function updateLangButton() {
    var langBtn = document.getElementById('lang-switch');
    langBtn.textContent = currentLang === 'zh' ? 'EN' : '中文';
    document.documentElement.setAttribute('lang', currentLang === 'zh' ? 'zh' : 'en');
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            if (el.children.length > 0) {
                // Replace only direct text node children
                var span = el.querySelector('span');
                if (span) {
                    span.textContent = translations[currentLang][key];
                } else {
                    el.textContent = translations[currentLang][key];
                }
            } else {
                el.textContent = translations[currentLang][key];
            }
        }
    });
}

// ===== 滚动进度条 =====
function initScrollProgress() {
    var bar = document.getElementById('scroll-progress');
    window.addEventListener('scroll', function () {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
    }, { passive: true });
}

// ===== 导航栏滚动阴影 =====
function initNavbarScroll() {
    var navbar = document.getElementById('navbar');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });
}

// ===== 滚动动画 (IntersectionObserver) =====
function initScrollAnimations() {
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
        observer.observe(el);
    });
}

// ===== 卡片鼠标追踪倾斜 + 光晕 =====
function initTiltCards() {
    // Skip on touch devices
    if ('ontouchstart' in window) return;

    document.querySelectorAll('.tilt-card').forEach(function (card) {
        var glow = card.querySelector('.card-glow');

        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;
            var rotateX = ((y - centerY) / centerY) * -6;
            var rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform =
                'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';

            if (glow) {
                glow.style.left = x + 'px';
                glow.style.top = y + 'px';
            }
        });

        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
            card.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
            setTimeout(function () { card.style.transition = ''; }, 500);
        });
    });
}

// ===== Hero 粒子背景 (Canvas) =====
function initParticleCanvas() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var PARTICLE_COUNT = 50;
    var mouse = { x: -1000, y: -1000 };

    function resize() {
        canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
        canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
    resize();
    window.addEventListener('resize', resize);

    // Mouse interaction in hero area
    var heroSection = canvas.parentElement;
    heroSection.addEventListener('mousemove', function (e) {
        var rect = heroSection.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    heroSection.addEventListener('mouseleave', function () {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Create particles
    for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.offsetWidth,
            y: Math.random() * canvas.offsetHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r: Math.random() * 2 + 1,
            opacity: Math.random() * 0.4 + 0.1
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        var w = canvas.offsetWidth;
        var h = canvas.offsetHeight;

        particles.forEach(function (p) {
            // Move
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            // Mouse repel
            var dx = p.x - mouse.x;
            var dy = p.y - mouse.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                var force = (120 - dist) / 120;
                p.x += (dx / dist) * force * 2;
                p.y += (dy / dist) * force * 2;
            }

            // Draw dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59,130,246,' + p.opacity + ')';
            ctx.fill();
        });

        // Draw connections
        for (var i = 0; i < particles.length; i++) {
            for (var j = i + 1; j < particles.length; j++) {
                var dx = particles[i].x - particles[j].x;
                var dy = particles[i].y - particles[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(59,130,246,' + (0.08 * (1 - dist / 100)) + ')';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }
    draw();
}

// ===== 自动归类列表交错显示 =====
function initAutoFeatureReveal() {
    var items = document.querySelectorAll('.auto-features li');
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                // Stagger each li
                var parent = entry.target.closest('.auto-features');
                if (parent) {
                    parent.querySelectorAll('li').forEach(function (li, i) {
                        setTimeout(function () {
                            li.classList.add('show');
                        }, i * 200);
                    });
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    if (items.length > 0) observer.observe(items[0]);
}

// ===== 平滑锚点滚动 =====
function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                var target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

// ===== 公开 API =====
window.AIBookMarks = {
    setLanguage: function (lang) {
        if (lang === 'zh' || lang === 'en') {
            currentLang = lang;
            localStorage.setItem('aibookmarks_lang', currentLang);
            updateLangButton();
            applyTranslations();
        }
    },
    getCurrentLanguage: function () {
        return currentLang;
    }
};