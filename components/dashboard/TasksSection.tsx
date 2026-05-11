'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  MessageSquare,
  Zap,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface TasksSectionProps {
  userData: any;
  resources: any;
  onResourcesUpdate: (newRes: any) => void;
}

const DAILY_TASKS = [
  { id: 'retweet_x', title: 'Retweet latest tweet on X', reward: '5 WHT', platform: 'X', icon: Twitter, link: 'https://x.com/Ton_Empires' },
  { id: 'react_tg', title: 'React the latest post on Telegram', reward: '5 WHT', platform: 'Telegram', icon: Send, link: 'https://t.me/T0NEmpires' },
  { id: 'react_tiktok', title: 'React the latest post on TikTok', reward: '5 WHT', platform: 'TikTok', icon: Video, link: 'https://www.tiktok.com/@tonempires' },
  { id: 'repost_insta', title: 'Repost the latest post on Instagram', reward: '5 WHT', platform: 'Instagram', icon: Instagram, link: 'https://www.instagram.com/tonempires/' },
  { id: 'react_fb', title: 'React the latest Facebook post', reward: '5 WHT', platform: 'Facebook', icon: Facebook, link: 'https://www.facebook.com/profile.php?id=61589243985940' },
  { id: 'react_wa', title: 'React the latest WhatsApp post', reward: '5 WHT', platform: 'WhatsApp', icon: MessageSquare, link: 'https://whatsapp.com/channel/0029Vb7cgucKrWQmo5dq8J2V' },
];

const ONE_TIME_TASKS = [
  { id: 'follow_x', title: 'Follow X', reward: '10 ALL', platform: 'X', icon: Twitter, link: 'https://x.com/Ton_Empires' },
  { id: 'follow_tg', title: 'Follow Telegram', reward: '10 ALL', platform: 'Telegram', icon: Send, link: 'https://t.me/T0NEmpires' },
  { id: 'follow_tiktok', title: 'Follow TikTok', reward: '10 ALL', platform: 'TikTok', icon: Video, link: 'https://www.tiktok.com/@tonempires' },
  { id: 'follow_youtube', title: 'Follow YouTube', reward: '10 ALL', platform: 'YouTube', icon: Youtube, link: 'https://www.youtube.com/@TonEmpires' },
  { id: 'follow_insta', title: 'Follow Instagram', reward: '10 ALL', platform: 'Instagram', icon: Instagram, link: 'https://www.instagram.com/tonempires/' },
  { id: 'follow_fb', title: 'Follow Facebook', reward: '10 ALL', platform: 'Facebook', icon: Facebook, link: 'https://www.facebook.com/profile.php?id=61589243985940' },
  { id: 'follow_wa', title: 'Follow WhatsApp', reward: '10 ALL', platform: 'WhatsApp', icon: MessageSquare, link: 'https://whatsapp.com/channel/0029Vb7cgucKrWQmo5dq8J2V' },
  { id: 'join_discord', title: 'Join Discord', reward: '10 ALL', platform: 'Discord', icon: Hash, link: 'https://discord.gg/KH2mzsCAD' },
];

export default function TasksSection({ userData, resources, onResourcesUpdate }: TasksSectionProps) {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.telegram_id) {
      fetchTaskHistory();
    }
  }, [userData?.telegram_id]);

  const fetchTaskHistory = async () => {
    try {
      // Since we might not have a table yet, we'll try to fetch.
      // If result is empty or error, we fallback gracefully.
      const { data, error } = await supabase
        .from('user_tasks')
        .select('task_id, completed_at')
        .eq('telegram_id', userData.telegram_id);
      
      if (!error && data) {
        const active = data.filter(t => {
          const isDaily = DAILY_TASKS.some(dt => dt.id === t.task_id);
          if (!isDaily) return true;
          const completedAt = new Date(t.completed_at).getTime();
          return (Date.now() - completedAt) < 24 * 60 * 60 * 1000;
        }).map(t => t.task_id);
        
        setCompletedTasks(active);
      }
    } catch (e) {
      console.warn("Task history fetch failed, table might be missing. Using session state.");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task: any) => {
    if (completedTasks.includes(task.id)) return;
    if (task.link === '#' || task.link === 'soon') {
      alert("Tactical connection pending. This channel will open soon.");
      return;
    }

    // Interactive step: User must follow link
    window.open(task.link, '_blank');

    setClaiming(task.id);
    
    // Simulate verification delay
    setTimeout(async () => {
      try {
        const isDaily = DAILY_TASKS.some(dt => dt.id === task.id);
        const newRes = { ...resources };
        
        if (isDaily) {
          newRes.wheat = (newRes.wheat || 0) + 5;
        } else {
          newRes.oil = (newRes.oil || 0) + 10;
          newRes.gold = (newRes.gold || 0) + 10;
          newRes.iron = (newRes.iron || 0) + 10;
          newRes.wheat = (newRes.wheat || 0) + 10;
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

        // 2. Track Completion (Silent fail if table missing, but update UI anyway)
        await supabase
          .from('user_tasks')
          .upsert({
            telegram_id: userData.telegram_id,
            task_id: task.id,
            completed_at: new Date().toISOString()
          }, { onConflict: 'telegram_id,task_id' });

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
          <h2 className="text-xl font-black uppercase tracking-tight">Mission Hub</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Imperial Loyalty Rewards</p>
        </div>
        <div className="px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg flex items-center gap-2">
          <Zap className="w-3 h-3 text-accent-cyan animate-pulse" />
          <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-tighter">Tasks Online</span>
        </div>
      </div>

      {/* Interactive Tasks */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Play className="w-3 h-3 text-accent-orange" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Interactive</h3>
        </div>
        <div className="tech-card p-4 border-accent-orange/20 bg-accent-orange/5 relative overflow-hidden group opacity-80 cursor-not-allowed">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-accent-orange">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-tight">Watch Tactical Briefing</h3>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Coming Soon (ADS)</span>
              </div>
            </div>
            <Clock className="w-4 h-4 text-accent-orange/30" />
          </div>
        </div>
      </section>

      {/* Daily Tasks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-accent-cyan" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Daily Objectives</h3>
          </div>
          <span className="text-[8px] font-mono text-zinc-600 uppercase">Resets every 24H</span>
        </div>
        <div className="space-y-2">
          {DAILY_TASKS.map((task, i) => renderTask(task, i))}
        </div>
      </section>

      {/* One-time Tasks */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Trophy className="w-3 h-3 text-accent-gold text-yellow-500" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Imperial Milestones</h3>
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
          <h4 className="text-xs font-bold uppercase mb-1">Loyalty Protocol</h4>
          <p className="text-[9px] font-mono text-zinc-500 uppercase leading-relaxed">
            Imperial tasks are manually verified by the Sovereign Node. Attempting to bypass verification may result in resource forfeiture.
          </p>
        </div>
      </div>
    </div>
  );
}
