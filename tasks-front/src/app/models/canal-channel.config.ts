// src/app/models/canal-channel.config.ts

import { TypeCanal } from './messaging.model';

export interface ChannelVisualConfig {
  label: string;
  icon: string;       // chemin vers svg/png ou nom d'icône (ex: material icon)
  color: string;       // couleur d'accent
}

export const CHANNEL_CONFIG: Record<TypeCanal, ChannelVisualConfig> = {
  [TypeCanal.WHATSAPP]: { label: 'WhatsApp', icon: 'assets/icons/whatsapp.svg', color: '#25D366' },
  [TypeCanal.FACEBOOK]: { label: 'Facebook', icon: 'assets/icons/facebook.svg', color: '#1877F2' },
  [TypeCanal.INSTAGRAM]: { label: 'Instagram', icon: 'assets/icons/instagram.svg', color: '#E4405F' },
  [TypeCanal.TELEGRAM]: { label: 'Telegram', icon: 'assets/icons/telegram.svg', color: '#26A5E4' },
  [TypeCanal.SLACK]: { label: 'Slack', icon: 'assets/icons/slack.svg', color: '#4A154B' },
  [TypeCanal.SMS]: { label: 'SMS', icon: 'assets/icons/sms.svg', color: '#6B7280' },
  [TypeCanal.EMAIL]: { label: 'Email', icon: 'assets/icons/email.svg', color: '#EA4335' },
  [TypeCanal.PROJECT]: { label: 'Projet', icon: 'assets/icons/project.svg', color: '#6366F1' },
  [TypeCanal.ISSUE]: { label: 'Tâche', icon: 'assets/icons/issue.svg', color: '#F59E0B' },
  [TypeCanal.DEFAULT]: { label: 'Canal', icon: 'assets/icons/default.svg', color: '#9CA3AF' },
};

export function getChannelConfig(type: TypeCanal): ChannelVisualConfig {
  return CHANNEL_CONFIG[type] ?? CHANNEL_CONFIG[TypeCanal.DEFAULT];
}
