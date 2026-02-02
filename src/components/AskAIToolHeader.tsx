'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  Wand2, 
  Zap 
} from 'lucide-react';

interface AskAIToolHeaderProps {
  title: string;
  modelBadge?: string;
  stats?: {
    isUnlimited: boolean;
    remainingCredits: number;
  } | null;
}

export default function AskAIToolHeader({ 
  title, 
  modelBadge,
  stats 
}: AskAIToolHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-[#00050a80] rounded-xl shadow-2xl">
      <div className="mx-auto px-6 h-16 flex items-center justify-between max-w-[2000px]">
        <div className="flex items-center gap-4">
          <Link href="/ask-ai">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
              <ArrowRight className="h-5 w-5 rotate-180" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              {title}
            </span>
            {modelBadge && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-mono">
                {modelBadge}
              </span>
            )}
          </h1>
        </div>

        <nav className="relative hidden lg:flex items-center gap-1 p-1.5 rounded-full">
          {[
            { name: 'الرئيسية', path: '/ask-ai', icon: Sparkles, color: 'text-purple-400' },
            { name: 'شات GPT', path: '/ask-ai/chat', icon: MessageSquare, color: 'text-blue-400' },
            { name: 'الميديا', path: '/ask-ai/media', icon: Wand2, color: 'text-pink-400' },
          ].map((item, idx) => (
            <Link 
              key={idx}
              href={item.path}
              className="group relative px-6 py-2.5 rounded-full text-sm font-bold text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/5 flex items-center gap-2 overflow-hidden"
            >
              <item.icon size={16} className={`transition-all duration-300 ${item.color} opacity-80 group-hover:opacity-100 group-hover:scale-110`} />
              <span className="relative z-10">{item.name}</span>
              {/* Interactive Sheen */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 shrink-0 justify-end">
          {stats ? (
            <div className="hidden lg:flex items-center gap-4 bg-purple-600/10 border border-purple-500/30 px-6 py-1 rounded-[50px] backdrop-blur-md whitespace-nowrap">
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">رصيد الكريديت</span>
                <span className="text-sm font-black text-purple-400">
                  {stats.isUnlimited ? 'غير محدود' : `${stats.remainingCredits.toLocaleString()} كريديت`}
                </span>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/20 animate-pulse">
                <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
              </div>
            </div>
          ) : (
            <p></p>
          )}
          <button 
            className="hidden lg:flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-6 py-2 rounded-[20px] transition-all whitespace-nowrap"
            onClick={() => router.push('/ask-ai/plans')}
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">ترقية الباقه</span>
          </button>
        </div>
      </div>
    </header>
  );
}
