// ============================================
// TEST SERIES - Complete with Real Data
// ============================================

// ============================================
// FETCH TESTS FROM API
// ============================================
async function fetchTests() {
    try {
        const response = await fetch('http://localhost:5000/api/tests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('edutech_token')}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            renderTests(data.data);
            updateStats(data.data);
        } else {
            console.log('No tests found, using demo data');
            // Use existing static data
        }
    } catch (error) {
        console.error('Error fetching tests:', error);
        // Use existing static data
    }
}

// ============================================
// RENDER TESTS
// ============================================
function renderTests(tests) {
    const container = document.querySelector('.test-list-full');
    if (!container) return;

    if (!tests || tests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon-big">📝</span>
                <h4>No tests available</h4>
                <p>Check back later for new tests.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tests.map(test => `
        <div class="test-card-full glass-card" data-type="${test.type}">
            <div class="test-info-full">
                <span class="test-badge ${test.type}">${test.type.toUpperCase()}</span>
                <div>
                    <span style="font-weight:500">${test.title}</span>
                    <span style="font-size:0.7rem;color:var(--white-muted);display:block;">${test.subjects?.join(' · ') || 'General'}</span>
                </div>
            </div>
            <div class="test-meta-full">
                <span>📅 ${test.scheduled_at ? new Date(test.scheduled_at).toLocaleDateString() : 'TBD'}</span>
                <span>⏱️ ${test.duration_minutes}m</span>
                <span>📊 ${test.total_marks || 0} marks</span>
                ${test.is_published ? `
                    <button class="btn-primary-sm" onclick="startTest(${test.id}, '${test.title}')">Start</button>
                ` : `
                    <span class="test-badge draft">Draft</span>
                `}
            </div>
        </div>
    `).join('');
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats(tests) {
    const typeCards = document.querySelectorAll('.test-type-card .count');
    if (typeCards.length >= 4) {
        const types = ['part', 'full', 'aits', 'mock'];
        const counts = types.map(type => tests.filter(t => t.type === type).length);
        typeCards.forEach((card, index) => {
            if (card) card.textContent = `${counts[index] || 0} available`;
        });
    }
}

// ============================================
// START TEST - COMPLETE FLOW
// ============================================
async function startTest(testId, testTitle) {
    try {
        // Check if user is authenticated
        if (!localStorage.getItem('edutech_token')) {
            showToast('⚠️ Please login first');
            window.location.href = 'login.html';
            return;
        }

        showToast('⏳ Starting test...');

        // 1. Get test details
        const testResponse = await fetch(`http://localhost:5000/api/tests/${testId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('edutech_token')}`
            }
        });
        const testData = await testResponse.json();

        if (!testData.success) {
            showToast('❌ Failed to load test');
            return;
        }

        const test = testData.data;

        // 2. Start attempt
        const attemptResponse = await fetch('http://localhost:5000/api/attempts/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('edutech_token')}`
            },
            body: JSON.stringify({ test_id: testId })
        });
        const attemptData = await attemptResponse.json();

        if (!attemptData.success) {
            showToast('❌ ' + (attemptData.message || 'Failed to start test'));
            return;
        }

        // 3. Open test window
        openTestWindow(attemptData.data);

    } catch (error) {
        console.error('Start test error:', error);
        showToast('❌ Failed to start test');
    }
}

