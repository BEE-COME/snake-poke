import { MetaProgressionData } from '../types/game';
export type { MetaProgressionData };

const STORAGE_KEY = 'SNAKE_3D_SAVE_DATA_V1';

const DEFAULT_DATA: MetaProgressionData = {
  gold: 0,
  highScore: 0,
  maxWave: 1,
  totalKills: 0,
  gamesPlayed: 0,
  upgrades: {
    baseDamageLevel: 0,
    baseShieldLevel: 0,
    goldBonusLevel: 0,
    chestLuckLevel: 0
  }
};

export class SaveSystem {
  public static load(): MetaProgressionData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DATA };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        upgrades: {
          ...DEFAULT_DATA.upgrades,
          ...(parsed.upgrades || {})
        }
      };
    } catch {
      return { ...DEFAULT_DATA };
    }
  }

  public static save(data: MetaProgressionData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  public static addGold(amount: number): number {
    const data = this.load();
    data.gold += Math.max(0, Math.floor(amount));
    this.save(data);
    return data.gold;
  }

  public static recordGameEnd(score: number, wave: number, kills: number, earnedGold: number): MetaProgressionData {
    const data = this.load();
    data.gold += Math.max(0, Math.floor(earnedGold));
    data.highScore = Math.max(data.highScore, score);
    data.maxWave = Math.max(data.maxWave, wave);
    data.totalKills += kills;
    data.gamesPlayed += 1;
    this.save(data);
    return data;
  }

  public static buyUpgrade(upgradeKey: keyof MetaProgressionData['upgrades'], cost: number): boolean {
    const data = this.load();
    if (data.gold >= cost) {
      data.gold -= cost;
      data.upgrades[upgradeKey] += 1;
      this.save(data);
      return true;
    }
    return false;
  }
}
