'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  ExternalLink, 
  Twitter, 
  Youtube, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Hash, 
  Play, 
  Clock, 
  Trophy, 
  Gift,
  Video,
  Send,
  Users,
  MessageSquare,
  Zap,
  ChevronRight,
  AlertCircle,
  Crown,
  Wallet
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface TasksSectionProps {
  userData: any;
  resources: any;
  onResourcesUpdate: (newRes: any) => void;
}

export default function TasksSection({ userData, resources, onResourcesUpdate }: TasksSectionProps) {
  const { t } = useTranslation();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const DAILY_TASKS = [
    { id: 'retweet_x', title: t('tasks.retweet_x'), reward: '10 ALL', platform: 'X', icon: Twitter, link: 'https://x.com/Ton_Empires' },
    { id: 'react_tg', title: t('tasks.react_tg'), reward: '10 ALL', platform: 'Telegram', icon: Send, link: 'https://t.me/T0NEmpires' },
    { id: 'react_tiktok', title: t('tasks.react_tiktok'), reward: '10 ALL', platform: 'TikTok', icon: Video, link: 'https://www.tiktok.com/@tonempires' },
    { id: 'repost_insta', title: t('tasks.repost_insta'), reward: '10 ALL', platform: 'Instagram', icon: Instagram, link: 'https://www.instagram.com/tonempires/' },
    { id: 'react_wa', title: t('tasks.react_wa'), reward: '10 ALL', platform: 'WhatsApp', icon: MessageSquare, link: 'https://whatsapp.com/channel/0029Vb7cgucKrWQmo5dq8J2V' },
  ];

  const INTERACTIVE_TASKS = [
    { id: 'daily_login', title: t('tasks.daily_login'), reward: '5 WHT', platform: 'Empire', icon: Zap, link: '#' },
    { id: 'watch_briefing', title: t('tasks.briefing'), reward: '15 ALL', platform: 'YouTube', icon: Play, link: 'https://www.youtube.com/@TonEmpires' },
  ];

  const ONE_TIME_TASKS = [
    { id: 'join_empire', title: t('tasks.join_empire'), reward: '20 ALL', platform: 'Protocol', icon: Crown, link: '#' },
    { id: 'link_wallet', title: t('tasks.link_wallet'), reward: '50 ALL', platform: 'Vault', icon: Wallet, link: '#' },
    { id: 'invite_recruits', title: t('tasks.invite_recruits'), reward: '100 ALL', platform: 'Expansion', icon: Users, link: '#' },
    { id: 'join_discord', title: t('tasks.join_discord'), reward: '50 ALL', platform: 'Discord', icon: Hash, link: 'https://discord.gg/KH2mzsCAD' },
    { id: 'follow_youtube', title: t('tasks.follow_youtube'), reward: '30 ALL', platform: 'YouTube', icon: Youtube, link: 'https://www.youtube.com/@TonEmpires' },
    { id: 'follow_x', title: t('tasks.follow_x'), reward: '20 ALL', platform: 'X', icon: Twitter, link: 'https://x.com/Ton_Empires' },
    { id: 'follow_tg', title: t('tasks.follow_tg'), reward: '20 ALL', platform: 'Telegram', icon: Send, link: 'https://t.me/T0NEmpires' },
    { id: 'follow_tiktok', title: t('tasks.follow_tiktok'), reward: '20 ALL', platform: 'TikTok', icon: Video, link: 'https://www.tiktok.com/@tonempires' },
    { id: 'follow_insta', title: t('tasks.follow_insta'), reward: '20 ALL', platform: 'Instagram', icon: Instagram, link: 'https://www.instagram.com/tonempires/' },
  ];

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.telegram_id) {
      fetchTaskHistory();
    }
  }, [userData?.telegram_id]);

  const fetchTaskHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('task_id, completed_at')
        .eq('telegram_id', userData.telegram_id);
      
      let completed: string[] = [];

      if (!error && data) {
        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();

        completed = data.filter(t => {
          const isDaily = DAILY_TASKS.some(dt => dt.id === t.task_id) || INTERACTIVE_TASKS.some(it => it.id === t.task_id);
          if (!isDaily) return true;
          const completedAt = new Date(t.completed_at).getTime();
          return completedAt >= startOfToday;
        }).map(t => t.task_id);
      }

      // LocalStorage fallback/cache to prevent rapid re-claiming if DB is slow
      const localCache = localStorage.getItem(`tasks_${userData.telegram_id}`);
      if (localCache) {
        const parsed = JSON.parse(localCache);
        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
        
        Object.keys(parsed).forEach(tid => {
          if (!completed.includes(tid)) {
            const isDaily = DAILY_TASKS.some(dt => dt.id === tid) || INTERACTIVE_TASKS.some(it => it.id === tid);
            if (!isDaily) {
              completed.push(tid);
            } else if (parsed[tid] >= startOfToday) {
              completed.push(tid);
            }
          }
        });
      }
      
      setCompletedTasks(completed);
    } catch (e) {
      console.warn("Task history fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task: any) => {
    if (completedTasks.includes(task.id)) return;
    
    // Auto-verify Link Wallet
    if (task.id === 'link_wallet') {
      // Wallet check logic would go here, for now we let them claim if they try
    } else if (task.id !== 'daily_login') {
      if (task.link === '#' || task.link === 'soon') {
        alert("Tactical connection pending. This channel will open soon.");
        return;
      }
      window.open(task.link, '_blank');
    }

    setClaiming(task.id);
    
    // Simulate verification delay
    setTimeout(async () => {
      try {
        const isDaily = DAILY_TASKS.some(dt => dt.id === task.id) || INTERACTIVE_TASKS.some(it => it.id === task.id);
        const newRes = { ...resources };
        
        // Rewards logic
        if (isDaily) {
          if (task.reward.includes('WHT')) newRes.wheat = (newRes.wheat || 0) + parseInt(task.reward);
          else if (task.reward.includes('ALL')) {
             const amount = parseInt(task.reward) || 10;
             newRes.oil = (newRes.oil || 0) + amount;
             newRes.gold = (newRes.gold || 0) + amount;
             newRes.iron = (newRes.iron || 0) + amount;
             newRes.wheat = (newRes.wheat || 0) + amount;
          }
        } else {
          const amount = parseInt(task.reward) || 10;
          newRes.oil = (newRes.oil || 0) + amount;
          newRes.gold = (newRes.gold || 0) + amount;
          newRes.iron = (newRes.iron || 0) + amount;
          newRes.wheat = (newRes.wheat || 0) + amount;
        }

        // 1. Update Resources
        const { error: resError } = await supabase
          .from('user_resources')
          .update({
            oil: newRes.oil,
            gold: newRes.gold,
            iron: newRes.iron,
            wheat: newRes.wheat
          })
          .eq('telegram_id', userData.telegram_id);

        if (resError) throw resError;

        // 2. Track Completion
        const timestamp = new Date().toISOString();
        const { error: taskError } = await supabase
          .from('user_tasks')
          .upsert({
            telegram_id: userData.telegram_id,
            task_id: task.id,
            completed_at: timestamp
          }, { onConflict: 'telegram_id,task_id' });

        if (taskError) {
          console.error("Task log failed:", taskError);
        }

        // Update local cache
        const localCache = JSON.parse(localStorage.getItem(`tasks_${userData.telegram_id}`) || '{}');
        localCache[task.id] = new Date().getTime();
        localStorage.setItem(`tasks_${userData.telegram_id}`, JSON.stringify(localCache));

        setCompletedTasks(prev => [...prev, task.id]);
        onResourcesUpdate(newRes);
        
        // Haptic feedback
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
          (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

      } catch (e) {
        console.error("Task Completion Error", e);
      } finally {
        setClaiming(null);
      }
    }, 2000); // 2 second "verification" simulation
  };

  const renderTask = (task: any, index: number) => {
    const isCompleted = completedTasks.includes(task.id);
    const isClaiming = claiming === task.id;

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => handleTaskClick(task)}
        className={`tech-card flex items-center justify-between p-4 group transition-all relative overflow-hidden ${
          isCompleted ? 'opacity-50 grayscale pointer-events-none' : 'hover:border-accent-cyan/40 cursor-pointer active:scale-[0.98]'
        }`}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className={`w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center transition-colors ${
            isCompleted ? 'text-zinc-600' : 'text-accent-cyan group-hover:text-accent-cyan/80'
          }`}>
            <task.icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-tight">{task.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-zinc-500 uppercase">{task.platform}</span>
              <span className="text-[9px] font-mono text-accent-orange font-bold">+{task.reward}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : isClaiming ? (
            <div className="w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-accent-cyan transition-colors" />
          )}
        </div>
        
        {/* Background Highlight on hover */}
        {!isCompleted && (
          <div className="absolute inset-0 bg-accent-cyan/0 group-hover:bg-accent-cyan/5 transition-colors" />
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">{t('tasks.hub')}</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{t('tasks.rewards')}</p>
        </div>
        <div className="px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg flex items-center gap-2">
          <Zap className="w-3 h-3 text-accent-cyan animate-pulse" />
          <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-tighter">{t('tasks.online')}</span>
        </div>
      </div>

      {/* Interactive Tasks */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Play className="w-3 h-3 text-accent-orange" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('tasks.interactive')}</h3>
        </div>
        <div className="space-y-2">
          {INTERACTIVE_TASKS.map((task, i) => renderTask(task, i))}
        </div>
      </section>

      {/* Daily Tasks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-accent-cyan" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('tasks.daily')}</h3>
          </div>
          <span className="text-[8px] font-mono text-zinc-600 uppercase">{t('tasks.resets')}</span>
        </div>
        <div className="space-y-2">
          {DAILY_TASKS.map((task, i) => renderTask(task, i))}
        </div>
      </section>

      {/* One-time Tasks */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Trophy className="w-3 h-3 text-accent-gold text-yellow-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('tasks.milestones')}</h3>
        </div>
        <div className="space-y-2">
          {ONE_TIME_TASKS.map((task, i) => renderTask(task, i))}
        </div>
      </section>

      <div className="tech-card p-6 bg-zinc-900/40 border-white/5 flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 rounded-full bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
          <Gift className="w-6 h-6 text-accent-cyan" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase mb-1">{t('tasks.loyalty_protocol')}</h4>
          <p className="text-[9px] font-mono text-zinc-500 uppercase leading-relaxed">
            {t('tasks.loyalty_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
