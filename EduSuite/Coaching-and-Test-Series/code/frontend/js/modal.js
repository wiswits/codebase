// ========================================
// MODAL SYSTEM - COMPLETE WORKING VERSION
// ========================================

(function() {
    'use strict';

    let activeModal = null;

    // ========================================
    // CREATE MODAL
    // ========================================
    function createModal(title, contentHTML) {
        // Close any existing modal
        closeModal();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'active-modal';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 100000;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            padding: 20px;
        `;

        // Create container
        const container = document.createElement('div');
        container.className = 'modal-container';
        container.style.cssText = `
            background: var(--bg-secondary, #11111A);
            border: 1px solid var(--border-color, rgba(255,255,255,0.06));
            border-radius: 20px;
            max-width: 720px;
            width: 100%;
            max-height: 90vh;
            overflow: hidden;
            transform: scale(0.95) translateY(20px);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
        `;

        // Create header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 28px;
            border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));
            background: var(--bg-secondary, #11111A);
            flex-shrink: 0;
        `;
        header.innerHTML = `
            <h2 style="font-size: 1.2rem; font-weight: 700; margin: 0; letter-spacing: -0.02em; color: var(--text-primary, #FFFFFF);">${title}</h2>
            <button class="modal-close-btn" style="
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 1px solid var(--border-color, rgba(255,255,255,0.06));
                background: var(--bg-hover, rgba(255,255,255,0.04));
                color: var(--text-muted, rgba(255,255,255,0.5));
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
            ">✕</button>
        `;

        // Create body
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.style.cssText = `
            padding: 28px;
            overflow-y: auto;
            max-height: calc(90vh - 80px);
            background: var(--bg-primary, #0A0A0F);
            flex: 1;
        `;
        body.innerHTML = contentHTML;

        // Assemble
        container.appendChild(header);
        container.appendChild(body);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        activeModal = overlay;

        // ========================================
        // FIX 1: CLOSE BUTTON IN HEADER
        // ========================================
        const closeBtn = header.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                closeModal();
            });
        }

        // ========================================
        // FIX 2: CLICK OUTSIDE TO CLOSE
        // ========================================
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                console.log('Overlay clicked - closing');
                closeModal();
            }
        });

        // ========================================
        // FIX 3: ESC KEY TO CLOSE
        // ========================================
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                console.log('ESC pressed - closing');
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });

        // ========================================
        // FIX 4: PREVENT BODY SCROLL
        // ========================================
        document.body.style.overflow = 'hidden';

        // ========================================
        // FIX 5: BIND ALL BUTTONS INSIDE MODAL
        // ========================================
        bindAllButtons(body);

        // ========================================
        // SHOW MODAL WITH ANIMATION
        // ========================================
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
            container.style.transform = 'scale(1) translateY(0)';
        });

        console.log('Modal opened:', title);
        return overlay;
    }
// ============================================
// OMR MODAL FUNCTIONS
// ============================================

function openOMRDetails() {
    openModalFromFile('📄 OMR Sheet Details', 'omr-details-modal.html');
}

function openOMRUpload() {
    openModalFromFile('📄 Upload OMR Sheet', 'omr-upload-modal.html');
}

