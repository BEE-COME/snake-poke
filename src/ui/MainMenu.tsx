import React, { useState } from 'react';
import { SaveSystem, MetaProgressionData } from '../core/SaveSystem';
import { SKILLS, SYNERGIES } from '../data/skills';
import { sounds } from '../audio/SoundSystem';
import { Play, Shield, Zap, BookOpen, Volume2, VolumeX, Trophy, Sparkles, X, Gift, CheckCircle2, ChevronRight } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
}

type UpgradeKey = 'baseDamageLevel' | 'baseShieldLevel' | 'goldBonusLevel' | 'chestLuckLevel';

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [saveData, setSaveData] = useState<MetaProgressionData>(SaveSystem.load());
  const [activeTab, setActiveTab] = useState<'BATTLE' | 'TALENT' | 'CODEX' | 'SUPPLY'>('BATTLE');
  const [showSupplyToast, setShowSupplyToast] = useState(false);
  const [codexTab, setCodexTab] = useState<'SKILLS' | 'SYNERGIES'>('SKILLS');
  const [muted, setMuted] = useState(sounds.getMuted());

  const handleStart = () => {
    sounds.playUI();
    onStartGame();
  };

  const handleBuyUpgrade = (key: UpgradeKey, cost: number) => {
    if (SaveSystem.buyUpgrade(key, cost)) {
      sounds.playCoin();
      setSaveData(SaveSystem.load());
    }
  };

  const handleClaimDailySupply = () => {
    sounds.playCoin();
    SaveSystem.addGold(120);
    setSaveData(SaveSystem.load());
    setShowSupplyToast(true);
    setTimeout(() => {
      setShowSupplyToast(false);
    }, 2400);
  };

  const metaUpgrades = [
    {
      key: 'baseDamageLevel' as const,
      name: '聚焦等离子核心',
      desc: '初始基础攻击伤害 +5%',
      level: saveData.upgrades.baseDamageLevel,
      cost: 50 + saveData.upgrades.baseDamageLevel * 35,
      icon: '⚡'
    },
    {
      key: 'baseShieldLevel' as const,
      name: '纳米护盾发生器',
      desc: '开局初始护盾上限 +20',
      level: saveData.upgrades.baseShieldLevel,
      cost: 40 + saveData.upgrades.baseShieldLevel * 30,
      icon: '🛡️'
    },
    {
      key: 'goldBonusLevel' as const,
      name: '高能金币磁吸',
      desc: '击破蛇身与宝箱金币 +10%',
      level: saveData.upgrades.goldBonusLevel,
      cost: 60 + saveData.upgrades.goldBonusLevel * 40,
      icon: '💰'
    },
    {
      key: 'chestLuckLevel' as const,
      name: '深空寻宝雷达',
      desc: '宝箱掉落高阶稀有模组概率 +3%',
      level: saveData.upgrades.chestLuckLevel,
      cost: 80 + saveData.upgrades.chestLuckLevel * 50,
      icon: '👑'
    }
  ];

  // Check if player can afford at least one upgrade (for notification dot)
  const canAffordAnyUpgrade = metaUpgrades.some(u => saveData.gold >= u.cost);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-5 select-none bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60 font-sans">
      {/* 1. TOP MINI-GAME STATUS BAR */}
      <div className="flex items-center justify-between w-full pt-1">
        {/* Left: Player Avatar & Level Capsule */}
        <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/85 px-3 py-1.5 backdrop-blur-md shadow-md">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 text-[11px] shadow">
            🤖
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white leading-tight">特战指挥官</span>
            <span className="text-[9px] font-bold text-sky-400 leading-tight">最高第 {saveData.maxWave} 波</span>
          </div>
        </div>

        {/* Right: Gold pill & Sound button */}
        <div className="flex items-center gap-2">
          {/* Gold Counter */}
          <button
            onClick={() => setActiveTab('TALENT')}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-950/80 px-3 py-1 text-xs font-black text-amber-300 shadow-md hover:bg-amber-900/80 transition-colors cursor-pointer"
          >
            <span>💰</span>
            <span>{saveData.gold}</span>
            <span className="text-[10px] text-amber-400/80 font-normal">+</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = sounds.toggleMute();
              setMuted(next);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/85 text-slate-300 hover:text-white transition-colors cursor-pointer shadow"
          >
            {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* 2. HERO CENTER CONTENT (When on BATTLE tab) */}
      {activeTab === 'BATTLE' && (
        <div className="flex flex-col items-center text-center my-auto px-2">
          {/* Subtitle tag */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-950/70 px-3.5 py-1 text-[11px] font-black tracking-widest text-amber-300 mb-3 shadow-lg shadow-amber-950/50">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>别急着杀蛇 · 先抢宝箱</span>
          </div>

          {/* Game Title */}
          <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]">
            3D 打大蛇
          </h1>
          <p className="mt-1 text-xs text-sky-300 font-semibold tracking-wider">
            首创蛇节破箱 · 战术模组超爽割草
          </p>

          {/* Mission Capsule */}
          <div className="mt-5 w-full max-w-[320px] rounded-2xl border border-slate-700/80 bg-slate-900/85 p-3.5 backdrop-blur-md shadow-xl text-left">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-sky-400">
                <span>⚔️</span> 第 1 关 · 试炼长廊
              </span>
              <span className="text-[10px] text-amber-400 font-extrabold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                共 8 波蛇潮
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              击破蛇身上的<strong className="text-amber-300 font-bold">黄金宝箱</strong>获取 25+ 战术武器，组建专属强力 Build，决战灭世巨蛇王！
            </div>
          </div>

          {/* Big Start Battle Button */}
          <div className="mt-6 w-full max-w-[320px] flex flex-col items-center gap-2.5">
            <button
              onClick={handleStart}
              className="group relative flex w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-400/80 bg-gradient-to-r from-emerald-500 to-teal-400 py-3.5 text-lg font-black tracking-widest text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.5)] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              <Play className="h-5 w-5 fill-slate-950" />
              <span>开始出击</span>
            </button>

            <span className="text-[10px] text-slate-400 font-medium">
              左右拖动移动炮台 · 自动索敌射击
            </span>
          </div>
        </div>
      )}

      {/* 3. TALENTS SCREEN (When on TALENT tab) */}
      {activeTab === 'TALENT' && (
        <div className="my-auto flex flex-col w-full max-h-[72vh] rounded-3xl border border-slate-700 bg-slate-900/95 p-4 backdrop-blur-xl shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black text-sky-400 tracking-wider">TALENTS UPGRADE</span>
              <h3 className="text-lg font-black text-white">基地天赋强化</h3>
            </div>
            <button
              onClick={() => setActiveTab('BATTLE')}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 text-xs text-slate-300">
            <span>当前金币: <strong className="text-amber-400 font-black">{saveData.gold} G</strong></span>
            <span className="text-[11px] text-slate-500">天赋强化永久生效</span>
          </div>

          {/* Upgrades List */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 my-2 max-h-[50vh]">
            {metaUpgrades.map(item => {
              const canAfford = saveData.gold >= item.cost;
              return (
                <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/80">
                  <div className="flex items-center gap-2.5">
                    <div className="text-2xl shrink-0">{item.icon}</div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <span className="text-[10px] text-sky-400 font-black">LV.{item.level}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </div>

                  <button
                    disabled={!canAfford}
                    onClick={() => handleBuyUpgrade(item.key, item.cost)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ml-2 ${
                      canAfford 
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95' 
                        : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {item.cost} G
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CODEX SCREEN (When on CODEX tab) */}
      {activeTab === 'CODEX' && (
        <div className="my-auto flex flex-col w-full max-h-[72vh] rounded-3xl border border-slate-700 bg-slate-900/95 p-4 backdrop-blur-xl shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black text-purple-400 tracking-wider">DATABASE</span>
              <h3 className="text-lg font-black text-white">图鉴与核心羁绊</h3>
            </div>
            <button
              onClick={() => setActiveTab('BATTLE')}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 my-2.5">
            <button
              onClick={() => setCodexTab('SKILLS')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${codexTab === 'SKILLS' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              战术模组 ({SKILLS.length})
            </button>
            <button
              onClick={() => setCodexTab('SYNERGIES')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${codexTab === 'SYNERGIES' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              核心羁绊 ({SYNERGIES.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto pr-1 flex flex-col gap-2 max-h-[48vh]">
            {codexTab === 'SKILLS' ? (
              SKILLS.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-950/70 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <span className="font-bold text-white text-xs">{s.nameZh}</span>
                      <div className="text-[10px] text-slate-400">{s.description}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 shrink-0">
                    {s.rarity}
                  </span>
                </div>
              ))
            ) : (
              SYNERGIES.map(syn => (
                <div key={syn.id} className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/30 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <span>{syn.icon}</span>
                    <span>{syn.nameZh}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">{syn.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. SUPPLY TOAST / MODAL */}
      {activeTab === 'SUPPLY' && (
        <div className="my-auto flex flex-col items-center text-center w-full max-w-[320px] mx-auto rounded-3xl border border-amber-500/50 bg-slate-900/95 p-5 backdrop-blur-xl shadow-2xl animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/50 text-3xl mb-3">
            🎁
          </div>
          <h3 className="text-lg font-black text-white">每日军备补给</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            指挥部空投战略军备资金，助力快速强化基地天赋！
          </p>

          <div className="my-4 rounded-xl bg-amber-950/60 border border-amber-500/40 px-6 py-2.5 text-lg font-black text-amber-300 flex items-center gap-2">
            <span>💰</span>
            <span>+120 金币</span>
          </div>

          <button
            onClick={handleClaimDailySupply}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/30 active:scale-95 transition-transform cursor-pointer"
          >
            免费领取补给
          </button>

          <button
            onClick={() => setActiveTab('BATTLE')}
            className="mt-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            返回
          </button>
        </div>
      )}

      {/* Supply Claimed Toast */}
      {showSupplyToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-950/90 px-4 py-2 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-xl animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>领取成功！+120 金币已入账</span>
        </div>
      )}

      {/* 6. BOTTOM WECHAT MINI-GAME TAB BAR DOCK */}
      <div className="w-full max-w-[360px] mx-auto rounded-2xl border border-slate-700/80 bg-slate-900/90 p-1.5 backdrop-blur-md shadow-2xl flex items-center justify-around z-30">
        <button
          onClick={() => {
            sounds.playUI();
            setActiveTab('BATTLE');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
            activeTab === 'BATTLE' 
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base leading-none mb-0.5">⚔️</span>
          <span>出击</span>
        </button>

        <button
          onClick={() => {
            sounds.playUI();
            setActiveTab('TALENT');
          }}
          className={`relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
            activeTab === 'TALENT' 
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {canAffordAnyUpgrade && (
            <span className="absolute top-1 right-3 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          )}
          <span className="text-base leading-none mb-0.5">🛡️</span>
          <span>天赋</span>
        </button>

        <button
          onClick={() => {
            sounds.playUI();
            setActiveTab('CODEX');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
            activeTab === 'CODEX' 
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base leading-none mb-0.5">📖</span>
          <span>图鉴</span>
        </button>

        <button
          onClick={() => {
            sounds.playUI();
            setActiveTab('SUPPLY');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
            activeTab === 'SUPPLY' 
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-base leading-none mb-0.5">🎁</span>
          <span>福利</span>
        </button>
      </div>
    </div>
  );
};
