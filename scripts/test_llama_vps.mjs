import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = '/var/www/man2man/backend/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

async function run() {
    try {
        console.log('1: Import success');
        const start = Date.now();
        console.log('2: Loading model binary from ' + modelPath);
        const model = new LlamaModel({ modelPath });
        console.log('3: Model loaded in ' + (Date.now() - start) + 'ms');

        const ctx = new LlamaContext({ model });
        console.log('4: Context created');

        const session = new LlamaChatSession({ context: ctx });
        console.log('5: Session ready');

        console.log('6: Prompting "Hello"...');
        const res = await session.prompt('Hello');
        console.log('7: Response:', res);

        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    }
}

run();
