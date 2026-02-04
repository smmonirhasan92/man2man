const AviatorService = require('./AviatorService');

class AviatorGameLoop {
    constructor() {
        this.isRunning = false;
        this.WAITING_DURATION = 8000; // 8 seconds
        this.CRASH_DELAY = 3000;      // 3 seconds
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[AVIATOR] Game Loop Started');
        this.loop();
    }

    async loop() {
        try {
            // 1. WAITING PHASE
            await AviatorService.startRound();
            // console.log('[AVIATOR] 🟡 WAITING');
            await this.sleep(this.WAITING_DURATION);

            // 2. PREPARE FLIGHT
            const totalBets = await AviatorService.getRoundTotalBets();
            const crashPoint = await AviatorService.generateCrashPoint(totalBets);

            // 3. TAKEOFF
            await AviatorService.takeOff();
            // console.log(`[AVIATOR] 🟢 FLYING -> Target: ${crashPoint}x | Bets: ${totalBets}`);

            // 4. FLYING PHASE
            // Calculate flight duration: t = ln(M) / 0.065
            // Example: 1.00x -> 0s. 2.00x -> ~10.6s. 100x -> ~70s.
            let flightTimeMs = 0;
            if (crashPoint > 1.0) {
                flightTimeMs = (Math.log(crashPoint) / 0.065) * 1000;
            }

            await this.sleep(flightTimeMs);

            // 5. CRASH
            await AviatorService.completeRound(crashPoint);
            // console.log(`[AVIATOR] 🔴 CRASHED @ ${crashPoint}x`);

            await this.sleep(this.CRASH_DELAY);

        } catch (err) {
            console.error('[AVIATOR LOOP ERROR]', err);
            await this.sleep(5000); // Backoff
        }

        // Loop
        if (this.isRunning) setImmediate(() => this.loop());
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AviatorGameLoop();
