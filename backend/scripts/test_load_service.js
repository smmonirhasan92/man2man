try {
    console.log('Loading TeenPattiService...');
    const service = require('../modules/game/TeenPattiService');
    console.log('✅ Service Loaded Successfully!');
} catch (e) {
    console.error('❌ Load Failed:', e);
}
