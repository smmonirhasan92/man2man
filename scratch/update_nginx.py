import os
import sys

nginx_conf = """server {
    server_name usaaffiliatemarketing.com www.usaaffiliatemarketing.com;

    error_page 502 503 504 /maintenance.html;
    location = /maintenance.html {
        root /var/www/man2man;
        internal;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    location /api {
        proxy_pass http://localhost:5050/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    listen [::]:443 ssl;
    ssl_certificate /etc/letsencrypt/live/usaaffiliatemarketing.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/usaaffiliatemarketing.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    listen [::]:80;
    server_name usaaffiliatemarketing.com www.usaaffiliatemarketing.com;
    return 301 https://$host$request_uri;
}
"""

with open('/etc/nginx/sites-enabled/usaaffiliatemarketing.com', 'w') as f:
    f.write(nginx_conf)
print("Nginx configuration updated successfully.")
