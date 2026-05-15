
import os

file_path = '/var/www/man2man/frontend/app/admin/dashboard/page.js'
with open(file_path, 'r') as f:
    content = f.read()

target = 'href="/admin/users"'
new_card = '<DashboardCard href="/admin/empire" title="Empire Master" description="Referral Rewards" icon={Crown} colorClass="amber" />'

if target in content:
    # Ensure Crown icon is imported
    if 'Crown' not in content:
        content = content.replace('MessageSquare,', 'MessageSquare, Crown,')
    
    # Insert the card after the User Management card's closing tag
    user_card_end = content.find('/>', content.find(target)) + 2
    new_content = content[:user_card_end] + '\n                    ' + new_card + content[user_card_end:]
    
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully added Empire Master card.")
else:
    print("Target card not found.")
