const mongoose = require('mongoose');
const Banner = require('./modules/banner/BannerModel');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1')
    .then(async () => {
        console.log('DB Connected. Wiping old banners...');
        await Banner.deleteMany({}); // Clear old non-converting banners

        const marketingBanners = [
            {
                title: "Invite Friends. Earn Forever.",
                subtitle: "Build your team and get instant commissions every day.",
                bgType: 'image',
                bgValue: '/slider_1.png',
                btnText: "Get My Link",
                btnLink: "/dashboard/share",
                btnColor: "#10B981", // Emerald Green for Money/Action
                order: 1,
                textAnimation: 'slide-left',
                isActive: true
            },
            {
                title: "Your Daily Income Machine",
                subtitle: "Activate a premium plan, complete simple tasks, and withdraw cash today.",
                bgType: 'image',
                bgValue: '/slider_2.png',
                btnText: "View Plans",
                btnLink: "/marketplace",
                btnColor: "#3B82F6", // Trust Blue
                order: 2,
                textAnimation: 'fade-up',
                isActive: true
            },
            {
                title: "Are You Feeling Lucky?",
                subtitle: "Spin the magic wheel to multiply your NXS balance. Instant results!",
                bgType: 'image',
                bgValue: '/slider_3.png',
                btnText: "Play Spin Game",
                btnLink: "/dashboard/luck-test",
                btnColor: "#8B5CF6", // Purple for Gamification
                order: 3,
                textAnimation: 'zoom',
                isActive: true
            },
            {
                title: "The Mega Jackpot Awaits",
                subtitle: "Buy a ticket for the weekly draw. One lucky winner takes everything!",
                bgType: 'color',
                bgValue: '#D97706', // Gold/Amber for Lottery
                btnText: "Buy Ticket",
                btnLink: "/lottery",
                btnColor: "#1F2937", // Dark button on gold background
                order: 4,
                textAnimation: 'fade-up',
                isActive: true
            }
        ];

        await Banner.insertMany(marketingBanners);
        console.log('✅ 4 Psychological Marketing Banners created successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
