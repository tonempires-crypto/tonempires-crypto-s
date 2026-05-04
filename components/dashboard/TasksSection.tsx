'use client';

import { motion } from 'motion/react';
import { CheckCircle2, Bookmark, ExternalLink, MessageCircle, Twitter, Globe, Zap } from 'lucide-react';

const TASKS = [
  { id: 1, title: 'Join Imperial Dispatch', reward: '500 OIL', icon: MessageCircle, color: 'text-blue-400', completed: true },
  { id: 2, title: 'Follow Ministry on X', reward: '200 GLD', icon: Twitter, color: 'text-zinc-200', completed: false },
  { id: 3, title: 'Daily Logistics Check', reward: '100 IRN', icon: CheckCircle2, color: 'text-emerald-400', completed: false },
  { id: 4, title: 'Imperial Website Visit', reward: '50 WHT', icon: Globe, color: 'text-purple-400', completed: false },
];

export default function TasksSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Imperial Tasks</h2>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Earn Resources for Loyalty</p>
        </div>
        <div className="px-3 py-1 bg-accent-orange/20 border border-accent-orange/30 rounded-lg flex items-center gap-2">
          <Zap className="w-3 h-3 text-accent-orange" />
          <span className="text-[10px] font-bold text-accent-orange">2.4x BOOST</span>
        </div>
      </div>

      <div className="space-y-3">
        {TASKS.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`tech-card flex items-center justify-between p-4 ${task.completed ? 'opacity-60 grayscale' : 'hover:border-accent-cyan/40 transition-all cursor-pointer'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center ${task.color}`}>
                <task.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{task.title}</h3>
                <span className="text-[10px] font-mono text-accent-cyan uppercase font-bold">+{task.reward}</span>
              </div>
            </div>
            
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <ExternalLink className="w-4 h-4 text-zinc-600" />
            )}
          </motion.div>
        ))}
      </div>

      <button className="w-full py-4 rounded-xl border border-dashed border-zinc-700 text-zinc-500 text-[10px] font-mono uppercase hover:border-zinc-500 transition-all group">
        <span className="group-hover:text-zinc-300 transition-colors">Synchronization pending... more tasks at 00:00 GMT</span>
      </button>
    </div>
  );
}
