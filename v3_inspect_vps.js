const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function inspectV3() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const script = `
import { getLlama } from 'node-llama-cpp';
async function run() {
    try {
        const llama = await getLlama();
        console.log('--- LLAMA ENGINE ---');
        console.log('Keys:', Object.keys(llama));
        
        const model = await llama.loadModel({ 
            modelPath: '/var/www/man2man/backend/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf' 
        });
        console.log('--- MODEL ---');
        console.log('Keys:', Object.keys(model));
        
        const context = await llama.createContext({ model });
        console.log('--- CONTEXT ---');
        console.log('Keys:', Object.keys(context));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
`;
        await ssh.execCommand(`echo '${script}' > /tmp/inspect_v3.mjs`);
        const res = await ssh.execCommand('node /tmp/inspect_v3.mjs');
        console.log("STDOUT:\n", res.stdout);
        console.log("STDERR:\n", res.stderr);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
inspectV3();
