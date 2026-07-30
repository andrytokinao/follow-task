
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar" [style.background]="imageUrl ? 'transparent' : bgColor">
      <img *ngIf="imageUrl" [src]="imageUrl" (error)="onImageError()" [alt]="displayName" />

      <svg *ngIf="!imageUrl && isGroup" class="group-icon" viewBox="0 0 24 24" fill="white">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>

      <!-- Pas de photo + contact individuel : initiales -->
      <span *ngIf="!imageUrl && !isGroup" class="initials">{{ initials }}</span>
    </div>
  `,
  styles: [`
    .avatar {
      width: var(--avatar-size, 36px);
      height: var(--avatar-size, 36px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    img { width: 100%; height: 100%; object-fit: cover; }
    .initials { color: white; font-weight: 600; font-size: 13px; }
    .group-icon { width: 55%; height: 55%; }
  `],
})
export class AvatarComponent {
  @Input() set url(value: string | null | undefined) {
    this.imageUrl = value || null;
  }
  @Input() displayName: string | null = '';
  @Input() isGroup = false;

  imageUrl: string | null = null;

  get initials(): string {
    const name = this.displayName?.trim();
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  get bgColor(): string {
    const name = this.displayName || '?';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = hash % 360;
    return this.isGroup ? '#9CA3AF' : `hsl(${hue}, 55%, 55%)`;
  }

  onImageError() {
    this.imageUrl = null;
  }
}
