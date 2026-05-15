
import sys

file_path = '/var/www/man2man/frontend/components/p2p/P2PChatRoom.js'
content = open(file_path).read()

old_block = """        socket.on('connect', () => {
            console.log('[SOCKET] Reconnected - Joining Room');
            socket.emit('join_user_room', user?._id || user?.id);
        });"""

new_block = """        socket.on('connect', () => {
            console.log('[SOCKET] Reconnected - Syncing Rooms');
            socket.emit('join_user_room', user?._id || user?.id);
            if (tradeId) socket.emit('join_trade_room', tradeId);
        });"""

if old_block in content:
    new_content = content.replace(old_block, new_block)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully fixed reconnect logic.")
else:
    print("Old block not found.")
