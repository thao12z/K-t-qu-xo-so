(function() {
    'use strict';

    // Version Bar Component - Hien thi version tren dau trang
    const VersionBar = () => {
        const [isExpanded, setIsExpanded] = React.useState(false);
        const [isVisible, setIsVisible] = React.useState(true);

        const version = window.APP_VERSION || {
            version: 'Unknown',
            buildDate: 'N/A',
            buildTime: 'N/A'
        };

        if (!isVisible) return null;

        return React.createElement('div', {
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: isExpanded ? '12px 20px' : '8px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                fontSize: '13px',
                fontFamily: 'monospace',
                transition: 'all 0.3s ease'
            }
        },
            React.createElement('div', {
                style: {
                    maxWidth: '1400px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '15px',
                    flexWrap: 'wrap'
                }
            },
                // Left: Version info
                React.createElement('div', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        flex: '1'
                    }
                },
                    React.createElement('strong', {
                        style: {
                            background: 'rgba(255,255,255,0.2)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }
                    }, `v${version.version}`),

                    React.createElement('span', {
                        style: { opacity: 0.9 }
                    }, `Build: ${version.buildDate} ${version.buildTime}`),

                    // Expand/Collapse button
                    React.createElement('button', {
                        onClick: () => setIsExpanded(!isExpanded),
                        style: {
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            transition: 'all 0.2s'
                        },
                        onMouseEnter: (e) => e.target.style.background = 'rgba(255,255,255,0.25)',
                        onMouseLeave: (e) => e.target.style.background = 'rgba(255,255,255,0.15)'
                    }, isExpanded ? 'Thu gọn' : 'Chi tiết')
                ),

                // Right: Close button
                React.createElement('button', {
                    onClick: () => setIsVisible(false),
                    style: {
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '16px',
                        lineHeight: '1',
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => e.target.style.background = 'rgba(255,255,255,0.25)',
                    onMouseLeave: (e) => e.target.style.background = 'rgba(255,255,255,0.15)'
                }, '×')
            ),

            // Expanded details
            isExpanded && React.createElement('div', {
                style: {
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                    fontSize: '12px',
                    lineHeight: '1.6'
                }
            },
                React.createElement('div', {
                    style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '15px'
                    }
                },
                    // Features
                    version.features && React.createElement('div', {},
                        React.createElement('div', {
                            style: {
                                fontWeight: 'bold',
                                marginBottom: '6px',
                                opacity: 0.9
                            }
                        }, 'Tính năng mới:'),
                        React.createElement('ul', {
                            style: {
                                margin: 0,
                                paddingLeft: '20px',
                                opacity: 0.85
                            }
                        }, version.features.map((feature, i) =>
                            React.createElement('li', { key: i }, feature)
                        ))
                    ),

                    // Latest changelog
                    version.changelog && version.changelog[version.version] &&
                    React.createElement('div', {},
                        React.createElement('div', {
                            style: {
                                fontWeight: 'bold',
                                marginBottom: '6px',
                                opacity: 0.9
                            }
                        }, `Thay đổi (v${version.version}):`),
                        React.createElement('ul', {
                            style: {
                                margin: 0,
                                paddingLeft: '20px',
                                opacity: 0.85
                            }
                        }, version.changelog[version.version].slice(0, 4).map((change, i) =>
                            React.createElement('li', { key: i }, change)
                        ))
                    )
                )
            )
        );
    };

    // Export to global scope
    window.VersionBar = VersionBar;

    console.log('Version Bar component loaded');

})();
