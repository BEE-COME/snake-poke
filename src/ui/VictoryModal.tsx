import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { gameState } from '../core/GameState';
import { SKILLS } from '../data/skills';
import { sounds } from '../audio/SoundSystem';
import { RotateCcw, Trophy, Coins, Award, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ onRestart }) => {
  useEffect(() => {
    // Fire festive fireworks
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getRank = () => {
    if (gameState.score >= 16000 || gameState.maxCombo >= 40) return { rank: 'S', color: 'text-amber-400 border-amber-400 bg-amber-950/60' };
    if (gameState.score >= 10000) return { rank: 'A', color: 'text-purple-400 border-purple-400 bg-purple-950/60' };
    return { rank: 'B', color: 'text-sky-400 border-sky-400 bg-sky-950/60' };
  };

  const rankInfo = getRank();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="flex flex-col items-center max-w-[360px] w-full rounded-3xl border border-amber-500/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-5 text-center shadow-[0_0_60px_rgba(251,191,36,0.4)]">
        {/* Victory Crown */}
        <div className="relative mb-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-amber-400 bg-amber-500/20 text-3xl shadow-lg shadow-amber-500/40">
            👑
          </div>
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-300 animate-spin" />
        </div>

        <h2 className="text-3xl md:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
          VICTORY!
        </h2>
        <p className="text-xs font-bold text-amber-400 mt-1">
          灭世巨蛇王已被歼灭 · 防线保卫成功
        </p>

        {/* Rank Badge */}
        <div className="my-4 flex items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black shadow-lg ${rankInfo.color}`}>
            {rankInfo.rank}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PERFORMANCE RATING</span>
            <span className="text-sm font-black text-white">作战评级：{rankInfo.rank} 级统帅</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4 w-full">
          <div className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-[10px] font-bold text-slate-400">通关时长</span>
            <span className="text-base font-black text-white mt-0.5">{formatTime(gameState.gameDuration)}</span>
          </div>

          <div className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-[10px] font-bold text-slate-400">总击杀蛇节</span>
            <span className="text-base font-black text-emerald-400 mt-0.5">{gameState.kills}</span>
          </div>

          <div className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-[10px] font-bold text-slate-400">最终积分</span>
            <span className="text-base font-black text-sky-400 mt-0.5">{gameState.score.toLocaleString()}</span>
          </div>

          <div className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-[10px] font-bold text-slate-400">战利品收益</span>
            <span className="text-base font-black text-amber-400 mt-0.5">+{gameState.gold} G</span>
          </div>
        </div>

        {/* Active Build Showcase */}
        {gameState.activeSkills.size > 0 && (
          <div className="w-full mb-5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">最终战备构筑</div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {Array.from(gameState.activeSkills.entries()).map(([id, lvl]) => {
                const s = SKILLS.find(x => x.id === id);
                if (!s) return null;
                return (
                  <div key={id} className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-slate-900 px-2 py-1 text-[11px] font-bold text-amber-300">
                    <span>{s.icon}</span>
                    <span>LV.{lvl}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Play Again Button */}
        <button
          onClick={() => {
            sounds.playUI();
            onRestart();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-sm font-black tracking-widest text-slate-950 shadow-lg shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>再战一局</span>
        </button>
      </div>
    </div>
  );
};
