import './globals.css'
import 'react-quill-new/dist/quill.snow.css'; // Global import for Quill styles
import { Inter, Outfit } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata = {
    title: 'USA Affiliate - Official Access',
    description: 'Secure, fast, and reliable earning platform.',
    metadataBase: new URL('https://usaaffiliatemarketing.com'),
    manifest: '/manifest.json',
    appleWebApp: {
        title: 'USA Affiliate',
        statusBarStyle: 'black-translucent',
        capable: true,
    },
    openGraph: {
        title: 'usaaffiliatemarketing',
        description: 'Secure, fast, and reliable earning platform.',
        url: 'https://usaaffiliatemarketing.com',
        siteName: 'usaaffiliatemarketing',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'usaaffiliatemarketing',
        description: 'Transfer with confidence.',
        images: ['/og-image.png'],
    },
    icons: {
        icon: '/networking_globe.png',
        shortcut: '/networking_globe.png',
        apple: '/networking_globe.png',
    },
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0a192f',
    viewportFit: 'cover',
    interactiveWidget: 'resizes-visual',
}

import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { CardSkinProvider } from '../context/CardSkinContext';
import { AuthProvider } from '../context/AuthContext';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import BottomNav from '../components/BottomNav';
import ChatWidget from '../components/ui/ChatWidget';
import RouteChecker from '../components/RouteChecker';
import PageTransition from '../components/PageTransition';
import AuthGuard from '../components/AuthGuard';
import NotificationPopup from '../components/NotificationPopup';
import { Toaster } from 'react-hot-toast';

import GlobalProfileDrawer from '../components/GlobalProfileDrawer';
import Shell from '../components/layout/Shell';
import AutoUpdater from '../components/AutoUpdater';
import GlobalActiveTradeBanner from '../components/p2p/GlobalActiveTradeBanner';

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning={true} className={`${inter.variable} ${outfit.variable}`}>
            <body className={`${outfit.className} min-h-screen text-white bg-[#0a192f]`} suppressHydrationWarning={true}>
                <AutoUpdater />
                <AuthProvider>
                    <NotificationProvider>
                        <CurrencyProvider>
                            <CardSkinProvider>
                                {/* Shell handles Layout Constraints */}
                                <Shell>
                                    {/* GLOBAL DRAWER TRIGGER + DRAWER */}
                                    <GlobalProfileDrawer />

                                    {/* Main Content Area */}
                                    <main className="flex-1 pb-32 relative z-10">
                                        <RouteChecker />
                                        <AuthGuard>
                                            <PageTransition>
                                                {children}
                                            </PageTransition>
                                        </AuthGuard>
                                    </main>

                                    {/* Sticky Bottom Nav */}
                                    <div className="fixed bottom-0 w-full sm:max-w-md mx-auto z-50 pointer-events-none left-0 right-0 mobile-only-nav">
                                        <div className="pointer-events-auto">
                                            <BottomNav />
                                        </div>
                                    </div>


                                    <PWAInstallPrompt />
                                    <NotificationPopup />
                                    <GlobalActiveTradeBanner />
                                    <ChatWidget />
                                    {/* Premium Toasts */}
                                    <Toaster
                                        position="top-center"
                                        toastOptions={{
                                            style: {
                                                background: '#1e293b',
                                                color: '#fff',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                            },
                                        }}
                                    />
                                </Shell>
                            </CardSkinProvider>
                        </CurrencyProvider>
                    </NotificationProvider>
                </AuthProvider>
            </body>
        </html >
    )
}

