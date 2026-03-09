module.exports = {
    apps: [
        {
            name: 'man2man-backend',
            script: './backend/server.js',
            cwd: '/var/www/man2man',
            env: {
                NODE_ENV: 'production',
                PORT: 5050
            },
            env_file: '/var/www/man2man/backend/.env'
        },
        {
            name: 'man2man-frontend',
            script: 'npm',
            args: 'start',
            cwd: '/var/www/man2man/frontend',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            env_file: '/var/www/man2man/frontend/.env.production'
        }
    ]
};
