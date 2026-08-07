// ============================================
// EDUTECH - API SERVICE (COMPLETE)
// ============================================

const API_URL = 'http://localhost:5000/api';

// ============================================
// AUTH TOKEN MANAGEMENT
// ============================================
class TokenManager {
    static getToken() {
        return localStorage.getItem('edutech_token');
    }

    static setToken(token) {
        localStorage.setItem('edutech_token', token);
    }

    static removeToken() {
        localStorage.removeItem('edutech_token');
    }

    static getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // ✅ ADD THIS METHOD - It was missing!
    static isAuthenticated() {
        return !!this.getToken();
    }

    static getUser() {
        try {
            const user = localStorage.getItem('edutech_user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    }

    static setUser(user) {
        localStorage.setItem('edutech_user', JSON.stringify(user));
    }

    static clear() {
        this.removeToken();
        localStorage.removeItem('edutech_user');
        localStorage.removeItem('edutech_remember');
    }
}

// ============================================
// API CALLS
// ============================================
const api = {

    // ============================================
    // AUTH
    // ============================================
    auth: {
        login: async (email, password) => {
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (data.success && data.data.token) {
                    TokenManager.setToken(data.data.token);
                    TokenManager.setUser(data.data.user);
                }
                return data;
            } catch (error) {
                console.error('Login error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        register: async (userData) => {
            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                const data = await response.json();
                if (data.success && data.data.token) {
                    TokenManager.setToken(data.data.token);
                    TokenManager.setUser(data.data.user);
                }
                return data;
            } catch (error) {
                console.error('Register error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        logout: () => {
            TokenManager.clear();
            window.location.href = 'login.html';
        },

        getMe: async () => {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get me error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        changePassword: async (currentPassword, newPassword) => {
            try {
                const response = await fetch(`${API_URL}/auth/change-password`, {
                    method: 'PUT',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                return await response.json();
            } catch (error) {
                console.error('Change password error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // STUDENTS
    // ============================================
    students: {
        getAll: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                const response = await fetch(`${API_URL}/students?${query}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get students error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getById: async (id) => {
            try {
                const response = await fetch(`${API_URL}/students/${id}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get student error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getProfile: async () => {
            try {
                const response = await fetch(`${API_URL}/students/profile/me`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get profile error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        update: async (id, data) => {
            try {
                const response = await fetch(`${API_URL}/students/${id}`, {
                    method: 'PUT',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Update student error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getAnalytics: async (id) => {
            try {
                const response = await fetch(`${API_URL}/students/${id}/analytics`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get analytics error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getAttempts: async (id, params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                const response = await fetch(`${API_URL}/students/${id}/attempts?${query}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get attempts error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // FACULTY
    // ============================================
    faculty: {
        getProfile: async () => {
            try {
                const response = await fetch(`${API_URL}/faculty/profile/me`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get faculty profile error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getDashboardStats: async () => {
            try {
                const response = await fetch(`${API_URL}/faculty/dashboard/stats`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get dashboard stats error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getStudents: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                const response = await fetch(`${API_URL}/faculty/students?${query}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get faculty students error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getBatches: async () => {
            try {
                const response = await fetch(`${API_URL}/faculty/batches`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get batches error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getPerformance: async () => {
            try {
                const response = await fetch(`${API_URL}/faculty/performance`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get performance error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // TESTS
    // ============================================
    tests: {
        getAll: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                const response = await fetch(`${API_URL}/tests?${query}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get tests error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getById: async (id) => {
            try {
                const response = await fetch(`${API_URL}/tests/${id}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get test error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        create: async (data) => {
            try {
                const response = await fetch(`${API_URL}/tests`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Create test error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        update: async (id, data) => {
            try {
                const response = await fetch(`${API_URL}/tests/${id}`, {
                    method: 'PUT',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Update test error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        publish: async (id) => {
            try {
                const response = await fetch(`${API_URL}/tests/${id}/publish`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Publish test error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // ATTEMPTS
    // ============================================
    attempts: {
        start: async (testId) => {
            try {
                const response = await fetch(`${API_URL}/attempts/start`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ test_id: testId })
                });
                return await response.json();
            } catch (error) {
                console.error('Start attempt error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        saveAnswer: async (attemptId, questionId, answer) => {
            try {
                const response = await fetch(`${API_URL}/attempts/save-answer`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ attempt_id: attemptId, question_id: questionId, answer })
                });
                return await response.json();
            } catch (error) {
                console.error('Save answer error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        submit: async (attemptId) => {
            try {
                const response = await fetch(`${API_URL}/attempts/submit`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ attempt_id: attemptId })
                });
                return await response.json();
            } catch (error) {
                console.error('Submit attempt error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getById: async (id) => {
            try {
                const response = await fetch(`${API_URL}/attempts/${id}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get attempt error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // ANALYTICS
    // ============================================
    analytics: {
        getStudentAnalytics: async (studentId, params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                const response = await fetch(`${API_URL}/analytics/student/${studentId}?${query}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get student analytics error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getRankCard: async (attemptId) => {
            try {
                const response = await fetch(`${API_URL}/analytics/rank-card/${attemptId}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get rank card error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getQuadrant: async (studentId) => {
            try {
                const response = await fetch(`${API_URL}/analytics/quadrant/${studentId}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get quadrant error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getBatchPerformance: async (batchId) => {
            try {
                const response = await fetch(`${API_URL}/analytics/batch/${batchId}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get batch performance error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // ERROR BOOK
    // ============================================
    errorBook: {
        getStudentErrors: async (studentId, params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                const response = await fetch(`${API_URL}/errorbook/student/${studentId}?${query}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get error book error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        remove: async (id) => {
            try {
                const response = await fetch(`${API_URL}/errorbook/${id}`, {
                    method: 'DELETE',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Remove error book entry error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        markMastered: async (id) => {
            try {
                const response = await fetch(`${API_URL}/errorbook/${id}/master`, {
                    method: 'PUT',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Mark mastered error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getStats: async (studentId) => {
            try {
                const response = await fetch(`${API_URL}/errorbook/stats/${studentId}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get error book stats error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // DPP
    // ============================================
    dpp: {
        generate: async (studentId, count = 12, difficulty = 'mixed') => {
            try {
                const response = await fetch(`${API_URL}/dpps/generate`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ studentId, count, difficulty })
                });
                return await response.json();
            } catch (error) {
                console.error('Generate DPP error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getToday: async (studentId) => {
            try {
                const response = await fetch(`${API_URL}/dpps/today/${studentId}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get today DPP error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        submit: async (dppId, answers) => {
            try {
                const response = await fetch(`${API_URL}/dpps/submit`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ dpp_id: dppId, answers })
                });
                return await response.json();
            } catch (error) {
                console.error('Submit DPP error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getStreak: async (studentId) => {
            try {
                const response = await fetch(`${API_URL}/dpps/streak/${studentId}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get DPP streak error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // DOUBTS
    // ============================================
    doubts: {
        create: async (data) => {
            try {
                const response = await fetch(`${API_URL}/doubts`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Create doubt error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getMyDoubts: async () => {
            try {
                const response = await fetch(`${API_URL}/doubts/my`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get my doubts error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getQueue: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            try {
                const response = await fetch(`${API_URL}/doubts/queue?${query}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get doubt queue error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        assign: async (id, facultyId) => {
            try {
                const response = await fetch(`${API_URL}/doubts/${id}/assign`, {
                    method: 'PUT',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ faculty_id: facultyId })
                });
                return await response.json();
            } catch (error) {
                console.error('Assign doubt error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        resolve: async (id, resolutionMessage) => {
            try {
                const response = await fetch(`${API_URL}/doubts/${id}/resolve`, {
                    method: 'PUT',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ resolution_message: resolutionMessage })
                });
                return await response.json();
            } catch (error) {
                console.error('Resolve doubt error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        reply: async (id, message, fileUrl = null) => {
            try {
                const response = await fetch(`${API_URL}/doubts/${id}/reply`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ message, file_url: fileUrl })
                });
                return await response.json();
            } catch (error) {
                console.error('Reply to doubt error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        rate: async (id, rating) => {
            try {
                const response = await fetch(`${API_URL}/doubts/${id}/rate`, {
                    method: 'PUT',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify({ rating })
                });
                return await response.json();
            } catch (error) {
                console.error('Rate doubt error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getSLAStats: async () => {
            try {
                const response = await fetch(`${API_URL}/doubts/sla-stats`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get SLA stats error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    },

    // ============================================
    // BATCHES
    // ============================================
    batches: {
        getAll: async () => {
            try {
                const response = await fetch(`${API_URL}/batches`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get batches error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getById: async (id) => {
            try {
                const response = await fetch(`${API_URL}/batches/${id}`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get batch error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        create: async (data) => {
            try {
                const response = await fetch(`${API_URL}/batches`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Create batch error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        update: async (id, data) => {
            try {
                const response = await fetch(`${API_URL}/batches/${id}`, {
                    method: 'PUT',
                    headers: TokenManager.getHeaders(),
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Update batch error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        getStudents: async (id) => {
            try {
                const response = await fetch(`${API_URL}/batches/${id}/students`, {
                    method: 'GET',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Get batch students error:', error);
                return { success: false, message: 'Network error' };
            }
        },

        runPromotion: async (id) => {
            try {
                const response = await fetch(`${API_URL}/batches/${id}/promote`, {
                    method: 'POST',
                    headers: TokenManager.getHeaders()
                });
                return await response.json();
            } catch (error) {
                console.error('Run promotion error:', error);
                return { success: false, message: 'Network error' };
            }
        }
    }
};

// ============================================
// EXPOSE TO GLOBAL
// ============================================
window.api = api;
window.TokenManager = TokenManager;

console.log('🔗 API Service loaded successfully');
console.log('📡 API URL:', API_URL);
console.log('🔐 Authenticated:', TokenManager.isAuthenticated());