import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './core/GameEngine';
import { gameState } from './core/GameState';
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { UpgradeModal } from './ui/UpgradeModal';
import { ShopModal } from './ui/ShopModal';
import { GameOverModal } from './ui/GameOverModal';
import { VictoryModal } from './ui/VictoryModal';
import { DebugPanel } from './ui/DebugPanel';
import { sounds } from './audio/SoundSystem';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [mode, setMode] = useState(gameState.mode);

  useEffect(() => {
    // Mount 2D GameEngine
    if (containerRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(containerRef.current);
    }

    // Observe container resizing for pixel-perfect portrait responsiveness
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (engineRef.current) {
          engineRef.current.handleResize();
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    const unsub = gameState.subscribe(() => {
      setMode(gameState.mode);
    });

    return () => {
      unsub();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  const handleStartGame = () => {
    gameState.resetRun();
    if (engineRef.current) {
      engineRef.current.startWave(0);
    }
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleUpgradeSelected = () => {
    if (gameState.pendingLevelUps > 1) {
      gameState.pendingLevelUps -= 1;
      gameState.upgradeOptions = gameState.generateUpgradeChoices();
      gameState.notify();
    } else {
      gameState.pendingLevelUps = 0;
      gameState.setMode('PLAYING');
    }
  };

  const handleShopContinue = () => {
    if (engineRef.current) {
      const nextWaveIdx = gameState.currentWave; // currentWave is 1-indexed, so next index is currentWave
      engineRef.current.startWave(nextWaveIdx);
    }
    gameState.setMode('PLAYING');
  };

  const handleSkipWave = (waveNumber: number) => {
    if (engineRef.current) {
      engineRef.current.startWave(waveNumber - 1);
      if (gameState.mode !== 'PLAYING') {
        gameState.setMode('PLAYING');
      }
    }
  };

  const handleTriggerNuke = () => {
    if (engineRef.current) {
      engineRef.current.triggerNuke();
      gameState.applySkill('nuke');
    }
  };

  const handleSpawnGates = () => {
    if (engineRef.current) {
      engineRef.current.triggerChoiceGates();
    }
  };

  return (
    <div className="relative w-full h-[100dvh] min-h-screen bg-[#060a14] flex items-center justify-center select-none overflow-hidden touch-none font-sans">
      {/* Ambient background aura for desktop */}
      <div className="hidden sm:block absolute w-[460px] h-[780px] bg-sky-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Portrait Mini-Game Screen Frame */}
      <div 
        id="portrait-stage-wrapper"
        className="relative w-full h-[100dvh] sm:h-[95dvh] sm:max-h-[900px] sm:max-w-[430px] sm:rounded-[36px] sm:border sm:border-slate-700/60 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.07)] overflow-hidden bg-[#0c1424] flex flex-col"
      >
        {/* Subtle camera / speaker notch on desktop */}
        <div className="hidden sm:flex absolute top-2.5 left-1/2 -translate-x-1/2 z-50 h-3.5 w-24 rounded-full bg-slate-950/80 border border-slate-800/80 items-center justify-center pointer-events-none">
          <div className="h-1 w-8 rounded-full bg-slate-800" />
        </div>

        {/* 2D Game Canvas Container */}
        <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 cursor-crosshair" />

        {/* UI States Overlay */}
        {mode === 'MENU' && (
          <MainMenu onStartGame={handleStartGame} />
        )}

        {mode !== 'MENU' && (
          <>
            <HUD />
            <DebugPanel
              onSkipWave={handleSkipWave}
              onTriggerNuke={handleTriggerNuke}
              onSpawnGates={handleSpawnGates}
            />
          </>
        )}

        {mode === 'LEVEL_UP' && (
          <UpgradeModal
            options={gameState.upgradeOptions}
            title="挑选战术模组"
            subtitle="提升技能等级或构筑核心羁绊"
            onSelected={handleUpgradeSelected}
          />
        )}

        {mode === 'SHOP' && (
          <ShopModal onContinue={handleShopContinue} />
        )}

        {mode === 'GAME_OVER' && (
          <GameOverModal onRestart={handleRestart} />
        )}

        {mode === 'VICTORY' && (
          <VictoryModal onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}
