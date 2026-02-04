const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/universal_game_core_v1';
const BACKUP_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../../DB_BACKUP');

async function backup() {
    try {
        console.log(`Connecting to ${MONGO_URI}...`);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const col of collections) {
            const name = col.name;
            console.log(`Exporting ${name}...`);
            const data = await mongoose.connection.db.collection(name).find({}).toArray();

            fs.writeFileSync(
                path.join(BACKUP_DIR, `${name}.json`),
                JSON.stringify(data, null, 2)
            );
        }

        console.log(`Backup Complete! Saved ${collections.length} collections to ${BACKUP_DIR}`);
        process.exit(0);

    } catch (err) {
        console.error('Backup Failed:', err);
        process.exit(1);
    }
}

backup();
