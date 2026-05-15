
import sys

file_path = '/var/www/man2man/frontend/components/p2p/P2PDashboard.js'
content = open(file_path).read()

old_line = 'await api.post(`/p2p/sell/${orderId}/cancel`);'
new_line = 'await api.post(`/p2p/order/${orderId}/cancel`);'

if old_line in content:
    new_content = content.replace(old_line, new_line)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Fixed P2P Cancel Path.")
else:
    print("Pattern not found.")
