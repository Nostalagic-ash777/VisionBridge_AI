import { AppSettings } from '../types';

export class AudioService {
  private static audioContext: AudioContext | null = null;

  static async speak(text: string, settings: AppSettings): Promise<void> {
    if (!text.trim()) return;

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        utterance.rate = settings.speechRate;
        utterance.volume = settings.volume;
        utterance.lang = settings.language;

        // Try to find a voice that matches the language
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang === settings.language || 
          voice.lang.startsWith(settings.language.split('-')[0])
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (error) => reject(error);

        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis error:', error);
        reject(error);
      }
    });
  }

  static playBeep(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  }

  static stop(): void {
    speechSynthesis.cancel();
  }
}