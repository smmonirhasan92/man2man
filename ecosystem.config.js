module.exports = {
    apps: [
        {
            name: 'man2man-backend',
            script: 'server.js',
            cwd: './backend',
            instances: 'max', // or 1 depending on VPS resources
            exec_mode: 'cluster',
            env_production: {
                NODE_ENV: 'production'
            },
            env_file: '.env'
        },
        {
            name: 'man2man-frontend',
            script: 'node_modules/next/dist/bin/next',
            args: 'start -p 3000',
            cwd: './frontend',
            instances: 1,
            exec_mode: 'fork',
            env_production: {
                NODE_ENV: 'production'
            },
            env_file: '.env.production'
        }
    ]
};
