const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BotIdentity = require('../modules/game/BotIdentityModel');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const botNames = [
    "Alex", "Rohan", "Saima", "Vikram", "John", "Sarah", "Mike", "Emily", "David", "Jessica",
    "Chris", "Amanda", "James", "Jennifer", "Robert", "Lisa", "Michael", "Linda", "William", "Elizabeth",
    "King777", "ProGamer", "LuckyBoy", "RoyalQueen", "AceMaster", "PokerFace", "BluffKing", "CardShark",
    "DhakaKing", "CtgBoy", "SylhetStar", "KhulnaTiger", "BarisalBull", "RajshahiRoyal", "RangpurRider",
    "TigerBD", "LionHeart", "EagleEye", "WolfPack", "BearClaw", "SnakeBite", "SharkFin", "WhaleTail",
    "GoldDigger", "SilverSurfer", "BronzeBomber", "PlatinumPrince", "DiamondDuke", "RubyRose", "EmeraldEmperor",
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa",
    "Neo", "Morpheus", "Trinity", "Cypher", "Tank", "Dozer", "Mouse", "Switch", "Apoc", "Cypher",
    "Zeus", "Hera", "Poseidon", "Demeter", "Ares", "Athena", "Apollo", "Artemis", "Hephaestus", "Aphrodite",
    "Thor", "Odin", "Loki", "Frigg", "Baldr", "Tyr", "Heimdall", "Bragi", "Idun", "Njord",
    "Ra", "Osiris", "Isis", "Horus", "Set", "Anubis", "Thoth", "Bastet", "Hathor", "Sekhmet"
];

const countries = ['BD', 'USA', 'UAE', 'UK', 'IN'];

const seedBots = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ DB Connected");

        const count = await BotIdentity.countDocuments();
        if (count > 50) {
            console.log("✅ Bots already seeded. Skipping.");
            process.exit(0);
        }

        const bots = botNames.map(name => ({
            name,
            country: countries[Math.floor(Math.random() * countries.length)],
            avatar: `/avatars/avatar_${Math.floor(Math.random() * 10) + 1}.png`,
            isHighRoller: Math.random() > 0.8
        }));

        await BotIdentity.insertMany(bots);
        console.log(`✅ Seeded ${bots.length} Bot Identities.`);
        process.exit(0);
    } catch (e) {
        console.error("Seeding Failed:", e);
        process.exit(1);
    }
};

seedBots();
