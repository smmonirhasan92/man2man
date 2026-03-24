const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');
const path = require('path');

async function updateP2PChat() {
    const localPath = path.join(__dirname, 'P2PChatRoom_vps_optimized.js');
    
    // Read the VPS version first to make sure we don't lose anything
    // (I already read it into vps_P2PChatRoom.js earlier)
    const originalContent = fs.readFileSync('d:/man2man/vps_P2PChatRoom.js', 'utf8');
    
    // Modifications:
    let optimizedContent = originalContent
        // 1. Remove VisualGuide import and usage
        .replace("import VisualGuide from '../ui/VisualGuide';", "")
        .replace(/<VisualGuide[\s\S]*?\/>/g, "")
        // 2. Remove getTutorialSteps function
        .replace(/const getTutorialSteps = \(\) => \{[\s\S]*?\};/g, "")
        // 3. Update useNotification destructuring (ensure it gets playSound)
        .replace("const { permission, requestPermission, notify } = useNotification();", "const { permission, requestPermission, notify, playSound } = useNotification();")
        // 4. Remove redundant audio refs and elements
        .replace(/const notificationAudio = useRef\(null\);/g, "")
        .replace(/const successAudio = useRef\(null\);/g, "")
        .replace(/<audio ref=\{notificationAudio\} src="\/sounds\/notification\.mp3" preload="auto" \/>/g, "")
        .replace(/<audio ref=\{successAudio\} src="\/sounds\/success\.mp3" preload="auto" \/>/g, "")
        // 5. Update playDing and playSuccess to be internal or use hook
        .replace(/const playDing = \(\) => \{[\s\S]*?\};/g, "const playDing = () => { playSound('click'); };")
        .replace(/const playSuccess = \(\) => \{[\s\S]*?\};/g, "const playSuccess = () => { playSound('success'); };")
        // 6. Add local echo sound to sendMessage
        .replace("await api.post(`/p2p/trade/${tradeId}/chat`, { text: tempText });", "playSound('click');\n            await api.post(`/p2p/trade/${tradeId}/chat`, { text: tempText });")
        // 7. Cleanup any visual artifacts of the guide
        .replace(/targetId: 'step-1-copy',/g, "")
        .replace(/id="step-1-copy"/g, "")
        .replace(/id="step-2-proof"/g, "")
        .replace(/id="step-3-submit"/g, "");

    fs.writeFileSync(localPath, optimizedContent);

    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        await ssh.putFile(localPath, '/var/www/man2man/frontend/components/p2p/P2PChatRoom.js');
        console.log('✅ Updated P2PChatRoom.js on VPS');
        ssh.dispose();
    } catch (err) {
        console.error('Update Failed:', err);
        ssh.dispose();
    }
}

updateP2PChat();
