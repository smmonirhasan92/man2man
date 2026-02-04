const crypto = require('crypto');

// Configuration
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'vOVH6sdmpNWjRRIqCc7rdxs01lwBxD53'; // 32 chars
const IV_LENGTH = 16; // AES block size

class CryptoService {

    // 1. AES-256 Encryption (For Real Phone Storage)
    static encrypt(text) {
        if (!text) return null;
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            // Format: IV:EncryptedText
            return iv.toString('hex') + ':' + encrypted.toString('hex');
        } catch (error) {
            console.error('[Crypto] Encryption Failed:', error);
            return null;
        }
    }

    // 2. AES-256 Decryption (For Recovery/Admin)
    static decrypt(text) {
        if (!text) return null;
        try {
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            console.error('[Crypto] Decryption Failed:', error);
            return null;
        }
    }

    // 3. SHA-256 Hashing (For Fast Lookups/Login)
    static hash(text) {
        if (!text) return null;
        return crypto.createHash('sha256').update(text + process.env.JWT_SECRET).digest('hex');
    }

    // 4. Generate Synthetic USA Identity
    static generateSyntheticIdentity() {
        // Format: +1 (XXX) XXX-XXXX
        const areaCodes = ['212', '310', '415', '305', '702', '646', '323']; // Major US cities
        const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
        const prefix = Math.floor(100 + Math.random() * 900);
        const line = Math.floor(1000 + Math.random() * 9000);
        return `+1 (${area}) ${prefix}-${line}`;
    }

    // 5. Generate Random Referral ID (Non-Sequential)
    static generateReferralId() {
        // Format: 8-char random alphanumeric (Upper case)
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
}

module.exports = CryptoService;
