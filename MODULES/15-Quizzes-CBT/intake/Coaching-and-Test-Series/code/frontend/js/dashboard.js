// ============================================
// DASHBOARD - COMPLETE WITH REAL DATA
// ============================================

(function() {
    'use strict';

    // ============================================
    // STATE
    // ============================================
    let studentId = null;
    let studentData = null;

    // ============================================
    // FETCH DASHBOARD DATA
    // ============================================
    async function fetchDashboardData() {
        try {
            console.log('📊 Fetching dashboard data...');

            // Get student profile
            const profile = await api.students.getProfile();
            if (!profile.success) {
                console.error('Failed to get profile:', profile.message);
                showToast('⚠️ Please login first');
                return;
            }

            studentId = profile.data.id;
            studentData = profile.data;

            // Update header
            const subtitle = document.querySelector('.workspace-header-left .subtitle');
            if (subtitle) {
                subtitle.textContent = `${profile.data.first_name || 'Student'} ${profile.data.last_name || ''} · ${profile.data.batch_name || 'Alpha Batch'}`;
            }

            // Get analytics
            const analytics = await api.analytics.getStudentAnalytics(studentId);
            if (analytics.success) {
                updateStats(analytics.data);
                updateSubjectBars(analytics.data.subjectPerformance);
                updateRankCard(analytics.data.currentRank);
            }

            // Get error book
            const errorBook = await api.errorBook.getStudentErrors(studentId);
            if (errorBook.success) {
                updateErrorBook(errorBook.data);
            }

            // Get DPP streak
            const streak = await api.dpp.getStreak(studentId);
            if (streak.success) {
                updateDPPStreak(streak.data);
            }

            console.log('✅ Dashboard data loaded successfully');
        } catch (error) {
            console.error('Error loading dashboard:', error);
            showToast('⚠️ Failed to load dashboard data');
        }
    }

    // ============================================
    // UPDATE STATS
    // ============================================
    function updateStats(data) {
        const stats = data.stats || {};
        const statValues = document.querySelectorAll('.stat-card-mini .value');
        
        if (statValues.length >= 6) {
            // Completed tests
            const attempts = data.attempts || [];
            const completed = attempts.filter(a => a.status === 'submitted').length;
            statValues[0].dataset.count = completed;
            statValues[0].textContent = '0';

            // Average score
            const avgScore = stats.avg_score || 0;
            statValues[1].dataset.count = avgScore;
            statValues[1].textContent = '0%';

            // Accuracy
            const accuracy = stats.avg_accuracy || 0;
            statValues[2].dataset.count = accuracy;
            statValues[2].textContent = '0%';

            // Pending (tests not attempted yet)
            // This would come from tests assigned to student
            statValues[3].dataset.count = 3; // Placeholder
            statValues[3].textContent = '0';

            // To review (error book count)
            const errors = data.errorBookStats?.in_progress || 0;
            statValues[4].dataset.count = errors;
            statValues[4].textContent = '0';

            // Study tasks (DPP pending)
            statValues[5].dataset.count = 0;
            statValues[5].textContent = '0';

            // Re-animate counters
            setTimeout(animateCounters, 300);
        }
    }

    // ============================================
    // UPDATE SUBJECT BARS
    // ============================================
    function updateSubjectBars(subjectData) {
        if (!subjectData || subjectData.length === 0) {
            console.log('No subject data available');
            return;
        }

        const barItems = document.querySelectorAll('.subject-bar-item');
        const subjectMap = {};
        
        subjectData.forEach(s => {
            subjectMap[s.subject] = Math.round(s.avg_score || 0);
        });

        barItems.forEach(item => {
            const name = item.querySelector('.subject-name')?.textContent;
            const bar = item.querySelector('.bar-fill');
            const score = item.querySelector('.subject-score');
            
            if (name && bar && subjectMap[name] !== undefined) {
                const val = subjectMap[name];
                bar.style.width = val + '%';
                if (score) score.textContent = val + '%';
            }
        });
    }

    // ============================================
    // UPDATE RANK CARD
    // ============================================
    function updateRankCard(rank) {
        if (!rank) return;

        const rankBadge = document.querySelector('.rank-badge');
        if (rankBadge) {
            rankBadge.textContent = `AIR #${rank.all_india_rank || 'N/A'}`;
        }

        const rankItems = document.querySelectorAll('.rank-item strong');
        if (rankItems.length >= 3) {
            rankItems[0].textContent = rank.batch_rank ? `#${rank.batch_rank}` : 'N/A';
            rankItems[1].textContent = rank.all_india_percentile ? `${Math.round(rank.all_india_percentile)}%` : 'N/A';
        }

        // Update progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar && rank.all_india_percentile) {
            progressBar.style.width = Math.round(rank.all_india_percentile) + '%';
        }
    }

    // ============================================
    // UPDATE ERROR BOOK
    // ============================================
    function updateErrorBook(data) {
        const stats = data.stats || {};
        const errorNums = document.querySelectorAll('.error-num');
        
        if (errorNums.length >= 3) {
            errorNums[0].textContent = stats.total || 0;
            errorNums[1].textContent = stats.mastered || 0;
            errorNums[2].textContent = stats.in_progress || 0;
        }

        // Update error list
        const errorList = document.querySelector('.errorbook-list');
        if (errorList && data.errors) {
            errorList.innerHTML = '';
            data.errors.slice(0, 3).forEach(err => {
                const div = document.createElement('div');
                div.className = 'error-item';
                const status = err.is_mastered ? 'Mastered ✅' : 'In Progress';
                const statusClass = err.is_mastered ? 'mastered' : 'in-progress';
                div.innerHTML = `
                    <span>${err.subject || 'Unknown'}</span>
                    <span class="error-status ${statusClass}">${status}</span>
                `;
                errorList.appendChild(div);
            });
        }
    }

    // ============================================
    // UPDATE DPP STREAK
    // ============================================
    function updateDPPStreak(data) {
        const streakElement = document.querySelector('.streak-number');
        if (streakElement) {
            streakElement.textContent = `🔥 ${data.currentStreak || 0}`;
        }
    }

    // ============================================
    // ANIMATED COUNTERS
    // ============================================
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-card-mini .value');
        
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
                    counter.textContent = current.toFixed(1) + '%';
                } else {
                    counter.textContent = Math.floor(current).toLocaleString();
                }
                
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    if (target % 1 !== 0) {
                        counter.textContent = target.toFixed(1) + '%';
                    } else {
                        counter.textContent = target.toLocaleString();
                    }
                }
            }
            
            requestAnimationFrame(updateCounter);
        });
    }

    // ============================================
    // ANIMATE SUBJECT BARS
    // ============================================
    function animateBars() {
        const barFills = document.querySelectorAll('.bar-fill');
        
        barFills.forEach(function(bar, index) {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(function() {
                bar.style.width = width;
            }, 200 + (index * 100));
        });
    }

    // ============================================
    // TOAST NOTIFICATION
    // ============================================
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
            background: var(--bg-card-solid);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            backdrop-filter: blur(12px);
            color: var(--text-primary);
            font-size: 0.85rem;
            z-index: 9999;
            animation: slideUp 0.4s ease;
            box-shadow: 0 8px 32px var(--shadow-color);
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

    // ============================================
    // QUICK ACTION BUTTONS
    // ============================================
    function setupQuickActions() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const label = this.textContent.trim();
                
                const actionMap = {
                    'Take Test': () => window.modalSystem.openStartTest(),
                    'Error Book': () => window.modalSystem.openErrorBook(),
                    'DPP': () => window.modalSystem.openPlanner(),
                    'Ask Doubt': () => window.modalSystem.openComingUp(),
                    'PYQ Practice': () => window.location.href = 'pyq-bank.html',
                    'Analytics': () => window.modalSystem.openAnalytics()
                };

                const action = actionMap[label];
                if (action) action();
                else showToast('🔹 ' + label + ' clicked!');
            });
        });
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                window.modalSystem.openStartTest();
            }
            if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                window.modalSystem.openPerformance();
            }
            if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                window.modalSystem.openErrorBook();
            }
        });
    }

    // ============================================
    // INITIALIZE
    // ============================================
    function initDashboard() {
        console.log('📊 Initializing Dashboard...');

        // Check if user is authenticated
        if (!TokenManager.isAuthenticated()) {
            console.log('🔐 Not authenticated, showing demo data');
            // For demo, use student@edutech.com
            // In production, redirect to login
            showToast('🔐 Please login to see your real data');
            return;
        }

        // Fetch real data
        fetchDashboardData();

        // Setup interactions
        setupQuickActions();
        setupKeyboardShortcuts();

        // Animate existing bars
        setTimeout(animateBars, 500);

        console.log('✅ Dashboard initialized successfully');
        console.log('⌨️ Shortcuts: T=Test, P=Performance, E=Error Book');
    }

    // ============================================
    // RUN ON DOM READY
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }

    // ============================================
    // EXPOSE TO GLOBAL
    // ============================================
    window.dashboard = {
        fetchDashboardData,
        updateStats,
        updateSubjectBars,
        updateRankCard,
        showToast,
        animateCounters
    };

})();