function openOMRResults(attemptId) {
    // Fetch OMR results from API
    fetch(`http://localhost:5000/api/omr/${attemptId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('edutech_token')}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Show results in modal
            const content = createOMRResultsContent(data.data);
            window.modalSystem.create('📄 OMR Results', content);
        } else {
            showToast('❌ Failed to load OMR results');
        }
    })
    .catch(error => {
        console.error('Error loading OMR:', error);
        showToast('❌ Failed to load OMR results');
    });
}

function createOMRResultsContent(data) {
    let answersHTML = '';
    const answers = data.evaluated_answers || {};
    
    Object.keys(answers).forEach((qId, index) => {
        const ans = answers[qId];
        const status = ans.correct ? '✅ Correct' : '❌ Incorrect';
        const color = ans.correct ? '#34D399' : '#EF4444';
        answersHTML += `
            <div class="list-item" style="padding: 6px 12px;">
                <div class="left"><span class="icon">Q${index + 1}</span><span class="name">${ans.selected || 'N/A'}</span></div>
                <div class="right"><span style="color: ${color};">${status}</span></div>
            </div>
        `;
    });

    return `
        <div style="margin-bottom: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📄 OMR Results</div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; padding: 16px; background: var(--bg-card, rgba(17,17,26,0.7)); border-radius: 12px; border: 1px solid var(--border-color, rgba(255,255,255,0.06));">
            <div>
                <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5));">Score</span>
                <p style="font-weight: 700; font-size: 1.2rem; margin: 2px 0 0 0;">${data.score_obtained || 0}</p>
            </div>
            <div>
                <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5));">Accuracy</span>
                <p style="font-weight: 700; font-size: 1.2rem; margin: 2px 0 0 0; color: #34D399;">${data.total_correct && data.total_incorrect ? Math.round((data.total_correct / (data.total_correct + data.total_incorrect)) * 100) : 0}%</p>
            </div>
            <div>
                <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5));">Correct</span>
                <p style="font-weight: 700; font-size: 1.2rem; margin: 2px 0 0 0; color: #34D399;">${data.total_correct || 0}</p>
            </div>
            <div>
                <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5));">Incorrect</span>
                <p style="font-weight: 700; font-size: 1.2rem; margin: 2px 0 0 0; color: #EF4444;">${data.total_incorrect || 0}</p>
            </div>
        </div>

        <div style="margin-bottom: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📝 Answer Key</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; max-height: 200px; overflow-y: auto;">
            ${answersHTML}
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
            <button class="action-btn" onclick="window.modalSystem.close()" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer;">Close</button>
        </div>
    `;
}

    // ========================================
    // BIND ALL BUTTONS - BULLETPROOF
    // ========================================
    function bindAllButtons(container) {
        // Find ALL buttons in the container
        const buttons = container.querySelectorAll('button');
        console.log('Found buttons:', buttons.length);
        
        buttons.forEach(function(button, index) {
            // Skip if already bound
            if (button.dataset.bound === 'true') return;
            button.dataset.bound = 'true';

            const buttonText = button.textContent.trim();
            console.log(`Button ${index}: "${buttonText}"`, button.id);

            // ========================================
            // CASE 1: Button has ID "close-modal-btn"
            // ========================================
            if (button.id === 'close-modal-btn') {
                console.log('Binding close-modal-btn');
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Close button clicked - closing');
                    closeModal();
                });
                return;
            }

            // ========================================
            // CASE 2: Button text is "Close" or "Cancel"
            // ========================================
            if (buttonText === 'Close' || buttonText === 'Cancel' || buttonText === '✕') {
                console.log(`Binding Close button: "${buttonText}"`);
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Close/Cancel clicked - closing');
                    closeModal();
                });
                return;
            }

            // ========================================
            // CASE 3: Button has onclick attribute
            // ========================================
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                console.log(`Binding onclick: ${onclickAttr}`);
                button.removeAttribute('onclick');
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        // Try to find the function in window
                        const match = onclickAttr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
                        if (match) {
                            const funcName = match[1];
                            if (typeof window[funcName] === 'function') {
                                const paramMatch = onclickAttr.match(/\((.*)\)/);
                                if (paramMatch) {
                                    const params = paramMatch[1].split(',').map(p => {
                                        p = p.trim();
                                        if (p === '') return undefined;
                                        if (p === 'true') return true;
                                        if (p === 'false') return false;
                                        if (p === 'null') return null;
                                        if (!isNaN(p) && p !== '') return Number(p);
                                        if (p.startsWith("'") && p.endsWith("'")) return p.slice(1, -1);
                                        if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);
                                        return window[p] || p;
                                    });
                                    window[funcName](...params);
                                } else {
                                    window[funcName]();
                                }
                            } else {
                                eval(onclickAttr);
                            }
                        } else {
                            eval(onclickAttr);
                        }
                    } catch (error) {
                        console.error('Error executing onclick:', error);
                    }
                });
                return;
            }

            // ========================================
            // CASE 4: Button has class "action-btn" (generic)
            // ========================================
            if (button.classList.contains('action-btn') && !button.classList.contains('secondary')) {
                console.log(`Binding action-btn: "${buttonText}"`);
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const text = this.textContent.trim();
                    closeModal();
                    showToast('🚀 ' + text + ' clicked!');
                });
                return;
            }

            // ========================================
            // CASE 5: Specific ID-based handlers
            // ========================================
            const id = button.id;
            if (id) {
                const actionMap = {
                    'start-test-btn': { action: 'Starting AITS 2026...', icon: '🚀' },
                    'view-history-btn': { action: 'Viewing test history...', icon: '📊' },
                    'perf-analytics-btn': { action: 'Opening detailed analytics...', icon: '📊' },
                    'perf-export-btn': { action: 'Exporting report...', icon: '📥' },
                    'error-revision-btn': { action: 'Starting revision deck...', icon: '📚' },
                    'error-dpp-btn': { action: 'Generating DPP...', icon: '🧩' },
                    'planner-test-btn': { action: 'Starting a test...', icon: '📝' },
                    'planner-resources-btn': { action: 'Opening resources...', icon: '📚' },
                    'analytics-charts-btn': { action: 'Viewing charts...', icon: '📊' },
                    'analytics-download-btn': { action: 'Downloading report...', icon: '📥' },
                    'start-aits-btn': { action: 'Starting AITS 2026...', icon: '🚀' },
                    'start-part-btn': { action: 'Starting Part Syllabus Test...', icon: '📝' },
                    'start-full-btn': { action: 'Starting Full Syllabus Test...', icon: '📚' },
                    'start-cancel-btn': { action: null, close: true },
                    'exam-test-btn': { action: 'Starting a new test...', icon: '📝' },
                    'coming-close-btn': { action: null, close: true },
                    'exam-close-btn': { action: null, close: true },
                    'perf-close-btn': { action: null, close: true },
                    'error-close-btn': { action: null, close: true },
                    'planner-close-btn': { action: null, close: true },
                    'analytics-close-btn': { action: null, close: true },
                    'starter-get-btn': { action: 'Getting started with Starter plan...', icon: '🚀' },
                    'starter-close-btn': { action: null, close: true },
                    'professional-trial-btn': { action: 'Starting Professional plan free trial...', icon: '🚀' },
                    'professional-close-btn': { action: null, close: true },
                    'enterprise-sales-btn': { action: 'Contacting enterprise sales...', icon: '📞' },
                    'enterprise-demo-btn': { action: 'Scheduling a demo...', icon: '📧' },
                    'enterprise-close-btn': { action: null, close: true }
                };

                const mapping = actionMap[id];
                if (mapping) {
                    console.log(`Binding ID: ${id} -> ${mapping.action || 'close'}`);
                    if (mapping.close) {
                        button.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`Closing modal from ${id}`);
                            closeModal();
                        });
                    } else if (mapping.action) {
                        button.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const msg = (mapping.icon || '') + ' ' + mapping.action;
                            closeModal();
                            showToast(msg);
                        });
                    }
                }
            }
        });
    }

    // ========================================
    // CLOSE MODAL
    // ========================================
    function closeModal() {
        if (activeModal) {
            console.log('Closing modal...');
            const container = activeModal.querySelector('.modal-container');
            activeModal.style.opacity = '0';
            activeModal.style.visibility = 'hidden';
            if (container) {
                container.style.transform = 'scale(0.95) translateY(20px)';
            }
            setTimeout(function() {
                if (activeModal && activeModal.parentNode) {
                    activeModal.parentNode.removeChild(activeModal);
                }
                activeModal = null;
                document.body.style.overflow = '';
                console.log('Modal closed');
            }, 400);
        }
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
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 12px 24px;
            background: #11111A;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
            backdrop-filter: blur(12px);
            color: #FFFFFF;
            font-size: 0.85rem;
            z-index: 999999;
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

        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'opacity 0.3s, transform 0.3s';
            setTimeout(function() { toast.remove(); }, 300);
        }, 2500);
    }

    // ========================================
    // OPEN TESTS MODAL
    // ========================================
    function openTestsModal() {
        const content = `
            <div style="margin-bottom: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📋 Available Tests</div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🏆</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">AITS 2026 - Physics</span></div>
                <div><span style="font-size: 0.6rem; padding: 2px 12px; border-radius: 9999px; font-weight: 600; background: rgba(251,191,36,0.12); color: #F59E0B;">Pending</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📝</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Part Syllabus - Chemistry</span></div>
                <div><span style="font-size: 0.6rem; padding: 2px 12px; border-radius: 9999px; font-weight: 600; background: rgba(251,191,36,0.12); color: #F59E0B;">Pending</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📚</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Full Syllabus - Mathematics</span></div>
                <div><span style="font-size: 0.6rem; padding: 2px 12px; border-radius: 9999px; font-weight: 600; background: rgba(251,191,36,0.12); color: #F59E0B;">Pending</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">✅</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Mock Test - Biology</span></div>
                <div><span style="font-size: 0.6rem; padding: 2px 12px; border-radius: 9999px; font-weight: 600; background: rgba(52,211,153,0.12); color: #34D399;">Completed</span></div>
            </div>

            <div style="margin-top: 24px; margin-bottom: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📊 Test Stats</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #34D399;">3</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Completed</span>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #F59E0B;">3</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Pending</span>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: var(--indigo-light, #818CF8);">6</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Total</span>
                </div>
            </div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px;">
                <button class="action-btn" id="start-test-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">🚀 Start AITS 2026</button>
                <button class="action-btn secondary" id="view-history-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">📊 View History</button>
                <button class="action-btn secondary" id="close-modal-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
            </div>
        `;
        createModal('📝 My Tests', content);
    }

    // ========================================
    // OPEN PERFORMANCE MODAL
    // ========================================
    function openPerformanceModal() {
        const content = `
            <div style="margin-bottom: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📈 Performance Overview</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #818CF8;">42</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Completed Tests</span>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #34D399;">73.4%</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Average Score</span>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #F59E0B;">82%</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Accuracy</span>
                </div>
            </div>

            <div style="margin-bottom: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📊 Subject-wise Breakdown</div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🔬</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Physics</span></div>
                <div><span style="color: #818CF8; font-weight: 600;">78%</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🧪</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Chemistry</span></div>
                <div><span style="color: #34D399; font-weight: 600;">65%</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📐</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Mathematics</span></div>
                <div><span style="color: #F59E0B; font-weight: 600;">92%</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🧬</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Biology</span></div>
                <div><span style="color: #8B5CF6; font-weight: 600;">71%</span></div>
            </div>

            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.06)); display: flex; flex-wrap: wrap; gap: 12px;">
                <span style="font-size: 0.75rem; color: var(--text-muted, rgba(255,255,255,0.5));">🏆 Best: <strong style="color: var(--text-secondary, rgba(255,255,255,0.85));">Mathematics (92%)</strong></span>
                <span style="font-size: 0.75rem; color: var(--text-muted, rgba(255,255,255,0.5));">📉 Needs improvement: <strong style="color: #EF4444;">Chemistry (65%)</strong></span>
            </div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="action-btn" id="perf-analytics-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">View Detailed Analytics</button>
                <button class="action-btn secondary" id="perf-export-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Export Report</button>
                <button class="action-btn secondary" id="perf-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
            </div>
        `;
        createModal('📈 Performance Overview', content);
    }

    // ========================================
    // OPEN ERROR BOOK MODAL
    // ========================================
    function openErrorBookModal() {
        const content = `
            <div style="margin-bottom: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📕 Error Book</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #EF4444;">12</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Total Errors</span>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #34D399;">4</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Mastered</span>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #F59E0B;">8</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">In Progress</span>
                </div>
            </div>

            <div style="margin-bottom: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📋 Error List</div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🔬</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Newton's Laws</span></div>
                <div><span style="font-size: 0.6rem; padding: 2px 12px; border-radius: 9999px; font-weight: 600; background: rgba(251,191,36,0.12); color: #F59E0B;">In Progress</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🧪</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Thermodynamics</span></div>
                <div><span style="font-size: 0.6rem; padding: 2px 12px; border-radius: 9999px; font-weight: 600; background: rgba(52,211,153,0.12); color: #34D399;">Mastered ✅</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🧬</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Organic Chemistry</span></div>
                <div><span style="font-size: 0.6rem; padding: 2px 12px; border-radius: 9999px; font-weight: 600; background: rgba(251,191,36,0.12); color: #F59E0B;">In Progress</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📐</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Calculus</span></div>
                <div><span style="font-size: 0.6rem; padding: 2px 12px; border-radius: 9999px; font-weight: 600; background: rgba(239,68,68,0.12); color: #EF4444;">Review</span></div>
            </div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="action-btn" id="error-revision-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">📚 Start Revision Deck</button>
                <button class="action-btn secondary" id="error-dpp-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">🧩 Generate DPP</button>
                <button class="action-btn secondary" id="error-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
            </div>
        `;
        createModal('📕 Error Book', content);
    }

    // ========================================
    // OPEN PLANNER MODAL
    // ========================================
    function openPlannerModal() {
        const content = `
            <div style="margin-bottom: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📋 Study Planner</div>
            <div style="text-align: center; padding: 32px 0;">
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;">📋</span>
                <h4 style="font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; color: var(--text-primary, #FFFFFF);">Complete a scored test to see your subject breakdown</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 0;">Your personalized study plan will be generated based on your test performance.</p>
            </div>
            <div style="margin-top: 16px; padding: 16px; background: var(--bg-card, rgba(17,17,26,0.7)); border-radius: 12px; border: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <span style="font-size: 1.4rem;">🧠</span>
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary, #FFFFFF);">Smart Recommendation</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted, rgba(255,255,255,0.5));">Focus on <strong style="color: #EF4444;">Chemistry</strong> — it's your weakest subject. Start with Organic Chemistry.</div>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="action-btn" id="planner-test-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">📝 Take a Test</button>
                <button class="action-btn secondary" id="planner-resources-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">📚 View Resources</button>
                <button class="action-btn secondary" id="planner-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
            </div>
        `;
        createModal('📋 Study Planner', content);
    }

    // ========================================
    // OPEN ANALYTICS MODAL
    // ========================================
    function openAnalyticsModal() {
        const content = `
            <div style="margin-bottom: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📊 Full Analytics</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #818CF8;">42</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Tests Taken</span>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #34D399;">76.5%</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Overall Avg</span>
                </div>
                <div style="text-align: center; padding: 12px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius: 12px;">
                    <span style="display: block; font-size: 1.4rem; font-weight: 800; color: #F59E0B;">82%</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted, rgba(255,255,255,0.5)); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em;">Accuracy</span>
                </div>
            </div>

            <div style="margin-bottom: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📊 Subject-wise Performance</div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🔬</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Physics</span></div>
                <div><span style="color: #818CF8; font-weight: 600;">78%</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🧪</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Chemistry</span></div>
                <div><span style="color: #34D399; font-weight: 600;">65%</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📐</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Mathematics</span></div>
                <div><span style="color: #F59E0B; font-weight: 600;">92%</span></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🧬</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Biology</span></div>
                <div><span style="color: #8B5CF6; font-weight: 600;">71%</span></div>
            </div>

            <div style="margin-top: 16px; padding: 16px; background: var(--bg-card, rgba(17,17,26,0.7)); border-radius: 12px; border: 1px solid var(--border-color, rgba(255,255,255,0.06)); text-align: center;">
                <span style="font-size: 0.85rem; color: var(--text-secondary, rgba(255,255,255,0.85));">📈 Your performance is improving! <strong style="color: #34D399;">+4.2%</strong> this month</span>
            </div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="action-btn" id="analytics-charts-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">📊 View Charts</button>
                <button class="action-btn secondary" id="analytics-download-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">📥 Download Report</button>
                <button class="action-btn secondary" id="analytics-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
            </div>
        `;
        createModal('📊 Full Analytics', content);
    }

    // ========================================
    // OPEN START TEST MODAL
    // ========================================
    function openStartTestModal() {
        const content = `
            <div style="text-align: center; padding: 32px 0;">
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;">📝</span>
                <h4 style="font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; color: var(--text-primary, #FFFFFF);">Ready to take a test?</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 0;">Choose a test from your available test series.</p>
                <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button class="action-btn" id="start-aits-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">🏆 AITS 2026</button>
                    <button class="action-btn" id="start-part-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">📝 Part Syllabus</button>
                    <button class="action-btn" id="start-full-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">📚 Full Syllabus</button>
                    <button class="action-btn secondary" id="start-cancel-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;
        createModal('📝 Start Test', content);
    }

    // ========================================
    // OPEN PRICING MODAL
    // ========================================
    function openPricingModal(plan) {
        const plans = {
            starter: {
                title: '🚀 Starter Plan',
                content: `
                    <div style="text-align: center; margin-bottom: 16px;">
                        <span style="font-size: 2.4rem; font-weight: 800; color: #818CF8;">₹9,999</span>
                        <span style="font-size: 0.9rem; color: var(--text-muted, rgba(255,255,255,0.5));">/month</span>
                        <p style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 4px 0 0 0;">For small coaching centers</p>
                    </div>
                    <div style="margin-bottom: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📋 What's Included</div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">👥</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Up to 100 students</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📚</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Batch Management (2 batches)</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📝</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Online tests only</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📊</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Basic analytics</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📕</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Error book</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📧</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Email support</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                        <button class="action-btn" id="starter-get-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">Get Started</button>
                        <button class="action-btn secondary" id="starter-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
                    </div>
                `
            },
            professional: {
                title: '🔥 Professional Plan',
                content: `
                    <div style="text-align: center; margin-bottom: 16px;">
                        <span style="font-size: 2.4rem; font-weight: 800; background: linear-gradient(135deg, #4F46E5, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">₹19,999</span>
                        <span style="font-size: 0.9rem; color: var(--text-muted, rgba(255,255,255,0.5));">/month</span>
                        <p style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 4px 0 0 0;">For growing institutes</p>
                        <span style="display: inline-block; margin-top: 8px; font-size: 0.6rem; padding: 2px 14px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); border-radius: 9999px; color: #FFFFFF; font-weight: 600;">⭐ Most Popular</span>
                    </div>
                    <div style="margin-bottom: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📋 Everything in Starter, plus:</div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">👥</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Up to 500 students</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🔄</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Alpha/Beta/Gamma + Auto-promote</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📄</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Online + OMR tests</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🤖</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Advanced analytics + AI</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📕</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Error book + DPP</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📚</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">PYQ Bank (JEE/NEET/NTSE)</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">💬</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Doubt desk with SLA</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">👨‍🏫</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Faculty panel</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">⭐</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Priority support</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                        <button class="action-btn" id="professional-trial-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">Start Free Trial</button>
                        <button class="action-btn secondary" id="professional-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
                    </div>
                `
            },
            enterprise: {
                title: '🏢 Enterprise Plan',
                content: `
                    <div style="text-align: center; margin-bottom: 16px;">
                        <span style="font-size: 2.4rem; font-weight: 800; color: #F59E0B;">Custom</span>
                        <span style="font-size: 0.9rem; color: var(--text-muted, rgba(255,255,255,0.5));">/month</span>
                        <p style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 4px 0 0 0;">For large coaching chains</p>
                    </div>
                    <div style="margin-bottom: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📋 Everything in Professional, plus:</div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🌐</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Unlimited students</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">⚙️</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">All features + custom</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📚</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">All exam types supported</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">👤</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Dedicated account manager</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🔌</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">Custom integrations</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">📋</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">SLA guarantee</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🕐</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">24/7 priority support</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));">
                        <div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 1.2rem;">🏢</span><span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, rgba(255,255,255,0.85));">On-premise option</span></div>
                        <div><span style="color: #34D399;">✓</span></div>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                        <button class="action-btn" id="enterprise-sales-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">Contact Sales</button>
                        <button class="action-btn secondary" id="enterprise-demo-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Schedule Demo</button>
                        <button class="action-btn secondary" id="enterprise-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
                    </div>
                `
            }
        };

        const selectedPlan = plans[plan];
        if (selectedPlan) {
            createModal(selectedPlan.title, selectedPlan.content);
        }
    }

    // ========================================
    // OPEN COMING UP MODAL
    // ========================================
    function openComingUpModal() {
        const content = `
            <div style="margin-bottom: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">📅 Upcoming Schedule</div>
            <div style="text-align: center; padding: 32px 0;">
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;">📭</span>
                <h4 style="font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; color: var(--text-primary, #FFFFFF);">No upcoming tests or tasks yet</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 0;">Your schedule will appear here once tests are assigned to your batch.</p>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="action-btn secondary" id="coming-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
            </div>
        `;
        createModal('📅 Coming Up', content);
    }

    // ========================================
    // OPEN EXAM READINESS MODAL
    // ========================================
    function openExamReadinessModal() {
        const content = `
            <div style="margin-bottom: 16px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted, rgba(255,255,255,0.5));">🎯 Exam Readiness</div>
            <div style="text-align: center; padding: 32px 0;">
                <span style="font-size: 3rem; display: block; margin-bottom: 12px;">📊</span>
                <h4 style="font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; color: var(--text-primary, #FFFFFF);">Add a completed test to calculate readiness</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 0;">Your exam readiness score will appear here once you complete your first test.</p>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
                <button class="action-btn" id="exam-test-btn" style="padding: 8px 24px; border-radius: 9999px; background: linear-gradient(135deg, #4F46E5, #8B5CF6); color: #FFFFFF; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; box-shadow: 0 2px 16px rgba(79,70,229,0.25);">📝 Take a Test</button>
                <button class="action-btn secondary" id="exam-close-btn" style="padding: 8px 24px; border-radius: 9999px; background: var(--bg-card, rgba(17,17,26,0.7)); border: 1px solid var(--border-color, rgba(255,255,255,0.06)); color: var(--text-secondary, rgba(255,255,255,0.85)); font-weight: 600; font-size: 0.8rem; cursor: pointer;">Close</button>
            </div>
        `;
        createModal('🎯 Exam Readiness', content);
    }

    // ========================================
    // OPEN MODAL FROM FILE
    // ========================================
    async function openModalFromFile(title, fileName) {
        try {
            const response = await fetch(`modals/${fileName}`);
            if (!response.ok) throw new Error(`Failed to load ${fileName}`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.body.innerHTML;
            createModal(title, content);
        } catch (error) {
            console.error('Modal load error:', error);
            createModal(title, `<div style="text-align:center;padding:40px;"><span style="font-size:3rem;">⚠️</span><h4>Failed to load content</h4><p>Please try again later.</p><button class="action-btn secondary" onclick="window.modalSystem.close()">Close</button></div>`);
        }
    }

    function openCreateTestModal() {
    openModalFromFile('📝 Create New Test', 'create-test-modal.html');
}

function openQuestionBankModal() {
    openModalFromFile('📚 Question Bank', 'question-bank-modal.html');
}

function openExamReadinessFullModal() {
    openModalFromFile('🎯 Exam Readiness', 'exam-readiness-full-modal.html');
}

function openErrorBookFullModal() {
    openModalFromFile('📕 Error Book - Full View', 'error-book-full-modal.html');
}

function openBatchManagementModal() {
    openModalFromFile('👥 Batch Management', 'batch-management-modal.html');
}

function openDPPGenerateModal() {
    openModalFromFile('🧩 Generate DPP', 'dpp-generate-modal.html');
}

// ============================================
// EXPORT FUNCTIONS - Complete
// ============================================

// ============================================
// 1. EXPORT PERFORMANCE REPORT
// ============================================
function exportReport() {
    showToast('📊 Generating performance report...');

    const data = {
        student: 'Anil Kumar',
        batch: 'Alpha Batch',
        date: new Date().toLocaleString(),
        stats: {
            completed: 42,
            average: '73.4%',
            accuracy: '82%',
            pending: 3,
            review: 8,
            tasks: 0
        },
        subjects: [
            { name: 'Physics', score: '78%' },
            { name: 'Chemistry', score: '65%' },
            { name: 'Mathematics', score: '92%' },
            { name: 'Biology', score: '71%' }
        ],
        best: 'Mathematics (92%)',
        needsImprovement: 'Chemistry (65%)',
        recommendations: [
            'Focus on Chemistry - it is your weakest subject.',
            'Review your mistakes in the Error Book.',
            'Complete pending tests to improve your rank.',
            'Practice daily DPP to maintain consistency.'
        ]
    };

    let csv = 'EduTech - Performance Report\n';
    csv += '============================\n\n';
    csv += `Student: ${data.student}\n`;
    csv += `Batch: ${data.batch}\n`;
    csv += `Generated: ${data.date}\n\n`;
    csv += '--- Performance Summary ---\n';
    csv += `Completed Tests: ${data.stats.completed}\n`;
    csv += `Average Score: ${data.stats.average}\n`;
    csv += `Accuracy: ${data.stats.accuracy}\n`;
    csv += `Pending Tests: ${data.stats.pending}\n`;
    csv += `Mistakes to Review: ${data.stats.review}\n`;
    csv += `Study Tasks: ${data.stats.tasks}\n\n`;
    csv += '--- Subject-wise Performance ---\n';
    data.subjects.forEach(s => {
        csv += `${s.name}: ${s.score}\n`;
    });
    csv += `\n🏆 Best Subject: ${data.best}\n`;
    csv += `📉 Needs Improvement: ${data.needsImprovement}\n\n`;
    csv += '--- Recommendations ---\n';
    data.recommendations.forEach((r, i) => {
        csv += `${i + 1}. ${r}\n`;
    });
    csv += '\n--- Powered by EduTech ---';

    downloadCSV(csv, `Performance_Report_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('✅ Performance report downloaded!');
}

// ============================================
// 2. EXPORT ANALYTICS REPORT
// ============================================
function exportAnalytics() {
    showToast('📊 Generating analytics report...');

    const data = {
        student: 'Anil Kumar',
        batch: 'Alpha Batch',
        date: new Date().toLocaleString(),
        tests: [
            { name: 'AITS 2026 - Physics', score: 28, total: 40, accuracy: '70%' },
            { name: 'Part Syllabus - Chemistry', score: 22, total: 30, accuracy: '73%' },
            { name: 'Full Syllabus - PCM', score: 45, total: 60, accuracy: '75%' },
            { name: 'Mock Test - Biology', score: 32, total: 40, accuracy: '80%' }
        ],
        subjects: [
            { name: 'Physics', score: '78%', accuracy: '85%' },
            { name: 'Chemistry', score: '65%', accuracy: '68%' },
            { name: 'Mathematics', score: '92%', accuracy: '92%' },
            { name: 'Biology', score: '71%', accuracy: '74%' }
        ],
        quadrant: 'FAST_ACCURATE',
        trends: [
            '↗️ Physics: +6% improvement',
            '↘️ Chemistry: -2% decline',
            '↗️ Maths: +8% improvement',
            '↗️ Biology: +3% improvement'
        ]
    };

    let csv = 'EduTech - Analytics Report\n';
    csv += '==========================\n\n';
    csv += `Student: ${data.student}\n`;
    csv += `Batch: ${data.batch}\n`;
    csv += `Generated: ${data.date}\n\n`;
    csv += '--- Test-wise Performance ---\n';
    data.tests.forEach(t => {
        csv += `${t.name}: ${t.score}/${t.total} (${t.accuracy})\n`;
    });
    csv += '\n--- Subject-wise Analysis ---\n';
    data.subjects.forEach(s => {
        csv += `${s.name}: Score ${s.score}, Accuracy ${s.accuracy}\n`;
    });
    csv += `\nSpeed-Accuracy Quadrant: ${data.quadrant}\n\n`;
    csv += '--- Performance Trends ---\n';
    data.trends.forEach(t => {
        csv += `${t}\n`;
    });
    csv += '\n--- Powered by EduTech ---';

    downloadCSV(csv, `Analytics_Report_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('✅ Analytics report downloaded!');
}

// ============================================
// 3. EXPORT ERROR BOOK
// ============================================
function exportErrorBook() {
    showToast('📕 Generating error book...');

    const data = {
        student: 'Anil Kumar',
        date: new Date().toLocaleString(),
        errors: [
            { subject: 'Physics', question: 'Newton\'s Laws', status: 'In Progress' },
            { subject: 'Chemistry', question: 'Thermodynamics', status: 'Mastered ✅' },
            { subject: 'Mathematics', question: 'Calculus', status: 'In Progress' },
            { subject: 'Biology', question: 'Cell Biology', status: 'Review' },
            { subject: 'Physics', question: 'Optics', status: 'Mastered ✅' }
        ],
        stats: {
            total: 12,
            mastered: 4,
            inProgress: 8
        }
    };

    let csv = 'EduTech - Error Book\n';
    csv += '====================\n\n';
    csv += `Student: ${data.student}\n`;
    csv += `Generated: ${data.date}\n\n`;
    csv += '--- Summary ---\n';
    csv += `Total Errors: ${data.stats.total}\n`;
    csv += `Mastered: ${data.stats.mastered}\n`;
    csv += `In Progress: ${data.stats.inProgress}\n\n`;
    csv += '--- Error List ---\n';
    data.errors.forEach(e => {
        csv += `${e.subject}: ${e.question} (${e.status})\n`;
    });
    csv += '\n--- Powered by EduTech ---';

    downloadCSV(csv, `Error_Book_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('✅ Error book downloaded!');
}

// ============================================
// 4. EXPORT FACULTY REPORT
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

// ============================================
// 5. EXPORT TEST SCHEDULE
// ============================================
function exportTestSchedule() {
    showToast('📝 Generating test schedule...');

    const data = {
        date: new Date().toLocaleString(),
        tests: [
            { name: 'AITS 2026 - Physics', type: 'AITS', date: 'Jul 20, 2026', time: '10:00 AM', duration: '3h', marks: 180 },
            { name: 'Part Syllabus - Chemistry', type: 'Part Syllabus', date: 'Jul 22, 2026', time: '2:00 PM', duration: '2h', marks: 120 },
            { name: 'Full Syllabus - PCM', type: 'Full Syllabus', date: 'Jul 25, 2026', time: '9:00 AM', duration: '3h', marks: 300 },
            { name: 'Mock Test - Biology', type: 'Mock', date: 'Jul 28, 2026', time: '10:00 AM', duration: '3h', marks: 720 }
        ]
    };

    let csv = 'EduTech - Test Schedule\n';
    csv += '======================\n\n';
    csv += `Generated: ${data.date}\n\n`;
    csv += '--- Upcoming Tests ---\n';
    data.tests.forEach(t => {
        csv += `${t.name} (${t.type})\n`;
        csv += `  📅 ${t.date}  ⏰ ${t.time}  ⏱️ ${t.duration}  📊 ${t.marks} marks\n\n`;
    });
    csv += '--- Powered by EduTech ---';

    downloadCSV(csv, `Test_Schedule_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('✅ Test schedule downloaded!');
}

// ============================================
// 6. EXPORT PYQ LIST
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

// ============================================
// HELPER: DOWNLOAD CSV
// ============================================
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

// ============================================
// EXPOSE TO GLOBAL
// ============================================
window.exportReport = exportReport;
window.exportAnalytics = exportAnalytics;
window.exportErrorBook = exportErrorBook;
window.exportFacultyReport = exportFacultyReport;
window.exportTestSchedule = exportTestSchedule;
window.exportPYQList = exportPYQList;
window.downloadCSV = downloadCSV;

// Update the modalSystem export
window.modalSystem = {
    create: createModal,
    close: closeModal,
    openFromFile: openModalFromFile,
    openTests: openTestsModal,
    openPerformance: openPerformanceModal,
    openErrorBook: openErrorBookModal,
    openPlanner: openPlannerModal,
    openAnalytics: openAnalyticsModal,
    openComingUp: openComingUpModal,
    openExamReadiness: openExamReadinessModal,
    openStartTest: openStartTestModal,
    openPricingModal: openPricingModal,
    openCreateTest: openCreateTestModal,
    openQuestionBank: openQuestionBankModal,
    openExamReadinessFull: openExamReadinessFullModal,
    openErrorBookFull: openErrorBookFullModal,
    openBatchManagement: openBatchManagementModal,
    openDPPGenerate: openDPPGenerateModal,
    openOMRDetails: openOMRDetails,
    openOMRUpload: openOMRUpload,
    openOMRResults: openOMRResults,
    createOMRResultsContent: createOMRResultsContent
};
    // ========================================
    // EXPOSE TO GLOBAL
    // ========================================
    window.modalSystem = {
        create: createModal,
        close: closeModal,
        openFromFile: openModalFromFile,
        openPerformance: openPerformanceModal,
        openExamReadiness: openExamReadinessModal,
        openComingUp: openComingUpModal,
        openAnalytics: openAnalyticsModal,
        openPlanner: openPlannerModal,
        openErrorBook: openErrorBookModal,
        openTests: openTestsModal,
        openStartTest: openStartTestModal,
        openPricingModal: openPricingModal
    };

    window.showToast = showToast;

    console.log('📱 Modal System loaded successfully');
    console.log('📋 All modals are fully functional with working close buttons');
    console.log('✅ Use modalSystem.openTests() to test');
})();