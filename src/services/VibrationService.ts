export class VibrationService {
  static vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration not supported or failed:', error);
      }
    }
  }

  static stop(): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (error) {
        console.warn('Failed to stop vibration:', error);
      }
    }
  }
}