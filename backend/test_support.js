require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const SupportMessage = require('./modules/support/SupportMessageModel');

async function testTicket() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
    try {
        const dummyUserId = new mongoose.Types.ObjectId(); // Mock valid ID
        const ticket = await SupportMessage.create({
            userId: dummyUserId,
            subject: 'Test Subject',
            messages: [{
                senderId: dummyUserId,
                senderRole: 'user',
                text: 'Test message body'
            }],
            status: 'open'
        });
        console.log('Success:', ticket);
    } catch (err) {
        console.error('Validation Error:', err.message);
    } finally {
        mongoose.disconnect();
    }
}
testTicket();
