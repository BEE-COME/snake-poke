import React from 'react';
import { ChestReward } from '../types/game';
import { gameState } from '../core/GameState';
import { sounds } from '../audio/SoundSystem';
import { Coins, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface ChestModalProps {
  reward: ChestReward;
  onClaim: () => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({ reward, onClaim }) => {
  const handleClaim = () => {
    sounds.playCoin();
    // Add gold
    gameState.addGold(reward.gold);

    if (reward.riskEffect) {
      reward.riskEffect();
    }

    onClaim();
  };

  const isRisk = reward.rarity === 'RISK';
  const isEpic = reward.rarity === 'EPIC';
  const isRare = reward.rarity === 'RARE';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="flex flex-col items-center max-w-[360px] w-full rounded-3xl border border-amber-500/50 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-5 text-center shadow-[0_0_50px_rgba(245,158,11,0.35)]">
        {/* Animated Chest Icon */}
        <div className="relative mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-400/20 to-amber-600/30 text-4xl shadow-lg shadow-amber-500/40 animate-bounce">
            {isRisk ? '☣️' : isEpic ? '💎' : isRare ? '📦' : '👑'}
          </div>
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-300 animate-spin" />
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/60 px-3 py-1 text-[11px] font-black tracking-widest text-amber-400 uppercase mb-2">
          {reward.rarity} CHEST CRACKED!
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
          {reward.titleZh}
        </h2>
        <p className="text-xs text-slate-300 mt-1.5 max-w-xs leading-relaxed">
          {reward.description}
        </p>

        {/* Rewards Box */}
        <div className="my-5 flex w-full flex-col gap-2 rounded-xl bg-slate-900/80 border border-slate-800 p-3.5">
          <div className="flex items-center justify-between text-sm font-bold text-slate-300">
            <span>战利品金币</span>
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-base">
              <Coins className="h-4 w-4" />
              <span>+{reward.gold} GOLD</span>
            </div>
          </div>

          {reward.guaranteedRarity && (
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 pt-2 border-t border-slate-800/80">
              <span>技能品质保底</span>
              <span className="text-sky-400 font-black tracking-wider">
                {reward.guaranteedRarity}+
              </span>
            </div>
          )}

          {reward.riskPenalty && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 pt-2 border-t border-slate-800/80">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>高危代价：{reward.riskPenalty}</span>
            </div>
          )}
        </div>

        {/* Claim button */}
        <button
          onClick={handleClaim}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-black tracking-wider text-slate-950 shadow-lg shadow-amber-500/40 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all cursor-pointer"
        >
          <span>领取战备升级</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
