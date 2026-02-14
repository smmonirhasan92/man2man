import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import gameService from '../services/gameService';
import { walletService } from '../services/walletService';
import toast from 'react-hot-toast';

export function useGameLogic() {
    // Game Settings
    const [minBet, setMinBet] = useState(10);
    const [maxBet, setMaxBet] = useState(1000);

    // User Input
    const [choice, setChoice] = useState('head');
    const [betAmount, setBetAmount] = useState(20);

    // Game State
    const [gameState, setGameState] = useState('idle'); // idle, flipping, result
    const [result, setResult] = useState(null); // win, loss
    const [coinSide, setCoinSide] = useState('head'); // head, tail (for visual)
    const [isMaintenance, setIsMaintenance] = useState(false);

    // Wallet State
    const [gameBalance, setGameBalance] = useState(0);
    const [mainBalance, setMainBalance] = useState(0);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // --- Lifecycle ---
    useEffect(() => {
        loadGameInfo();
        fetchWallet();
        const interval = setInterval(fetchWallet, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- Actions ---
    const loadGameInfo = async () => {
        try {
            const data = await gameService.getGameInfo();
            if (data) {
                setMinBet(data.minBet || 10);
                setMaxBet(data.maxBet || 1000);
            }
        } catch (err) {
            console.error("Failed to load game info:", err);
        }
    };

    const fetchWallet = async () => {
        try {
            const data = await walletService.getBalance();
            setGameBalance(data.game_balance || 0);
            setMainBalance(data.wallet_balance || 0);
        } catch (err) {
            // Logger handles logging in service
        }
    };

    const handlePlay = async () => {
        if (gameState === 'flipping') return;

        // Validation
        if (parseFloat(gameBalance) < betAmount) {
            setShowTransfer(true);
            return;
        }

        setGameState('flipping');
        setResult(null);

        try {
            const startTime = Date.now();
            const data = await gameService.playCoinFlip(betAmount, choice);

            const elapsed = Date.now() - startTime;
            const delay = Math.max(0, 5000 - elapsed); // Force 5s animation

            setTimeout(() => {
                setCoinSide(data.result);
                setResult(data.won ? 'win' : 'loss');
                setGameBalance(data.newBalance);
                setGameState('result');
            }, delay);

        } catch (err) {
            console.error("Play Error:", err);
            if (err.response && err.response.status === 503) {
                setIsMaintenance(true);
            } else {
                toast.error(err.response?.data?.message || 'Game Error');
            }
            setGameState('idle');
        }
    };

    const handleTransferSuccess = useCallback(() => {
        fetchWallet();
        setShowTransfer(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    }, []);

    return {
        // State
        choice, setChoice,
        betAmount, setBetAmount,
        minBet, maxBet,
        gameState, result, coinSide,
        gameBalance, mainBalance,
        showTransfer, setShowTransfer,
        showToast,
        isMaintenance,

        // Actions
        handlePlay,
        handleTransferSuccess
    };
}
