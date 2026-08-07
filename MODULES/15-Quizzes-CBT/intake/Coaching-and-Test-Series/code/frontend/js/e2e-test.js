// ============================================
// END-TO-END TEST SUITE
// ============================================

const E2ETests = {
    // ============================================
    // TEST 1: User Registration & Login Flow
    // ============================================
    testAuthFlow: async function() {
        console.log('🧪 TEST 1: Auth Flow');
        const testEmail = `test_${Date.now()}@test.com`;
        const testPassword = 'password123';

        try {
            // Register
            console.log('  📝 Registering user...');
            const registerRes = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword,
                    first_name: 'Test',
                    last_name: 'User',
                    role: 'student'
                })
            });
            const registerData = await registerRes.json();
            console.log('  ✅ Registration:', registerData.message);

            // Login
            console.log('  🔐 Logging in...');
            const loginRes = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword
                })
            });
            const loginData = await loginRes.json();
            console.log('  ✅ Login:', loginData.success ? 'Success' : 'Failed');
            return loginData;
        } catch (error) {
            console.error('  ❌ Auth flow failed:', error);
        }
    },

    // ============================================
    // TEST 2: Get Student Profile
    // ============================================
    testStudentProfile: async function(token) {
        console.log('🧪 TEST 2: Student Profile');
        try {
            const response = await fetch('http://localhost:5000/api/students/profile/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log('  ✅ Student profile:', data.success ? 'Found' : 'Not found');
            return data;
        } catch (error) {
            console.error('  ❌ Student profile failed:', error);
        }
    },

    // ============================================
    // TEST 3: Get Tests
    // ============================================
    testGetTests: async function(token) {
        console.log('🧪 TEST 3: Get Tests');
        try {
            const response = await fetch('http://localhost:5000/api/tests', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log(`  ✅ Found ${data.data?.length || 0} tests`);
            return data;
        } catch (error) {
            console.error('  ❌ Get tests failed:', error);
        }
    },

    // ============================================
    // TEST 4: Get Analytics
    // ============================================
    testAnalytics: async function(token, studentId) {
        console.log('🧪 TEST 4: Analytics');
        try {
            const response = await fetch(`http://localhost:5000/api/analytics/student/${studentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log('  ✅ Analytics:', data.success ? 'Loaded' : 'Not loaded');
            return data;
        } catch (error) {
            console.error('  ❌ Analytics failed:', error);
        }
    },

    // ============================================
    // TEST 5: Get Error Book
    // ============================================
    testErrorBook: async function(token, studentId) {
        console.log('🧪 TEST 5: Error Book');
        try {
            const response = await fetch(`http://localhost:5000/api/errorbook/student/${studentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log('  ✅ Error Book:', data.success ? 'Loaded' : 'Not loaded');
            return data;
        } catch (error) {
            console.error('  ❌ Error Book failed:', error);
        }
    },

    // ============================================
    // RUN ALL TESTS
    // ============================================
    runAllTests: async function() {
        console.log('🚀 ========================================');
        console.log('🚀     END-TO-END TEST SUITE');
        console.log('🚀 ========================================\n');

        // Login as student
        const loginData = await this.testAuthFlow();
        if (!loginData?.data?.token) {
            console.error('❌ Cannot proceed without token');
            return;
        }

        const token = loginData.data.token;
        const userId = loginData.data.user?.id;

        // Run all tests
        await this.testStudentProfile(token);
        await this.testGetTests(token);
        await this.testAnalytics(token, 1); // Replace with actual student ID
        await this.testErrorBook(token, 1);

        console.log('\n✅ ========================================');
        console.log('✅     ALL TESTS COMPLETED');
        console.log('✅ ========================================');
    }
};

// Run tests
E2ETests.runAllTests();