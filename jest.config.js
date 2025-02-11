export default {
    transform: {},
    extensionsToTreatAsEsm: ['.js'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    verbose: true,
    testMatch: ['**/tests/**/*.test.js'],
    setupFiles: ['<rootDir>/tests/setup.js']
}; 