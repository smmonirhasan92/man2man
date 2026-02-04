const seedrandom = require('seedrandom');
const crypto = require('crypto');

/**
 * Provably Fair Service
 * Implements deterministic RNG using Server Seed + Client Seed + Nonce.
 */
class ProvablyFairService {

    /**
     * Generate a new Server Seed Pair (Secret + Hash).
     * The Hash is shown to the user *before* the game.
     * The Secret is revealed *after* the game to prove fairness.
     */
    static generateServerSeed() {
        const serverSeed = crypto.randomBytes(32).toString('hex');
        const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
        return { serverSeed, serverSeedHash };
    }

    /**
     * Generate a deterministic float between 0 and 1.
     * @param {string} serverSeed - The secret server key
     * @param {string} clientSeed - The user's provided seed
     * @param {number} nonce - The game number (incrementing)
     */
    static generateResult(serverSeed, clientSeed, nonce) {
        const combination = `${serverSeed}-${clientSeed}-${nonce}`;
        const rng = seedrandom(combination);
        return rng(); // Returns float 0 to 1
    }

    /**
     * Generate a Crash Point (Aviator Style).
     * Logic: 100 / (1 - result) * houseEdgeModifier
     */
    static generateCrashPoint(serverSeed, clientSeed, nonce, forceLoss = false) {
        if (forceLoss) return 1.00; // Instant Cash Out Crash

        const result = this.generateResult(serverSeed, clientSeed, nonce);
        // Instant crash at 0.00 (1%) logic can be added here
        const houseEdge = 0.99; // 1% House Edge
        const crashPoint = Math.floor(100 * houseEdge / (1 - result)) / 100;
        return Math.max(1.00, crashPoint);
    }

    /**
     * Generate Mines Grid (Mines Game).
     * If forceLoss is true, ensure the first few tiles are bombs? 
     * Or better, let the Controller handle the immediate loss logic.
     * Use "Rigged" grid if needed? 
     * For now, standard generation. Controller can just say "You stepped on a mine" if forced.
     */
    static generateMines(serverSeed, clientSeed, nonce, minesCount = 3, totalTiles = 25) {
        const rng = seedrandom(`${serverSeed}-${clientSeed}-${nonce}`);
        let mines = [];
        const availableTiles = Array.from({ length: totalTiles }, (_, i) => i);

        for (let i = 0; i < minesCount; i++) {
            const randomIndex = Math.floor(rng() * availableTiles.length);
            mines.push(availableTiles[randomIndex]);
            availableTiles.splice(randomIndex, 1);
        }
        return mines;
    }

    /**
     * Generate Coin Flip Result
     */
    static generateCoinFlip(serverSeed, clientSeed, nonce) {
        const result = this.generateResult(serverSeed, clientSeed, nonce);
        return result < 0.5 ? 'head' : 'tail';
    }
}

module.exports = ProvablyFairService;
