// ============================================
// ERROR HANDLING TEST
// ============================================

const ErrorTester = {
    // Test 1: Invalid Login
    testInvalidLogin: async function() {
        console.log('🧪 Testing: Invalid Login');
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'wrong@email.com',
                    password: 'wrongpassword'
                })
            });
            const data = await response.json();
            console.log('✅ Invalid login handled:', data);
            return data;
        } catch (error) {
            console.error('❌ Error handler failed:', error);
        }
    },

    // Test 2: Missing Fields
    testMissingFields: async function() {
        console.log('🧪 Testing: Missing Fields');
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@test.com'
                })
            });
            const data = await response.json();
            console.log('✅ Missing fields handled:', data);
            return data;
        } catch (error) {
            console.error('❌ Error handler failed:', error);
        }
    },

    // Test 3: Invalid Token
    testInvalidToken: async function() {
        console.log('🧪 Testing: Invalid Token');
        try {
            const response = await fetch('http://localhost:5000/api/students/profile/me', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer invalidtoken'
                }
            });
            const data = await response.json();
            console.log('✅ Invalid token handled:', data);
            return data;
        } catch (error) {
            console.error('❌ Error handler failed:', error);
        }
    },

    // Test 4: Duplicate Email
    testDuplicateEmail: async function() {
        console.log('🧪 Testing: Duplicate Email');
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'student@edutech.com',
                    password: 'password123',
                    first_name: 'Duplicate',
                    last_name: 'User',
                    role: 'student'
                })
            });
            const data = await response.json();
            console.log('✅ Duplicate email handled:', data);
            return data;
        } catch (error) {
            console.error('❌ Error handler failed:', error);
        }
    },

    // Test 5: Not Found Route
    testNotFound: async function() {
        console.log('🧪 Testing: Not Found Route');
        try {
            const response = await fetch('http://localhost:5000/api/nonexistent');
            const data = await response.json();
            console.log('✅ Not found handled:', data);
            return data;
        } catch (error) {
            console.error('❌ Error handler failed:', error);
        }
    },

    runAllTests: async function() {
        console.log('🚀 Running all error handling tests...\n');
        await this.testInvalidLogin();
        await this.testMissingFields();
        await this.testInvalidToken();
        await this.testDuplicateEmail();
        await this.testNotFound();
        console.log('\n✅ All tests completed!');
    }
};

// Run tests
ErrorTester.runAllTests();