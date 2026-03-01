import './globals.css'
import 'react-quill-new/dist/quill.snow.css'; // Global import for Quill styles
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

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
        icon: '/logo.png',
        shortcut: '/logo.png',
        apple: '/logo.png',
    },
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0a192f',
}

import { NotificationProvider } from '../context/NotificationContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { CardSkinProvider } from '../context/CardSkinContext';
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

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning={true}>
            <body className={`${inter.className} min-h-screen text-white`} suppressHydrationWarning={true}>
                <AutoUpdater />
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

                                {/* Sticky Bottom Nav - Constrined by Logic inside Shell or Component */}
                                {/* We keep the wrapper but rely on CSS or inheretance/media queries if possible, 
                                    OR we just leave it max-w-[450px] for now. 
                                    Wait, if Admin is Full Width, we don't want BottomNav at all usually. 
                                    Let's assume BottomNav component hides itself on admin routes.
                                    But the CONTAINER needs to not block clicks or look weird.
                                    I will add 'max-w-[450px]' class BUT also 'md:max-w-none md:w-full' for admin? No.
                                    App is always 450px. Admin is full.
                                    I will wrap this in a component that checks path is simpler?
                                    Actually, Shell.js is client component. I can pass a prop 'isMobile'?
                                    No, Shell determines isMobile internaly.
                                    
                                    Let's just put the Nav inside Shell.
                                */}
                                <div className="fixed bottom-0 w-full sm:max-w-md mx-auto z-50 pointer-events-none left-0 right-0 mobile-only-nav">
                                    <div className="pointer-events-auto">
                                        <BottomNav />
                                    </div>
                                </div>


                                <PWAInstallPrompt />
                                <ChatWidget />
                                <NotificationPopup />
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
                                        success: {
                                            iconTheme: {
                                                primary: '#10b981',
                                                secondary: '#fff',
                                            },
                                        },
                                        error: {
                                            iconTheme: {
                                                primary: '#ef4444',
                                                secondary: '#fff',
                                            },
                                        },
                                    }}
                                />
                            </Shell>
                        </CardSkinProvider>
                    </CurrencyProvider>
                </NotificationProvider>
            </body>
        </html>
    )
}

