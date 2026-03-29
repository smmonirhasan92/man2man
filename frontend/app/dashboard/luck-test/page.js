import LuckTestClient from '../../../components/gamification/LuckTestClient';

export const metadata = {
  title: 'Luck Test - Win Real Money',
  description: 'Spin to win dynamic prizes up to 50 cents instantly to your wallet.',
};

export default function LuckTestPage() {
  return (
    <div className="min-h-screen bg-slate-900 overflow-y-auto pb-24">
      {/* Mobile Top Header (Optional aesthetic touch) */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md z-50 px-4 py-3 flex items-center justify-between border-b border-white/5">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">Rewards</h2>
      </div>

      <LuckTestClient />
    </div>
  );
}
