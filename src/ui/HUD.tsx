import React, { useEffect, useState } from 'react';
import { gameState } from '../core/GameState';
import { SKILLS, SYNERGIES } from '../data/skills';
import { sounds } from '../audio/SoundSystem';
import { Volume2, VolumeX, Shield, Heart, Coins, Trophy, Zap, AlertTriangle, Sparkles, Flame } from 'lucide-react';

interface HUDProps {
  onPauseToggle?: () => void;
}

export const HUD: React.FC<HUDProps> = ({ onPauseToggle }) => {
  const [, setTick] = useState(0);
  const [muted, setMuted] = useState(sounds.getMuted());
  const [nukeCooldown, setNukeCooldown] = useState(0);

  useEffect(() => {
    return gameState.subscribe(() => {
      setTick(t => t + 1);
    });
  }, []);

  // Timer for tactical nuke button cooldown
  useEffect(() => {
    if (nukeCooldown <= 0) return;
    const timer = setInterval(() => {
      setNukeCooldown(c => Math.max(0, c - 0.2));
    }, 200);
    return () => clearInterval(timer);
  }, [nukeCooldown]);

  const stats = gameState.stats;
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const shieldPercent = stats.maxShield > 0 ? Math.max(0, Math.min(100, (stats.shield / stats.maxShield) * 100)) : 0;
  const bossPercent = gameState.bossMaxHp > 0 ? Math.max(0, Math.min(100, (gameState.bossHp / gameState.bossMaxHp) * 100)) : 0;

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setMuted(next);
  };

  const handleTriggerNuke = () => {
    if (nukeCooldown > 0) return;
    sounds.playNuke();
    gameState.applySkill('nuke');
    setNukeCooldown(12); // 12s tactical cooldown
  };

  const hasNuke = (gameState.activeSkills.get('nuke') || 0) > 0 || gameState.currentWave >= 3;

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-sans flex flex-col justify-between p-3 sm:p-4">
      {/* 1. TOP MINI-GAME STATUS HEADER */}
      <div className="flex w-full items-center justify-between pt-1 z-30">
        {/* Left: HP & Shield Capsule */}
        <div className="flex flex-col gap-1 min-w-[120px] max-w-[145px]">
          {/* HP Bar */}
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
            <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-900/90 border border-slate-700 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-200"
                style={{ width: `${hpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white tracking-wider drop-shadow">
                {Math.round(stats.hp)}/{stats.maxHp}
              </span>
            </div>
          </div>

          {/* Shield Bar (if active) */}
          {stats.maxShield > 0 && (
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-cyan-400 fill-cyan-400 shrink-0" />
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-900/90 border border-cyan-900/60 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-200"
                  style={{ width: `${shieldPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Level & EXP Bar */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex items-center gap-1 rounded bg-sky-950/85 border border-sky-500/50 px-1.5 py-0.5 shadow-sm shrink-0">
              <Sparkles className="h-2.5 w-2.5 text-sky-400" />
              <span className="text-[9px] font-black text-sky-300">
                Lv.{gameState.level}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-sky-900/60 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(0, (gameState.xp / gameState.maxXp) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Wave Badge */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-slate-950/85 px-3 py-0.5 backdrop-blur-md shadow-md">
            <span className="text-[11px] font-black tracking-wider text-sky-300">
              第 {gameState.currentWave}/{gameState.totalWaves} 波
            </span>
          </div>
          {/* Mini Wave progress line */}
          <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-900 border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-200"
              style={{ width: `${Math.round(gameState.waveProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Gold, Performance Mode & Sound Button */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/80 px-2.5 py-1 text-xs font-black text-amber-300 shadow">
            <span>💰</span>
            <span>{gameState.gold}</span>
          </div>

          <button
            onClick={() => gameState.togglePerformanceMode()}
            title={gameState.performanceMode ? '极速流畅模式已开启 (点击切换画质)' : '画质模式 (卡顿可点击开启极速流畅)'}
            className={`pointer-events-auto flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-black tracking-wider transition-all cursor-pointer shadow ${
              gameState.performanceMode
                ? 'border-emerald-500/80 bg-emerald-950/90 text-emerald-300 shadow-emerald-950/50'
                : 'border-slate-700 bg-slate-900/85 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className={`h-3 w-3 ${gameState.performanceMode ? 'text-emerald-400 fill-emerald-400' : 'text-slate-400'}`} />
            <span>{gameState.performanceMode ? '流畅' : '画质'}</span>
          </button>

          <button
            onClick={handleToggleSound}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900/85 text-slate-300 hover:text-white transition-colors cursor-pointer shadow"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* 2. BOSS HEALTH BAR (Top center overlay when boss is active) */}
      {gameState.bossMaxHp > 0 && gameState.bossHp > 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[90%] max-w-sm flex flex-col items-center animate-fade-in z-30">
          <div className="flex items-center justify-between w-full px-1 text-[11px] font-black tracking-wider text-rose-400">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-rose-500" />
              <span>灭世蛇王 · 场上 {gameState.bossOnScreenSegments} 节 (剩余 {gameState.bossRemainingSegments} 节)</span>
            </div>
            <span>
              {gameState.bossHp >= 1000000000
                ? (gameState.bossHp / 1000000000).toFixed(2) + 'B'
                : gameState.bossHp >= 1000000
                  ? (gameState.bossHp / 1000000).toFixed(2) + 'M'
                  : gameState.bossHp >= 10000
                    ? (gameState.bossHp / 1000).toFixed(1) + 'k'
                    : Math.round(gameState.bossHp)}
              /
              {gameState.bossMaxHp >= 1000000000
                ? (gameState.bossMaxHp / 1000000000).toFixed(2) + 'B'
                : gameState.bossMaxHp >= 1000000
                  ? (gameState.bossMaxHp / 1000000).toFixed(2) + 'M'
                  : gameState.bossMaxHp >= 10000
                    ? (gameState.bossMaxHp / 1000).toFixed(1) + 'k'
                    : gameState.bossMaxHp}
            </span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-950 border border-rose-600/70 p-0.5 shadow-lg shadow-rose-950/60">
            <div 
              className={`h-full rounded-full transition-all duration-150 ${gameState.bossPhase === 3 ? 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse' : 'bg-gradient-to-r from-rose-700 to-red-500'}`}
              style={{ width: `${bossPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. COMBO POPUP (Clean floating tag) */}
      {gameState.combo >= 4 && (
        <div className="absolute top-20 left-4 flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-950/90 px-3 py-1 text-xs font-black text-amber-300 backdrop-blur-md shadow-lg animate-bounce">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          <span>{gameState.combo} 连击暴击!</span>
        </div>
      )}

      {/* 4. TACTICAL NUKE ACTION BUTTON (Bottom Right) */}
      {hasNuke && (
        <div className="pointer-events-auto absolute bottom-20 right-3 z-30 flex flex-col items-center">
          <button
            onClick={handleTriggerNuke}
            disabled={nukeCooldown > 0}
            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all cursor-pointer shadow-xl ${
              nukeCooldown > 0 
                ? 'border-slate-700 bg-slate-900/90 text-slate-500 opacity-60' 
                : 'border-rose-500 bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-rose-600/40 hover:scale-105 active:scale-95 animate-pulse'
            }`}
          >
            <span className="text-2xl">☢️</span>
            {nukeCooldown > 0 && (
              <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/65 text-xs font-black text-rose-300">
                {Math.ceil(nukeCooldown)}s
              </span>
            )}
          </button>
          <span className="text-[9px] font-black text-rose-400 mt-1 drop-shadow">战术核爆</span>
        </div>
      )}

      {/* 5. BOTTOM BUILD DOCK & SYNERGIES */}
      <div className="flex flex-col items-center gap-1.5 w-full max-w-[360px] mx-auto z-20 pb-1">
        {/* Active Synergies Chips */}
        {gameState.activeSynergyIds.size > 0 && (
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {Array.from(gameState.activeSynergyIds).map(synId => {
              const syn = SYNERGIES.find(s => s.id === synId);
              if (!syn) return null;
              return (
                <div key={syn.id} className="flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-950/85 px-2.5 py-0.5 text-[10px] font-black text-amber-300 shadow">
                  <span>{syn.icon}</span>
                  <span>{syn.nameZh}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Active Skills Dock */}
        <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-700/70 bg-slate-950/85 px-3 py-1.5 backdrop-blur-md shadow-xl w-full">
          {gameState.activeSkills.size === 0 ? (
            <span className="text-[10px] text-amber-400/90 font-bold px-1 py-0.5">
              ✦ 优先击破蛇身黄金宝箱，获取技能 ✦
            </span>
          ) : (
            Array.from(gameState.activeSkills.entries()).slice(0, 7).map(([skillId, level]) => {
              const skill = SKILLS.find(s => s.id === skillId);
              if (!skill) return null;
              return (
                <div 
                  key={skillId} 
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 w-9 h-9 transition-transform"
                  title={`${skill.nameZh} LV.${level}`}
                >
                  <span className="text-sm leading-none">{skill.icon}</span>
                  <span className="text-[8px] font-black text-sky-300 mt-0.5 leading-none">L{level}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Gentle touch guidance hint */}
        <span className="text-[9px] text-slate-400/90 font-medium">
          左右滑动控制移动 · 靠近宝箱自动射击
        </span>
      </div>
    </div>
  );
};
