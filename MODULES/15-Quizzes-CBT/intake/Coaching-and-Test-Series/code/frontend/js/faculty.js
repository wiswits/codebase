// ========================================
// FACULTY PANEL - Live Graphs & Interactions
// ========================================

(function() {
    'use strict';

    // ========================================
    // ANIMATE LIVE CHARTS
    // ========================================
    function animateLiveCharts() {
        // Animate all bar fills
        const barFills = document.querySelectorAll('.chart-bar-fill');
        
        barFills.forEach(function(bar) {
            const targetHeight = parseInt(bar.dataset.height);
            if (!targetHeight) return;
            
            // Start from 0
            bar.style.height = '0%';
            
            // Animate to target with delay
            setTimeout(function() {
                bar.style.height = targetHeight + '%';
            }, 200 + Math.random() * 300);
        });

        // Animate horizontal bars
        const hFills = document.querySelectorAll('.h-fill');
        hFills.forEach(function(bar, index) {
            const targetWidth = bar.style.width;
            bar.style.width = '0%';
            setTimeout(function() {
                bar.style.width = targetWidth;
            }, 300 + index * 100);
        });

        // Animate effectiveness numbers
        const effValues = document.querySelectorAll('.eff-value');
        effValues.forEach(function(el) {
            const text = el.textContent;
            const isPercentage = text.includes('%');
            const isDecimal = text.includes('.');
            let target = parseFloat(text);
            
            if (!target) return;
            
            const duration = 1500;
            const startTime = performance.now();
            
            function updateEffValue(time) {
                const progress = Math.min((time - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = eased * target;
                
                if (isDecimal) {
                    el.textContent = current.toFixed(1);
                } else if (isPercentage) {
                    el.textContent = Math.floor(current) + '%';
                } else {
                    el.textContent = Math.floor(current);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(updateEffValue);
                } else {
                    el.textContent = text;
                }
            }
            
            requestAnimationFrame(updateEffValue);
        });
    }

    // ========================================
    // LIVE UPDATE SIMULATION
    // ========================================
    function startLiveUpdates() {
        // Simulate live data updates every 5 seconds
        setInterval(function() {
            const bars = document.querySelectorAll('.chart-bar-fill');
            bars.forEach(function(bar) {
                // Randomly fluctuate by ±2%
                const currentHeight = parseFloat(bar.style.height) || parseFloat(bar.dataset.height);
                if (currentHeight) {
                    const fluctuation = (Math.random() - 0.5) * 4;
                    let newHeight = Math.max(10, Math.min(100, currentHeight + fluctuation));
                    bar.style.height = newHeight + '%';
                    
                    // Update the value display
                    const parent = bar.closest('.chart-bar-group');
                    if (parent) {
                        const valueEl = parent.querySelector('.chart-bar-value');
                        if (valueEl) {
                            valueEl.textContent = Math.round(newHeight) + '%';
                        }
                    }
                }
            });
        }, 5000);
    }

    // ========================================
    // THEME TOGGLE
    // ========================================
    let currentTheme = localStorage.getItem('edutech-theme') || 'dark';

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('edutech-theme', theme);
        currentTheme = theme;

        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            const thumb = toggle.querySelector('.toggle-thumb');
            if (thumb) {
                if (theme === 'light') {
                    thumb.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/></svg>`;
                } else {
                    thumb.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/></svg>`;
                }
            }
        }
    }

    function toggleTheme() {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    applyTheme(currentTheme);

    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', toggleTheme);
    }

    // ========================================
    // SIDEBAR NAVIGATION
    // ========================================
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    const sections = {
        overview: document.getElementById('section-overview'),
        doubts: document.getElementById('section-doubts'),
        students: document.getElementById('section-students'),
        questions: document.getElementById('section-questions'),
        performance: document.getElementById('section-performance'),
        tests: document.getElementById('section-tests'),
        settings: document.getElementById('section-settings')
    };

    function switchSection(sectionName) {
        Object.values(sections).forEach(section => {
            if (section) section.classList.add('hidden');
        });

        if (sections[sectionName]) {
            sections[sectionName].classList.remove('hidden');
            // Re-animate charts when switching to performance
            if (sectionName === 'performance' || sectionName === 'overview') {
                setTimeout(animateLiveCharts, 300);
            }
        }

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                switchSection(section);
                const label = this.textContent.trim().replace(/[0-9]+/g, '').trim();
                showToast('📂 Opening ' + label);
            }
        });
    });

    // ========================================
    // DOUBT BUTTON ACTIONS
    // ========================================
    function handleDoubtAction(e) {
        e.preventDefault();
        e.stopPropagation();

        const button = this;
        const action = button.textContent.trim();
        const doubtItem = button.closest('.doubt-item');

        if (!doubtItem) return;

        const studentName = doubtItem.querySelector('.doubt-student')?.textContent || 'Student';
        const statusBadge = doubtItem.querySelector('.doubt-status');

        if (action === 'Assign' || action === 'Assign ✓') {
            button.textContent = 'Assigned ✓';
            button.className = 'btn-sm resolve';
            if (statusBadge) {
                statusBadge.className = 'doubt-status assigned';
                statusBadge.textContent = 'Assigned';
            }
            showToast('✅ Doubt assigned to ' + studentName);

        } else if (action === 'Resolve' || action === 'Resolve ✓') {
            button.textContent = 'Resolved ✓';
            button.className = 'btn-sm';
            button.style.background = '#34D399';
            button.style.color = '#fff';
            if (statusBadge) {
                statusBadge.className = 'doubt-status resolved';
                statusBadge.textContent = 'Resolved';
            }
            showToast('✅ Doubt resolved for ' + studentName);
        }
    }

    function bindDoubtButtons() {
        const buttons = document.querySelectorAll('.btn-sm');
        buttons.forEach(btn => {
            btn.removeEventListener('click', handleDoubtAction);
            btn.addEventListener('click', handleDoubtAction);
        });
    }

    bindDoubtButtons();

    // ========================================
    // ANIMATE COUNTERS
    // ========================================
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-value');

        counters.forEach(function(counter) {
            const target = parseFloat(counter.dataset.count);
            if (!target && target !== 0) return;

            const duration = 1500;
            const startTime = performance.now();

            function updateCounter(time) {
                const progress = Math.min((time - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = eased * target;

                if (target % 1 !== 0) {
                    counter.textContent = current.toFixed(1);
                } else {
                    counter.textContent = Math.floor(current).toLocaleString();
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    if (target % 1 !== 0) {
                        counter.textContent = target.toFixed(1);
                    } else {
                        counter.textContent = target.toLocaleString();
                    }
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }

    // ========================================
    // TOAST NOTIFICATION
    // ========================================
    function showToast(message) {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'opacity 0.3s, transform 0.3s';
            setTimeout(function() { toast.remove(); }, 300);
        }, 2500);
    }

    // ========================================
    // CREATE TEST BUTTONS
    // ========================================
    document.querySelectorAll('#createTestBtn, #createTestBtn2').forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                showToast('📝 Opening test creation wizard...');
            });
        }
    });

    const addQBtn = document.getElementById('addQuestionBtn');
    if (addQBtn) {
        addQBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('📝 Opening question creator...');
        });
    }

    // ========================================
    // ICON BUTTONS
    // ========================================
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const label = this.textContent.trim();
            if (label === '🔔') {
                showToast('🔔 You have 3 new notifications');
            } else {
                showToast('🔹 Button clicked');
            }
        });
    });

    // ========================================
    // INITIALIZE
    // ========================================
    setTimeout(function() {
        animateCounters();
        animateLiveCharts();
        startLiveUpdates();
    }, 300);

    // ========================================
    // MUTATION OBSERVER - Watch for new doubt buttons
    // ========================================
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                const newButtons = document.querySelectorAll('.btn-sm:not([data-bound])');
                newButtons.forEach(function(btn) {
                    btn.dataset.bound = 'true';
                    btn.addEventListener('click', handleDoubtAction);
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // ========================================
    // EXPOSE TO GLOBAL
    // ========================================
    window.facultyPanel = {
        switchSection: switchSection,
        animateLiveCharts: animateLiveCharts,
        animateCounters: animateCounters,
        bindDoubtButtons: bindDoubtButtons,
        showToast: showToast
    };

    // ============================================
// FACULTY EXPORT FUNCTIONS
// ============================================

function exportFacultyReport() {
    showToast('👨‍🏫 Generating faculty report...');

    const data = {
        faculty: 'Dr. Sharma',
        department: 'Physics',
        date: new Date().toLocaleString(),
        stats: {
            students: 48,
            doubtsResolved: 124,
            avgResponseTime: '4.2 hours',
            testsCreated: 18,
            studentImprovement: '15%',
            slaCompliance: '92%',
            rating: '4.7/5'
        },
        batches: [
            { name: 'Alpha', performance: '85%' },
            { name: 'Beta', performance: '68%' },
            { name: 'Gamma', performance: '52%' }
        ],
        effectiveness: [
            'Student Satisfaction: 4.7/5',
            'Doubt Resolution Rate: 96%',
            'Test Completion Rate: 88%',
            'Student Improvement: +15%'
        ]
    };

    let csv = 'EduTech - Faculty Performance Report\n';
    csv += '====================================\n\n';
    csv += `Faculty: ${data.faculty}\n`;
    csv += `Department: ${data.department}\n`;
    csv += `Generated: ${data.date}\n\n`;
    csv += '--- Performance Metrics ---\n';
    csv += `Students: ${data.stats.students}\n`;
    csv += `Doubts Resolved: ${data.stats.doubtsResolved}\n`;
    csv += `Avg Response Time: ${data.stats.avgResponseTime}\n`;
    csv += `Tests Created: ${data.stats.testsCreated}\n`;
    csv += `Student Improvement: ${data.stats.studentImprovement}\n`;
    csv += `SLA Compliance: ${data.stats.slaCompliance}%\n`;
    csv += `Rating: ${data.stats.rating}\n\n`;
    csv += '--- Batch Performance ---\n';
    data.batches.forEach(b => {
        csv += `${b.name}: ${b.performance}\n`;
    });
    csv += '\n--- Teacher Effectiveness ---\n';
    data.effectiveness.forEach(e => {
        csv += `${e}\n`;
    });
    csv += '\n--- Powered by EduTech ---';

    downloadCSV(csv, `Faculty_Report_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('✅ Faculty report downloaded!');
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

window.exportFacultyReport = exportFacultyReport;
window.downloadCSV = downloadCSV;

    console.log('👨‍🏫 Faculty Panel loaded with LIVE charts!');
    console.log('📊 Charts update every 5 seconds with simulated data');
})();