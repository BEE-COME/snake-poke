import React from 'react';
import { gameState } from '../core/GameState';
import { SKILLS } from '../data/skills';
import { sounds } from '../audio/SoundSystem';
import { RotateCcw, Skull, Trophy, Coins, Flame } from 'lucide-react';

interface GameOverModalProps {
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart }) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    sounds.playUI();
    onRestart();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="flex flex-col items-center max-w-[360px] w-full rounded-3xl border border-rose-900/60 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-5 text-center shadow-[0_0_50px_rgba(225,29,72,0.3)]">
        {/* Skull Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-600/50 bg-rose-950/60 text-rose-500 mb-3 shadow-lg shadow-rose-950/60">
          <Skull className="h-8 w-8" />
        </div>

        <h2 className="text-3xl md:text-4xl font-black tracking-wider text-white">
          GAME OVER
        </h2>
        <p className="text-xs font-bold text-rose-400 mt-1">
          蛇群突破了基地防御警戒线
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-5 w-full">
          <div className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-[10px] font-bold text-slate-400">到达波数</span>
            <span className="text-lg font-black text-sky-400 mt-0.5">第 {gameState.currentWave} 波</span>
          </div>

          <div className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-[10px] font-bold text-slate-400">存活时长</span>
            <span className="text-lg font-black text-white mt-0.5">{formatTime(gameState.gameDuration)}</span>
          </div>

          <div className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-[10px] font-bold text-slate-400">击破蛇节</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5">{gameState.kills}</span>
          </div>

          <div className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
            <span className="text-[10px] font-bold text-slate-400">最高连击</span>
            <span className="text-lg font-black text-amber-400 mt-0.5">{gameState.maxCombo}x</span>
          </div>
        </div>

        {/* Score & Gold */}
        <div className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 mb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Trophy className="h-4 w-4 text-slate-400" />
            <span>积分: <strong className="text-white text-sm">{gameState.score.toLocaleString()}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Coins className="h-4 w-4" />
            <span>获得金币: <strong className="text-sm">+{gameState.gold}</strong></span>
          </div>
        </div>

        {/* Active Build */}
        {gameState.activeSkills.size > 0 && (
          <div className="w-full mb-5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">作战 Build 记录</div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {Array.from(gameState.activeSkills.entries()).map(([id, lvl]) => {
                const s = SKILLS.find(x => x.id === id);
                if (!s) return null;
                return (
                  <div key={id} className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300">
                    <span>{s.icon}</span>
                    <span>LV.{lvl}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500 bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-3.5 text-sm font-black tracking-widest text-white shadow-lg shadow-rose-600/40 hover:from-rose-500 hover:to-rose-400 active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>再来一局</span>
        </button>
      </div>
    </div>
  );
};
