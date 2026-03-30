import ScratchCardClient from '../../../components/gamification/ScratchCardClient';

export const metadata = {
  title: 'Scratch & Win - Real Money',
  description: 'Wipe away the silver foil to instantly win unpredictable NXS multipliers directly deposited into your wallet matrix.',
};

export default function ScratchCardPage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] overflow-y-auto pb-24 font-sans">
      <div className="sticky top-0 bg-[#0B0F1A]/80 backdrop-blur-md z-50 px-4 py-3 flex items-center justify-between border-b border-[#1E293B]">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Game Zone</h2>
      </div>

      <ScratchCardClient />
    </div>
  );
}
