import React, { useState } from 'react';
import { gameState } from '../core/GameState';
import { SKILLS } from '../data/skills';
import { Bug, ChevronDown, ChevronUp, Zap, Coins, Skull, Sparkles, RefreshCw } from 'lucide-react';

interface DebugPanelProps {
  onSkipWave: (wave: number) => void;
  onTriggerNuke: () => void;
  onSpawnGates?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ onSkipWave, onTriggerNuke, onSpawnGates }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-16 right-3 z-50 flex flex-col items-end text-xs select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 backdrop-blur-md transition-colors cursor-pointer shadow"
      >
        <Bug className="h-3.5 w-3.5 text-amber-400" />
        <span className="font-bold text-[10px]">DEBUG</span>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="mt-1.5 flex flex-col gap-1.5 rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-white backdrop-blur-lg shadow-2xl w-60 animate-fade-in">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            QA 调试控制台 (DEBUG TOOL)
          </div>

          {/* Jump Waves */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">快速跳关:</span>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                <button
                  key={w}
                  onClick={() => onSkipWave(w)}
                  className={`rounded py-0.5 text-[10px] font-bold border ${w === 8 ? 'border-rose-600 bg-rose-950/70 text-rose-300' : 'border-slate-800 bg-slate-900 hover:bg-slate-850'}`}
                >
                  {w === 8 ? 'Boss' : `W${w}`}
                </button>
              ))}
            </div>
          </div>

          {/* Cheats */}
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[10px] text-slate-400">资源注入:</span>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => gameState.addGold(500)}
                className="flex items-center justify-center gap-1 rounded border border-slate-800 bg-slate-900 py-1 text-[10px] font-bold text-amber-300 hover:bg-slate-800"
              >
                <Coins className="h-3 w-3" /> +500 Gold
              </button>

              <button
                onClick={() => {
                  gameState.addXp(100);
                }}
                className="flex items-center justify-center gap-1 rounded border border-slate-800 bg-slate-900 py-1 text-[10px] font-bold text-purple-300 hover:bg-slate-800 cursor-pointer"
              >
                <Zap className="h-3 w-3" /> +100XP (无暂停门)
              </button>
            </div>
          </div>

          {/* Nuke & Combo */}
          <div className="grid grid-cols-2 gap-1 mt-0.5">
            <button
              onClick={onTriggerNuke}
              className="flex items-center justify-center gap-1 rounded border border-rose-800 bg-rose-950/70 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-900/80"
            >
              <Sparkles className="h-3 w-3" /> 试放核爆
            </button>

            <button
              onClick={() => {
                for (let i = 0; i < 20; i++) gameState.registerHit();
              }}
              className="flex items-center justify-center gap-1 rounded border border-amber-800 bg-amber-950/70 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-900/80"
            >
              +20 连击
            </button>
          </div>

          {/* Test Falling Gates */}
          {onSpawnGates && (
            <button
              onClick={onSpawnGates}
              className="mt-0.5 flex items-center justify-center gap-1 rounded border border-amber-500/70 bg-amber-950/80 py-1 text-[10px] font-black text-amber-300 hover:bg-amber-900 shadow-sm"
            >
              🎁 测试掉落3等分宝箱门 (Continuous Gates)
            </button>
          )}

          {/* Add all synergies cheat */}
          <button
            onClick={() => {
              gameState.applySkill('multiShot');
              gameState.applySkill('lightning');
              gameState.applySkill('fire');
              gameState.applySkill('explosion');
              gameState.applySkill('rapidFire');
              gameState.applySkill('damageUp');
              gameState.applySkill('critical');
            }}
            className="mt-1 flex items-center justify-center gap-1 rounded border border-sky-600 bg-sky-950 py-1 text-[10px] font-black text-sky-300 hover:bg-sky-900"
          >
            <RefreshCw className="h-3 w-3" /> 注入核心技能组合
          </button>

          {/* Quick Skill Activator */}
          <div className="flex flex-col gap-1 mt-1 border-t border-slate-800 pt-1.5">
            <span className="text-[10px] text-slate-400">单项技能实机测试:</span>
            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => gameState.applySkill('satellite')} className="rounded bg-slate-900 border border-slate-800 py-0.5 text-[9px] font-semibold hover:border-sky-500 text-sky-300 cursor-pointer">环绕卫星</button>
              <button onClick={() => gameState.applySkill('drone')} className="rounded bg-slate-900 border border-slate-800 py-0.5 text-[9px] font-semibold hover:border-purple-500 text-purple-300 cursor-pointer">自律战机</button>
              <button onClick={() => gameState.applySkill('laser')} className="rounded bg-slate-900 border border-slate-800 py-0.5 text-[9px] font-semibold hover:border-violet-500 text-violet-300 cursor-pointer">轨道死光</button>
              <button onClick={() => gameState.applySkill('damageUp')} className="rounded bg-slate-900 border border-slate-800 py-0.5 text-[9px] font-semibold hover:border-amber-500 text-amber-300 cursor-pointer">高能聚合</button>
              <button onClick={() => gameState.applySkill('ricochet')} className="rounded bg-slate-900 border border-slate-800 py-0.5 text-[9px] font-semibold hover:border-emerald-500 text-emerald-300 cursor-pointer">弹射跳弹</button>
              <button onClick={() => gameState.applySkill('scatter')} className="rounded bg-slate-900 border border-slate-800 py-0.5 text-[9px] font-semibold hover:border-orange-500 text-orange-300 cursor-pointer">破片散射</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
