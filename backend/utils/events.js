const EventEmitter = require('events');

class SystemEvents extends EventEmitter { }

// Export a singleton instance so events can be shared across modules
const systemEvents = new SystemEvents();

module.exports = systemEvents;
