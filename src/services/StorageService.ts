import { AppSettings, HistoryEntry } from '../types';

export class StorageService {
  private static readonly SETTINGS_KEY = 'visionbridge-settings';
  private static readonly HISTORY_KEY = 'visionbridge-history';

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  static async getSettings(): Promise<AppSettings | null> {
    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  static async saveHistory(history: HistoryEntry[]): Promise<void> {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  static async getHistory(): Promise<HistoryEntry[] | null> {
    try {
      const saved = localStorage.getItem(this.HISTORY_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load history:', error);
      return null;
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      localStorage.removeItem(this.HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }
}