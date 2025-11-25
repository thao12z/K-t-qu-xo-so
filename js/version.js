// Version Configuration
// Update this file after each deployment

window.APP_VERSION = {
    version: '2.1.0',
    buildDate: '2025-01-24',
    buildTime: '20:30',
    branch: 'claude/create-new-feature-01RtGpBFkZCRyfYurnzELumi',
    features: [
        'Advanced Preprocessor',
        'Tin X: prefix support',
        'Dash format output',
        'Production security',
        'No test/demo code'
    ],
    changelog: {
        '2.1.0': [
            'Remove all test/demo functions',
            'Remove all emoji icons',
            'Add production security protection',
            'Fix Tin prefix handling',
            'Fix segment regex for multi-bet',
            'Fix responsive UI for PC/Mobile'
        ],
        '2.0.0': [
            'Advanced input preprocessor',
            'Support complex bet formats',
            'MySQL integration'
        ]
    }
};

console.log(`App Version: ${window.APP_VERSION.version} (${window.APP_VERSION.buildDate} ${window.APP_VERSION.buildTime})`);
