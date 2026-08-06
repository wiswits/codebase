// ============================================
// JEST CONFIGURATION
// ============================================

module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    moduleFileExtensions: ['js', 'json', 'node'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/config/**',
        '!src/migrations/**',
        '!src/seeds/**',
        '!src/tests/**',
        '!server.js'
    ],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    verbose: true,
    testTimeout: 30000
};