import React, { useState, useEffect } from 'react';
import { SkillDefinition, SkillRarity } from '../types/game';
import { gameState } from '../core/GameState';
import { SYNERGIES } from '../data/skills';
import { sounds } from '../audio/SoundSystem';
import { Sparkles, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface UpgradeModalProps {
  options: SkillDefinition[];
  title?: string;
  subtitle?: string;
  onSelected: (skillId: string) => void;
}

const RARITY_STYLES: Record<SkillRarity, {
  border: string;
  bg: string;
  badge: string;
  glow: string;
  nameColor: string;
}> = {
  COMMON: {
    border: 'border-cyan-500/40 hover:border-cyan-400',
    bg: 'bg-slate-900/95',
    badge: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80',
    glow: 'shadow-cyan-950/40',
    nameColor: 'text-cyan-200'
  },
  RARE: {
    border: 'border-blue-500/50 hover:border-blue-400',
    bg: 'bg-slate-900/95',
    badge: 'bg-blue-950/80 text-blue-400 border-blue-800/80',
    glow: 'shadow-blue-950/40',
    nameColor: 'text-blue-200'
  },
  EPIC: {
    border: 'border-purple-500/60 hover:border-purple-400',
    bg: 'bg-slate-900/95',
    badge: 'bg-purple-950/80 text-purple-300 border-purple-700/80',
    glow: 'shadow-purple-950/40',
    nameColor: 'text-purple-200'
  },
  LEGENDARY: {
    border: 'border-amber-400 hover:border-amber-300',
    bg: 'bg-gradient-to-b from-slate-900 via-amber-950/30 to-slate-900',
    badge: 'bg-amber-950/90 text-amber-300 border-amber-600/90',
    glow: 'shadow-amber-950/50',
    nameColor: 'text-amber-200'
  }
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  options: initialOptions,
  title = '挑选战术模组',
  subtitle = '提升武器威力或构筑强力羁绊',
  onSelected
}) => {
  const [currentOptions, setCurrentOptions] = useState<SkillDefinition[]>(initialOptions);
  const [hasRerolled, setHasRerolled] = useState(false);

  useEffect(() => {
    setCurrentOptions(initialOptions);
    setHasRerolled(false);
  }, [initialOptions]);

  const handleSelect = (skill: SkillDefinition) => {
    sounds.playUI();
    gameState.applySkill(skill.id);
    onSelected(skill.id);
  };

  const handleReroll = () => {
    if (gameState.gold >= 20 && !hasRerolled) {
      sounds.playCoin();
      gameState.gold -= 20;
      setHasRerolled(true);
      setCurrentOptions(gameState.generateUpgradeChoices());
    }
  };

  const getSynergyNotice = (skill: SkillDefinition) => {
    for (const syn of SYNERGIES) {
      if (syn.requiredSkills.includes(skill.id)) {
        const otherSkillId = syn.requiredSkills.find(id => id !== skill.id);
        if (otherSkillId && (gameState.activeSkills.get(otherSkillId) || 0) > 0) {
          return syn;
        }
      }
    }
    return null;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="flex flex-col items-center max-w-[390px] w-full my-auto">
        {/* Title Header */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-950/70 px-3 py-0.5 text-[11px] font-black tracking-wider text-sky-400 mb-1">
            <Sparkles className="h-3 w-3" />
            <span>LEVEL UPGRADE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow">
            {title}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* 3 Compact Vertical Skill Cards */}
        <div className="flex flex-col gap-2.5 w-full">
          {currentOptions.map((skill) => {
            const currentLevel = gameState.activeSkills.get(skill.id) || 0;
            const nextLevel = currentLevel + 1;
            const effect = skill.levels[nextLevel - 1];
            const style = RARITY_STYLES[skill.rarity];
            const synergy = getSynergyNotice(skill);

            return (
              <button
                key={skill.id}
                onClick={() => handleSelect(skill)}
                className={`group relative flex items-center justify-between p-3 rounded-2xl border text-left cursor-pointer transition-all duration-150 active:scale-98 shadow-lg ${style.border} ${style.bg} ${style.glow}`}
              >
                <div className="flex items-start gap-2.5 flex-1 pr-2">
                  {/* Skill Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700 text-2xl shadow">
                    {skill.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-sm font-black tracking-wide ${style.nameColor}`}>
                        {skill.nameZh}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${style.badge}`}>
                        {skill.rarity}
                      </span>
                      <span className="text-[10px] font-bold text-sky-400 ml-auto">
                        {currentLevel === 0 ? '新模组' : `Lv.${currentLevel} → Lv.${nextLevel}`}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {effect?.description || skill.description}
                    </div>

                    {/* Synergy tag */}
                    {synergy && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-950/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                        <Zap className="h-2.5 w-2.5 text-amber-400" />
                        <span>激活【{synergy.nameZh}】羁绊</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-slate-800 text-slate-300 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Reroll Button (Mini-game staple) */}
        <div className="mt-3 flex items-center justify-between w-full px-1">
          <span className="text-[10px] text-slate-500">拥有金币: {gameState.gold} G</span>
          <button
            onClick={handleReroll}
            disabled={gameState.gold < 20 || hasRerolled}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
              gameState.gold >= 20 && !hasRerolled
                ? 'border-amber-500/50 bg-amber-950/80 text-amber-300 hover:bg-amber-900'
                : 'border-slate-800 bg-slate-900/60 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="h-3 w-3" />
            <span>重置选项 (20金币)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
