import React, { useState } from 'react';
import { gameState } from '../core/GameState';
import { sounds } from '../audio/SoundSystem';
import { Coins, Heart, Shield, ArrowRight, Zap, Check, Sparkles } from 'lucide-react';

interface ShopModalProps {
  onContinue: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ onContinue }) => {
  const [, setTick] = useState(0);
  const [boughtItems, setBoughtItems] = useState<Set<number>>(new Set());

  const shopItems = [
    {
      id: 1,
      name: '紧急纳米修护',
      desc: '恢复炮台 100% 生命值',
      cost: 60,
      icon: <Heart className="h-5 w-5 text-emerald-400" />,
      action: () => {
        gameState.stats.hp = gameState.stats.maxHp;
        gameState.notify();
      }
    },
    {
      id: 2,
      name: '护盾发生器扩容',
      desc: '护盾上限 +60 点，并立即充满',
      cost: 80,
      icon: <Shield className="h-5 w-5 text-cyan-400" />,
      action: () => {
        gameState.stats.maxShield += 60;
        gameState.stats.shield = gameState.stats.maxShield;
        gameState.notify();
      }
    },
    {
      id: 3,
      name: '随机模组升级',
      desc: '已有技能中随机挑选一项等级 +1',
      cost: 110,
      icon: <Zap className="h-5 w-5 text-amber-400" />,
      action: () => {
        const active = Array.from(gameState.activeSkills.keys());
        if (active.length > 0) {
          const randomSkill = active[Math.floor(Math.random() * active.length)];
          gameState.applySkill(randomSkill);
        } else {
          gameState.applySkill('multiShot');
        }
      }
    },
    {
      id: 4,
      name: '战术核武充能',
      desc: '解锁或缩短战术核武冷却 3 秒',
      cost: 140,
      icon: <Sparkles className="h-5 w-5 text-rose-400" />,
      action: () => {
        gameState.applySkill('nuke');
      }
    }
  ];

  const handleBuy = (item: typeof shopItems[0]) => {
    if (gameState.gold >= item.cost && !boughtItems.has(item.id)) {
      sounds.playCoin();
      gameState.gold -= item.cost;
      item.action();
      setBoughtItems(prev => new Set(prev).add(item.id));
      setTick(t => t + 1);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="flex flex-col items-center max-w-[380px] w-full rounded-3xl border border-slate-700 bg-slate-900/95 p-4 sm:p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between w-full pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black tracking-widest text-sky-400 uppercase">FIELD ARMORY</span>
            <h2 className="text-lg font-black text-white">前线军需补给站</h2>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/60 px-2.5 py-1 text-xs font-black text-amber-400">
            <Coins className="h-3.5 w-3.5" />
            <span>{gameState.gold} G</span>
          </div>
        </div>

        {/* 4 Shop items list */}
        <div className="flex flex-col gap-2 my-3.5 w-full">
          {shopItems.map((item) => {
            const bought = boughtItems.has(item.id);
            const canAfford = gameState.gold >= item.cost;

            return (
              <button
                key={item.id}
                disabled={bought || !canAfford}
                onClick={() => handleBuy(item)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                  bought
                    ? 'border-slate-800 bg-slate-950/50 opacity-50 cursor-not-allowed'
                    : canAfford
                    ? 'border-slate-700 bg-slate-800/80 hover:border-sky-500 hover:bg-slate-800 cursor-pointer shadow-sm active:scale-98'
                    : 'border-slate-800/60 bg-slate-900/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-700">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{item.desc}</div>
                  </div>
                </div>

                <div className="ml-2 shrink-0 flex items-center">
                  {bought ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> 已购
                    </span>
                  ) : (
                    <span className={`text-xs font-black ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                      {item.cost} G
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={() => {
            sounds.playUI();
            onContinue();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400 bg-sky-500 px-5 py-3 text-sm font-black tracking-wider text-slate-950 shadow-lg shadow-sky-500/30 hover:bg-sky-400 active:scale-95 transition-all cursor-pointer"
        >
          <span>整备完毕 · 继续迎战下一波</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
