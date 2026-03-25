'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import Link from 'next/link';
import { Smartphone, Lock, ChevronDown, Eye, EyeOff, UserPlus } from 'lucide-react';
import AuthInput from '../components/ui/AuthInput';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

// Premium Country Data with CDN Flag Images (Same as Register)
const countries = [
    { name: 'Bangladesh', code: '+880', flagCode: 'bd' },
    { name: 'India', code: '+91', flagCode: 'in' },
    { name: 'Pakistan', code: '+92', flagCode: 'pk' },
    { name: 'United States', code: '+1', flagCode: 'us' },
    { name: 'United Kingdom', code: '+44', flagCode: 'gb' },
    { name: 'Canada', code: '+1', flagCode: 'ca' },
    { name: 'Afghanistan', code: '+93', flagCode: 'af' },
    { name: 'Albania', code: '+355', flagCode: 'al' },
    { name: 'Algeria', code: '+213', flagCode: 'dz' },
    { name: 'Andorra', code: '+376', flagCode: 'ad' },
    { name: 'Angola', code: '+244', flagCode: 'ao' },
    { name: 'Argentina', code: '+54', flagCode: 'ar' },
    { name: 'Armenia', code: '+374', flagCode: 'am' },
    { name: 'Australia', code: '+61', flagCode: 'au' },
    { name: 'Austria', code: '+43', flagCode: 'at' },
    { name: 'Azerbaijan', code: '+994', flagCode: 'az' },
    { name: 'Bahrain', code: '+973', flagCode: 'bh' },
    { name: 'Belarus', code: '+375', flagCode: 'by' },
    { name: 'Belgium', code: '+32', flagCode: 'be' },
    { name: 'Belize', code: '+501', flagCode: 'bz' },
    { name: 'Benin', code: '+229', flagCode: 'bj' },
    { name: 'Bhutan', code: '+975', flagCode: 'bt' },
    { name: 'Bolivia', code: '+591', flagCode: 'bo' },
    { name: 'Bosnia and Herzegovina', code: '+387', flagCode: 'ba' },
    { name: 'Botswana', code: '+267', flagCode: 'bw' },
    { name: 'Brazil', code: '+55', flagCode: 'br' },
    { name: 'Brunei', code: '+673', flagCode: 'bn' },
    { name: 'Bulgaria', code: '+359', flagCode: 'bg' },
    { name: 'Burkina Faso', code: '+226', flagCode: 'bf' },
    { name: 'Burundi', code: '+257', flagCode: 'bi' },
    { name: 'Cambodia', code: '+855', flagCode: 'kh' },
    { name: 'Cameroon', code: '+237', flagCode: 'cm' },
    { name: 'Chile', code: '+56', flagCode: 'cl' },
    { name: 'China', code: '+86', flagCode: 'cn' },
    { name: 'Colombia', code: '+57', flagCode: 'co' },
    { name: 'Comoros', code: '+269', flagCode: 'km' },
    { name: 'Costa Rica', code: '+506', flagCode: 'cr' },
    { name: 'Croatia', code: '+385', flagCode: 'hr' },
    { name: 'Cuba', code: '+53', flagCode: 'cu' },
    { name: 'Cyprus', code: '+357', flagCode: 'cy' },
    { name: 'Czech Republic', code: '+420', flagCode: 'cz' },
    { name: 'Denmark', code: '+45', flagCode: 'dk' },
    { name: 'Djibouti', code: '+253', flagCode: 'dj' },
    { name: 'Ecuador', code: '+593', flagCode: 'ec' },
    { name: 'Egypt', code: '+20', flagCode: 'eg' },
    { name: 'El Salvador', code: '+503', flagCode: 'sv' },
    { name: 'Estonia', code: '+372', flagCode: 'ee' },
    { name: 'Ethiopia', code: '+251', flagCode: 'et' },
    { name: 'Fiji', code: '+679', flagCode: 'fj' },
    { name: 'Finland', code: '+358', flagCode: 'fi' },
    { name: 'France', code: '+33', flagCode: 'fr' },
    { name: 'Georgia', code: '+995', flagCode: 'ge' },
    { name: 'Germany', code: '+49', flagCode: 'de' },
    { name: 'Ghana', code: '+233', flagCode: 'gh' },
    { name: 'Greece', code: '+30', flagCode: 'gr' },
    { name: 'Guatemala', code: '+502', flagCode: 'gt' },
    { name: 'Guinea', code: '+224', flagCode: 'gn' },
    { name: 'Haiti', code: '+509', flagCode: 'ht' },
    { name: 'Honduras', code: '+504', flagCode: 'hn' },
    { name: 'Hungary', code: '+36', flagCode: 'hu' },
    { name: 'Iceland', code: '+354', flagCode: 'is' },
    { name: 'Indonesia', code: '+62', flagCode: 'id' },
    { name: 'Iran', code: '+98', flagCode: 'ir' },
    { name: 'Iraq', code: '+964', flagCode: 'iq' },
    { name: 'Ireland', code: '+353', flagCode: 'ie' },
    { name: 'Israel', code: '+972', flagCode: 'il' },
    { name: 'Italy', code: '+39', flagCode: 'it' },
    { name: 'Jamaica', code: '+1', flagCode: 'jm' },
    { name: 'Japan', code: '+81', flagCode: 'jp' },
    { name: 'Jordan', code: '+962', flagCode: 'jo' },
    { name: 'Kazakhstan', code: '+7', flagCode: 'kz' },
    { name: 'Kenya', code: '+254', flagCode: 'ke' },
    { name: 'Kuwait', code: '+965', flagCode: 'kw' },
    { name: 'Kyrgyzstan', code: '+996', flagCode: 'kg' },
    { name: 'Laos', code: '+856', flagCode: 'la' },
    { name: 'Latvia', code: '+371', flagCode: 'lv' },
    { name: 'Lebanon', code: '+961', flagCode: 'lb' },
    { name: 'Libya', code: '+218', flagCode: 'ly' },
    { name: 'Lithuania', code: '+370', flagCode: 'lt' },
    { name: 'Luxembourg', code: '+352', flagCode: 'lu' },
    { name: 'Madagascar', code: '+261', flagCode: 'mg' },
    { name: 'Malaysia', code: '+60', flagCode: 'my' },
    { name: 'Maldives', code: '+960', flagCode: 'mv' },
    { name: 'Mali', code: '+223', flagCode: 'ml' },
    { name: 'Malta', code: '+356', flagCode: 'mt' },
    { name: 'Mauritania', code: '+222', flagCode: 'mr' },
    { name: 'Mauritius', code: '+230', flagCode: 'mu' },
    { name: 'Mexico', code: '+52', flagCode: 'mx' },
    { name: 'Mongolia', code: '+976', flagCode: 'mn' },
    { name: 'Morocco', code: '+212', flagCode: 'ma' },
    { name: 'Mozambique', code: '+258', flagCode: 'mz' },
    { name: 'Myanmar', code: '+95', flagCode: 'mm' },
    { name: 'Namibia', code: '+264', flagCode: 'na' },
    { name: 'Nepal', code: '+977', flagCode: 'np' },
    { name: 'Netherlands', code: '+31', flagCode: 'nl' },
    { name: 'New Zealand', code: '+64', flagCode: 'nz' },
    { name: 'Nicaragua', code: '+505', flagCode: 'ni' },
    { name: 'Niger', code: '+227', flagCode: 'ne' },
    { name: 'Nigeria', code: '+234', flagCode: 'ng' },
    { name: 'Norway', code: '+47', flagCode: 'no' },
    { name: 'Oman', code: '+968', flagCode: 'om' },
    { name: 'Panama', code: '+507', flagCode: 'pa' },
    { name: 'Papua New Guinea', code: '+675', flagCode: 'pg' },
    { name: 'Paraguay', code: '+595', flagCode: 'py' },
    { name: 'Peru', code: '+51', flagCode: 'pe' },
    { name: 'Philippines', code: '+63', flagCode: 'ph' },
    { name: 'Poland', code: '+48', flagCode: 'pl' },
    { name: 'Portugal', code: '+351', flagCode: 'pt' },
    { name: 'Qatar', code: '+974', flagCode: 'qa' },
    { name: 'Romania', code: '+40', flagCode: 'ro' },
    { name: 'Russia', code: '+7', flagCode: 'ru' },
    { name: 'Rwanda', code: '+250', flagCode: 'rw' },
    { name: 'Saudi Arabia', code: '+966', flagCode: 'sa' },
    { name: 'Senegal', code: '+221', flagCode: 'sn' },
    { name: 'Serbia', code: '+381', flagCode: 'rs' },
    { name: 'Singapore', code: '+65', flagCode: 'sg' },
    { name: 'Slovakia', code: '+421', flagCode: 'sk' },
    { name: 'Slovenia', code: '+386', flagCode: 'si' },
    { name: 'Somalia', code: '+252', flagCode: 'so' },
    { name: 'South Africa', code: '+27', flagCode: 'za' },
    { name: 'South Korea', code: '+82', flagCode: 'kr' },
    { name: 'Spain', code: '+34', flagCode: 'es' },
    { name: 'Sri Lanka', code: '+94', flagCode: 'lk' },
    { name: 'Sudan', code: '+249', flagCode: 'sd' },
    { name: 'Sweden', code: '+46', flagCode: 'se' },
    { name: 'Switzerland', code: '+41', flagCode: 'ch' },
    { name: 'Syria', code: '+963', flagCode: 'sy' },
    { name: 'Taiwan', code: '+886', flagCode: 'tw' },
    { name: 'Tajikistan', code: '+992', flagCode: 'tj' },
    { name: 'Tanzania', code: '+255', flagCode: 'tz' },
    { name: 'Thailand', code: '+66', flagCode: 'th' },
    { name: 'Togo', code: '+228', flagCode: 'tg' },
    { name: 'Tunisia', code: '+216', flagCode: 'tn' },
    { name: 'Turkey', code: '+90', flagCode: 'tr' },
    { name: 'Turkmenistan', code: '+993', flagCode: 'tm' },
    { name: 'Uganda', code: '+256', flagCode: 'ug' },
    { name: 'Ukraine', code: '+380', flagCode: 'ua' },
    { name: 'UAE', code: '+971', flagCode: 'ae' },
    { name: 'Uruguay', code: '+598', flagCode: 'uy' },
    { name: 'Uzbekistan', code: '+998', flagCode: 'uz' },
    { name: 'Venezuela', code: '+58', flagCode: 've' },
    { name: 'Vietnam', code: '+84', flagCode: 'vn' },
    { name: 'Yemen', code: '+967', flagCode: 'ye' },
    { name: 'Zambia', code: '+260', flagCode: 'zm' },
    { name: 'Zimbabwe', code: '+263', flagCode: 'zw' }
];

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+880');
    const [showCountryList, setShowCountryList] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Load saved phone and country code on mount
    useEffect(() => {
        const savedPhone = localStorage.getItem('remembered_phone');
        const savedCountry = localStorage.getItem('remembered_country');
        if (savedPhone) {
            setPhone(savedPhone);
        }
        if (savedCountry) {
            setCountryCode(savedCountry);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // [NEW] Format Phone Payload to include country code (stripped of leading zeros)
            const formattedPhone = `${countryCode}${phone.replace(/^0+/, '')}`;

            const res = await api.post('/auth/login', { phone: formattedPhone, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            // Save phone and country for automatic pre-fill next time
            localStorage.setItem('remembered_phone', phone);
            localStorage.setItem('remembered_country', countryCode);

            const adminRoles = ['admin', 'super_admin', 'employee_admin'];

            if (adminRoles.includes(res.data.user.role)) {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-[#0A2540] relative font-sans text-slate-100 overflow-y-auto custom-scrollbar">
            {/* Background Decoration */}
            {/* American Flag Background (Abstract / Vibe) */}
            {/* Background Decoration - Reference Image */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1080"
                    alt="USA Flag Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-100"
                />
                {/* Overlay to ensure text readability */}
                <div className="absolute inset-0 bg-[#0A2540]/30 mix-blend-multiply"></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 pt-12 pb-6">

                {/* Logo Section */}
                <div className="mb-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#0A2540] to-[#EF4444] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <img src="/logo.png" className="relative w-28 h-28 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" alt="USA Affiliate" />
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight mt-6 text-transparent bg-clip-text bg-gradient-to-r from-[#0A2540] to-[#EF4444]">
                        USA Affiliate
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm font-semibold tracking-wide flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Decentralized Node Network
                    </p>
                </div>

                {/* Glass Login Card with Flag Theme Borders */}
                <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(10,37,64,0.5)] animate-in slide-in-from-bottom-5 duration-700 relative overflow-hidden">

                    {/* Top Red Line for "Flag" accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#EF4444]"></div>

                    <h2 className="text-2xl font-black mb-8 text-center text-white drop-shadow-md">Access Terminal</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center border border-red-100 shadow-sm">
                            <span className="bg-red-100 p-1 rounded-full mr-2">🚫</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-300 ml-1">Phone Number</label>
                            <div className="flex gap-2">
                                <div className="relative w-[35%]">
                                    <button
                                        type="button"
                                        onClick={() => setShowCountryList(!showCountryList)}
                                        className="w-full h-[52px] bg-black/40 border border-white/20 rounded-xl px-4 text-white font-medium flex items-center justify-between gap-2 hover:bg-black/60 hover:border-white/40 focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-all outline-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://flagcdn.com/w40/${countries.find(c => c.code === countryCode)?.flagCode || 'bd'}.png`}
                                                alt="flag"
                                                className="w-6 h-4 rounded-sm object-cover shadow-sm"
                                            />
                                            <span className="text-sm font-bold tracking-wide">{countryCode}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCountryList ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showCountryList && (
                                        <div className="absolute z-[100] top-[calc(100%+8px)] left-0 w-64 bg-[#0A2540] border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {countries.map(c => (
                                                    <div
                                                        key={c.name}
                                                        onClick={() => {
                                                            setCountryCode(c.code);
                                                            setShowCountryList(false);
                                                        }}
                                                        className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                                                    >
                                                        <img src={`https://flagcdn.com/w40/${c.flagCode}.png`} alt={c.name} className="w-6 h-4 rounded-sm shadow-sm object-cover" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-white">{c.name}</p>
                                                        </div>
                                                        <p className="text-xs font-mono font-medium text-slate-400">{c.code}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        className="w-full h-[52px] bg-black/40 border border-white/20 rounded-xl pl-11 pr-4 text-white placeholder-slate-500 font-medium hover:bg-black/60 hover:border-white/40 focus:bg-black/60 focus:border-white/60 focus:ring-1 focus:ring-white/60 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password Field with Eye Toggle within the form */}
                        <div className="relative">
                            <AuthInput
                                icon={Lock}
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-[38px] text-slate-400 hover:text-white transition cursor-pointer"
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                loading={loading}
                                className="w-full text-base py-4 placeholder-opacity-50"
                            >
                                LOGIN
                            </Button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => toast("Please contact Customer Support.", { icon: 'ℹ️' })}
                                className="text-slate-400 text-xs hover:text-[#0056D2] transition font-medium underline underline-offset-4"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                    <p className="text-slate-400 font-medium">New to USA Affiliate?</p>
                    <Link href="/register" className="group flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all hover:scale-105 active:scale-95">
                        <UserPlus className="w-6 h-6" />
                        <span>CREATE NEW ACCOUNT</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>

            </div>
        </div>
    );
}
