// Notification sound utilities

export class NotificationSound {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    // Initialize audio context only when needed
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = 0.3; // Set volume to 30%
      } catch (error) {
        console.warn('AudioContext not supported:', error);
      }
    }
  }

  // Play a simple notification beep
  async playMessageNotification() {
    if (!this.audioContext || !this.gainNode) return;

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create a short, pleasant notification sound
      const oscillator = this.audioContext.createOscillator();
      const envelope = this.audioContext.createGain();

      oscillator.connect(envelope);
      envelope.connect(this.gainNode);

      // Set frequency for a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

      // Create envelope for smooth sound
      envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
      envelope.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);

    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  // Play a different sound for different notification types
  async playNotification(type: 'message' | 'like' | 'comment' | 'follow' | 'general' = 'general') {
    if (!this.audioContext || !this.gainNode) return;

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const envelope = this.audioContext.createGain();

      oscillator.connect(envelope);
      envelope.connect(this.gainNode);

      // Different frequencies for different notification types
      let startFreq = 800;
      let endFreq = 600;
      let duration = 0.2;

      switch (type) {
        case 'message':
          startFreq = 880;
          endFreq = 660;
          duration = 0.15;
          break;
        case 'like':
          startFreq = 1000;
          endFreq = 800;
          duration = 0.1;
          break;
        case 'comment':
          startFreq = 750;
          endFreq = 550;
          duration = 0.25;
          break;
        case 'follow':
          startFreq = 900;
          endFreq = 700;
          duration = 0.3;
          break;
      }

      oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration * 0.5);

      envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
      envelope.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }
}

// Create a singleton instance
export const notificationSound = new NotificationSound();
