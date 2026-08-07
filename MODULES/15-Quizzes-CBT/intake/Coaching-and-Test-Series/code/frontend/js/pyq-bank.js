// ========================================
// PYQ BANK - Complete JavaScript
// ========================================

// ========================================
// ANIMATE STAT COUNTERS
// ========================================
const statNumbers = document.querySelectorAll('.pyq-stat-card .num');

const animateStat = (el) => {
    const target = parseInt(el.dataset.count);
    if (!target) return;
    const duration = 1500;
    const startTime = performance.now();

    const update = (time) => {
        const progress = Math.min((time - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;

        el.textContent = Math.floor(current).toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target.toLocaleString();
        }
    };

    requestAnimationFrame(update);
};

setTimeout(() => {
    statNumbers.forEach(c => animateStat(c));
}, 300);

// ========================================
// FILTER BUTTON
// ========================================
const applyFiltersBtn = document.querySelector('.pyq-filters .btn-primary-sm');
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', function() {
        const exam = document.querySelector('.filter-group:first-child .filter-select')?.value || 'All';
        const year = document.querySelector('.filter-group:nth-child(2) .filter-select')?.value || 'All';
        const subject = document.querySelector('.filter-group:nth-child(3) .filter-select')?.value || 'All';
        const difficulty = document.querySelector('.filter-group:nth-child(4) .filter-select')?.value || 'All';

        showToast(`🔍 Filtering: ${exam} · ${year} · ${subject} · ${difficulty}`);

        const cards = document.querySelectorAll('.pyq-card');
        cards.forEach((card, index) => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, 50 * index);
        });
    });
}

// ========================================
// FILTER SELECT CHANGES
// ========================================
document.querySelectorAll('.filter-select').forEach(select => {
    select.addEventListener('change', function() {
        const filters = document.querySelectorAll('.filter-select');
        let filterText = '';
        filters.forEach(f => {
            if (f.value !== 'All' && f.value !== 'All Years' && f.value !== 'All Subjects' && f.value !== 'All') {
                filterText += f.value + ' · ';
            }
        });
        if (filterText) {
            showToast(`🔍 Filter: ${filterText.slice(0, -3)}`);
        }
    });
});

// ========================================
// PYQ CARD CLICK - Open Question
// ========================================
document.querySelectorAll('.pyq-card').forEach(card => {
    card.addEventListener('click', function() {
        const title = this.querySelector('h4')?.textContent || 'Question';
        const exam = this.querySelector('.pyq-tag.jee, .pyq-tag.neet, .pyq-tag.ntse, .pyq-tag.rmo, .pyq-tag.inmo')?.textContent || 'PYQ';
        const year = this.querySelector('.pyq-tag.year')?.textContent || '';

        showToast(`📚 Opening "${exam} ${year} - ${title}"...`);

        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 200);
    });
});

// ========================================
// TOAST NOTIFICATION
// ========================================
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 12px 24px;
        background: var(--slate-card);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        backdrop-filter: blur(12px);
        color: var(--white);
        font-size: 0.85rem;
        z-index: 9999;
        animation: slideUp 0.4s ease;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        font-family: 'Inter', sans-serif;
    `;

    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const firstFilter = document.querySelector('.filter-select');
        if (firstFilter) {
            firstFilter.focus();
            showToast('🔍 Search filters focused');
        }
    }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        document.querySelectorAll('.filter-select').forEach(select => {
            select.selectedIndex = 0;
        });
        showToast('🔄 Filters reset');
        if (applyFiltersBtn) {
            applyFiltersBtn.click();
        }
    }
});

// ========================================
// SCROLL REVEAL FOR CARDS
// ========================================
const cardElements = document.querySelectorAll('.pyq-card, .pyq-stat-card');

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            entry.target.style.transition = `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${(index % 6) * 0.06}s`;
            cardObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

cardElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    cardObserver.observe(el);
});

// ============================================
// PYQ BANK EXPORT
// ============================================

function exportPYQList() {
    showToast('📚 Generating PYQ list...');

    const data = {
        date: new Date().toLocaleString(),
        pyqs: [
            { exam: 'JEE Main', year: '2024', subject: 'Physics', topic: 'Newton\'s Laws', questions: 5 },
            { exam: 'NEET', year: '2024', subject: 'Chemistry', topic: 'Organic Chemistry', questions: 8 },
            { exam: 'NTSE', year: '2023', subject: 'Mathematics', topic: 'Number Systems', questions: 6 },
            { exam: 'RMO', year: '2024', subject: 'Mathematics', topic: 'Combinatorics', questions: 4 }
        ],
        stats: {
            total: 1248,
            exams: 5,
            years: 8,
            subjects: 4
        }
    };

    let csv = 'EduTech - PYQ Bank List\n';
    csv += '=======================\n\n';
    csv += `Generated: ${data.date}\n\n`;
    csv += '--- Statistics ---\n';
    csv += `Total Questions: ${data.stats.total}\n`;
    csv += `Exams: ${data.stats.exams}\n`;
    csv += `Years: ${data.stats.years}\n`;
    csv += `Subjects: ${data.stats.subjects}\n\n`;
    csv += '--- PYQ List ---\n';
    data.pyqs.forEach(p => {
        csv += `${p.exam} ${p.year} - ${p.subject} (${p.topic}): ${p.questions} questions\n`;
    });
    csv += '\n--- Powered by EduTech ---';

    downloadCSV(csv, `PYQ_List_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('✅ PYQ list downloaded!');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

window.exportPYQList = exportPYQList;
window.downloadCSV = downloadCSV;

console.log('📚 PYQ Bank loaded successfully');
console.log('⌨️ Keyboard shortcuts: Ctrl+K = focus filters, R = reset filters');