// ========================================
// CURSOR
// ========================================
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

if (cursorDot && cursorRing) {
    let mouseX = 0,
        mouseY = 0;
    let ringX = 0,
        ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';

        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
    });

    document.querySelectorAll('a, button, .module-card, .bento-card, .pricing-card, .ai-card, .feature-card, .pyq-card, .test-card-full')
        .forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorDot.style.width = '12px';
                cursorDot.style.height = '12px';
                cursorDot.style.background = 'rgba(79, 70, 229, 0.6)';
                cursorRing.style.width = '56px';
                cursorRing.style.height = '56px';
                cursorRing.style.borderColor = 'rgba(79, 70, 229, 0.5)';
            });
            el.addEventListener('mouseleave', () => {
                cursorDot.style.width = '8px';
                cursorDot.style.height = '8px';
                cursorDot.style.background = 'var(--indigo)';
                cursorRing.style.width = '40px';
                cursorRing.style.height = '40px';
                cursorRing.style.borderColor = 'rgba(79, 70, 229, 0.3)';
            });
        });
}

// ========================================
// NAVBAR SCROLL
// ========================================
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
});

// ========================================
// ANIMATED COUNTERS
// ========================================
const counters = document.querySelectorAll('.stat-number');

const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    if (!target) return;
    const duration = 2000;
    const startTime = performance.now();

    const update = (time) => {
        const progress = Math.min((time - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;

        if (target % 1 !== 0) {
            el.textContent = (eased * target).toFixed(1);
        } else {
            el.textContent = Math.floor(current).toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target % 1 !== 0 ? target.toFixed(1) : target.toLocaleString();
        }
    };

    requestAnimationFrame(update);
};

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => animateCounter(entry.target), index * 200);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(c => counterObserver.observe(c));

// ========================================
// SCROLL REVEAL ANIMATIONS
// ========================================
const revealElements = document.querySelectorAll(
    '.feature-card, .ai-card-full, .pricing-card, .testimonial-card, .section-header, .analytics-card'
);

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            const el = entry.target;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.06}s`;
            revealObserver.unobserve(el);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    revealObserver.observe(el);
});

// ========================================
// FAQ ACCORDION
// ========================================
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) {
            item.classList.add('open');
        }
    });
});

// ========================================
// SMOOTH SCROLL
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const navHeight = 80;
            const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ========================================
// PARALLAX FLOATING CARDS
// ========================================
const floatCards = document.querySelectorAll('.float-card');

document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    floatCards.forEach((card, i) => {
        const speed = 0.02 * (i + 1);
        card.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
});

// ========================================
// SMOOTH PAGE ENTRY
// ========================================
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.6s ease';

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ========================================
// BUTTON RIPPLE
// ========================================
document.querySelectorAll('.btn-primary, .btn-secondary, .btn-outline').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                border-radius: 50%;
                background: rgba(255,255,255,0.15);
                transform: scale(0);
                animation: ripple 0.6s ease-out forwards;
                pointer-events: none;
            `;

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
            @keyframes ripple {
                to { transform: scale(4); opacity: 0; }
            }
        `;
    document.head.appendChild(style);
}

// ========================================
// NAV TOGGLE (Mobile)
// ========================================
const navToggle = document.querySelector('.nav-toggle');
if (navToggle) {
    navToggle.addEventListener('click', () => {
        const links = document.querySelector('.nav-links');
        const actions = document.querySelector('.nav-actions');
        if (links) links.classList.toggle('open');
        if (actions) actions.classList.toggle('open');
        navToggle.classList.toggle('active');
    });
}

console.log('🚀 EduTech Solutions — The Future of Competitive Exam Preparation');