// ============================================
// OPEN TEST WINDOW
// ============================================
function openTestWindow(data) {
    const { attempt, test, questions } = data;

    // Create test window modal
    const content = `
        <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0;">${test.title}</h3>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 0.85rem; color: var(--text-muted);">⏱️ <span id="timerDisplay">${test.duration_minutes}:00</span></span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">📊 ${test.total_questions} questions</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; max-height: 500px;">
                <!-- Questions -->
                <div style="overflow-y: auto; padding-right: 12px;">
                    ${questions.map((q, index) => `
                        <div class="question-card" style="padding: 16px; background: var(--bg-card); border-radius: 12px; margin-bottom: 12px; border: 1px solid var(--border-color);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="font-weight: 600;">Q${index + 1}. ${q.question_text}</span>
                                <span style="font-size: 0.7rem; color: var(--text-muted);">${q.marks || 4} marks</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                ${q.options ? Object.entries(q.options).map(([key, value]) => `
                                    <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-hover); border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                                        <input type="radio" name="q_${q.id}" value="${key}" onchange="saveAnswer(${attempt.id}, ${q.id}, this.value)">
                                        <span>${key}. ${value}</span>
                                    </label>
                                `).join('') : `
                                    <input type="text" placeholder="Enter your answer" class="nat-answer" data-qid="${q.id}" style="width: 100%; padding: 8px 12px; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Question Palette -->
                <div style="background: var(--bg-card); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color); height: fit-content;">
                    <p style="font-weight: 600; margin: 0 0 12px 0;">Question Palette</p>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
                        ${questions.map((q, index) => `
                            <div class="palette-btn" data-qid="${q.id}" style="width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s;">${index + 1}</div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.7rem; color: var(--text-muted);">
                        <span>🟢 Answered</span>
                        <span>🔴 Unanswered</span>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                <div>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">Attempt ID: ${attempt.id}</span>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn-ghost" onclick="window.modalSystem.close()" style="border: 1px solid var(--border-color); padding: 8px 20px; border-radius: 9999px;">Close</button>
                    <button class="btn-primary-sm" onclick="submitTest(${attempt.id})">Submit Test</button>
                </div>
            </div>
        </div>
    `;

    window.modalSystem.create('📝 Test Window', content);

    // Start timer
    let timeLeft = test.duration_minutes * 60;
    const timerDisplay = document.getElementById('timerDisplay');
    const timerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitTest(attempt.id);
        }
    }, 1000);

    window._currentAttemptId = attempt.id;
    window._timerInterval = timerInterval;
}

// ============================================
// SAVE ANSWER
// ============================================
async function saveAnswer(attemptId, questionId, answer) {
    try {
        await fetch('http://localhost:5000/api/attempts/save-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('edutech_token')}`
            },
            body: JSON.stringify({ attempt_id: attemptId, question_id: questionId, answer })
        });

        // Mark as answered in palette
        const paletteBtn = document.querySelector(`.palette-btn[data-qid="${questionId}"]`);
        if (paletteBtn) {
            paletteBtn.style.background = '#34D399';
            paletteBtn.style.color = '#fff';
        }
    } catch (error) {
        console.error('Save answer error:', error);
    }
}

// ============================================
// SUBMIT TEST
// ============================================
async function submitTest(attemptId) {
    try {
        // Stop timer
        if (window._timerInterval) {
            clearInterval(window._timerInterval);
        }

        showToast('⏳ Submitting test...');

        const response = await fetch('http://localhost:5000/api/attempts/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('edutech_token')}`
            },
            body: JSON.stringify({ attempt_id: attemptId })
        });

        const data = await response.json();

        if (data.success) {
            showToast('✅ Test submitted successfully!');
            window.modalSystem.close();
            // Redirect to analytics
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showToast('❌ ' + (data.message || 'Failed to submit test'));
        }
    } catch (error) {
        console.error('Submit test error:', error);
        showToast('❌ Failed to submit test');
    }
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
        border-radius: 12px;
        backdrop-filter: blur(12px);
        color: var(--text-primary);
        font-size: 0.85rem;
        z-index: 99999;
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

window.showToast = showToast;
window.startTest = startTest;
window.saveAnswer = saveAnswer;
window.submitTest = submitTest;
window.openTestWindow = openTestWindow;

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const firstType = document.querySelector('.test-type-card');
        if (firstType) firstType.click();
    }
});

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Test Series loaded');
    // Fetch tests from API
    fetchTests();
});

// ============================================
// TEST SERIES EXPORT
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

window.exportTestSchedule = exportTestSchedule;
window.downloadCSV = downloadCSV;

console.log('⌨️ Press F to filter tests');