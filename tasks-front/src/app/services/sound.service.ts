import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private notificationSound = new Audio('assets/sounds/notification.mp3');

  playShortNotification() {
    this.notificationSound.pause();
    this.notificationSound.currentTime = 0;
    this.notificationSound.play();

    setTimeout(() => {
      this.notificationSound.pause();
    }, 3000);
  }

  // joue depuis 3s jusqu'à la fin
  playLongNotification() {
    this.notificationSound.pause();
    this.notificationSound.currentTime = 3;
    this.notificationSound.play().catch(err => {
      console.warn('Audio bloqué par le navigateur:', err);
    });
  }
  constructor() {
    this.notificationSound.volume = 0.1;
  }
}
