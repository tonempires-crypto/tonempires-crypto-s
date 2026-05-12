'use client';

import { motion } from 'motion/react';
import { Users, Copy, Share2, Award, Zap, Coins, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from 'react-i18next';

export default function ReferralSection({ userId }: { userId: string | number }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const referralLink = `https://t.me/TONEMPIRES_bot/play?startapp=${userId}`;

  useEffect(() => {
    async function fetchReferralData() {
      if (!userId) return;
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', userId);

        if (!error && count !== null) {
          setReferralCount(count);
        }
      } catch (err) {
        console.error("Error fetching referrals:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReferralData();
  }, [userId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `Join me in Ton Empires! Build your empire and earn TON. 🚀`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    // @ts-ignore
    window.Telegram?.WebApp?.openTelegramLink(shareUrl);
  };

  return (
    <div className="space-y-6 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="tech-card bg-gradient-to-br from-accent-cyan/10 to-transparent border-accent-cyan/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-accent-cyan" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight uppercase">{t('invite.hub')}</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{t('invite.expansion')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">{t('invite.unique_link')}:</span>
            <div className="flex gap-2">
              <input 
                readOnly 
                value={referralLink} 
                className="flex-1 bg-transparent border-none text-xs font-mono text-zinc-300 focus:ring-0 truncate"
              />
              <button 
                onClick={handleCopy}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <Copy className={`w-4 h-4 ${copied ? 'text-accent-cyan' : 'text-zinc-400'}`} />
              </button>
            </div>
          </div>

          <button 
            onClick={handleShare}
            className="w-full py-4 rounded-xl bg-accent-cyan text-black font-black uppercase text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,209,0.3)] active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            {t('invite.recruit_citizens')}
          </button>
        </div>
      </motion.div>

      {/* Rewards Description */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{t('invite.rewards')}</h3>
        <div className="grid gap-3">
          <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent-orange/10 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-accent-orange" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase italic">{t('invite.deposit_comm')}</div>
              <p className="text-[10px] text-zinc-500">{t('invite.deposit_comm_desc')}</p>
            </div>
          </div>
          
          <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase italic">{t('invite.yield_bonus')}</div>
              <p className="text-[10px] text-zinc-500">{t('invite.yield_bonus_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="bento-card p-4 space-y-2 bg-[#111114]">
          <div className="flex justify-between items-start">
            <Zap className="w-4 h-4 text-accent-orange" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('invite.status')}</span>
          </div>
          <div className="text-2xl font-black text-white italic">ELITE</div>
          <p className="text-[9px] text-zinc-500 leading-tight">Tier 1 Recruiter Status</p>
        </div>
        
        <div className="bento-card p-4 space-y-2 bg-[#111114]">
          <div className="flex justify-between items-start">
            <Award className="w-4 h-4 text-accent-cyan" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('invite.growth')}</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tighter">
            {loading ? '...' : `#${referralCount}`}
          </div>
          <p className="text-[9px] text-zinc-500 leading-tight">{t('invite.lineage')}</p>
        </div>
      </div>

      {/* Encouragement Banner */}
      <div className="p-4 bg-gradient-to-r from-accent-cyan/20 to-transparent rounded-2xl border border-accent-cyan/10 text-center">
        <p className="text-xs font-bold text-accent-cyan uppercase italic">{t('invite.thrives')}</p>
        <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">{t('invite.stronger')}</p>
      </div>
    </div>
  );
}
