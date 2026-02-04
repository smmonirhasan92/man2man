const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- DB WRITE DEBUG ---');

const connectDB = async () => {
    try {
        let stateUri = process.env.MONGODB_URI;
        if (!stateUri.includes('directConnection=true')) {
            stateUri += (stateUri.includes('?') ? '&' : '?') + 'directConnection=true';
        }

        console.log(`Connecting to: ${stateUri}`);
        const conn = await mongoose.connect(stateUri, {
            directConnection: true,
            family: 4
        });

        console.log(`✅ MongoDB Connected`);

        // Try to write
        const TestSchema = new mongoose.Schema({ name: String });
        const TestModel = mongoose.model('DebugWrite', TestSchema);

        console.log('Attempting write...');
        try {
            await TestModel.create({ name: 'test_write_' + Date.now() });
            console.log('✅ Write Successful');
        } catch (e) {
            console.error('❌ Write Attempt 1 Failed:', e.message);
            // Wait and retry?
            process.exit(1);
        }

        process.exit(0);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
};

connectDB();
