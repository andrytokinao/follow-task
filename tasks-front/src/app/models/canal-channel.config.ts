// src/app/models/canal-channel.config.ts

import { TypeCanal } from './messaging.model';

export interface ChannelVisualConfig {
  label: string;
  icon: string;        // chemin vers svg/png ou nom d'icône (ex: material icon)
  iconClass: string;   // classes FontAwesome, utilisées à l'affichage
  color: string;       // couleur d'accent
}

// `icon` pointe vers assets/icons/*.svg, un dossier qui n'existe pas dans le
// projet : toutes ces images étaient cassées et le type de canal restait donc
// invisible. `iconClass` s'appuie sur FontAwesome 6, déjà chargé globalement,
// dont la famille Brands couvre WhatsApp, Facebook, Telegram, etc.
export const CHANNEL_CONFIG: Record<TypeCanal, ChannelVisualConfig> = {
  [TypeCanal.WHATSAPP]:  { label: 'WhatsApp',  icon: 'assets/icons/whatsapp.svg',  iconClass: 'fab fa-whatsapp',        color: '#25D366' },
  [TypeCanal.FACEBOOK]:  { label: 'Facebook',  icon: 'assets/icons/facebook.svg',  iconClass: 'fab fa-facebook-f',      color: '#1877F2' },
  [TypeCanal.INSTAGRAM]: { label: 'Instagram', icon: 'assets/icons/instagram.svg', iconClass: 'fab fa-instagram',       color: '#E4405F' },
  [TypeCanal.TELEGRAM]:  { label: 'Telegram',  icon: 'assets/icons/telegram.svg',  iconClass: 'fab fa-telegram',        color: '#26A5E4' },
  [TypeCanal.SLACK]:     { label: 'Slack',     icon: 'assets/icons/slack.svg',     iconClass: 'fab fa-slack',           color: '#4A154B' },
  [TypeCanal.SMS]:       { label: 'SMS',       icon: 'assets/icons/sms.svg',       iconClass: 'fas fa-comment-dots',    color: '#6B7280' },
  [TypeCanal.EMAIL]:     { label: 'Email',     icon: 'assets/icons/email.svg',     iconClass: 'fas fa-envelope',        color: '#EA4335' },
  [TypeCanal.PROJECT]:   { label: 'Projet',    icon: 'assets/icons/project.svg',   iconClass: 'fas fa-diagram-project', color: '#6366F1' },
  [TypeCanal.ISSUE]:     { label: 'Tâche',     icon: 'assets/icons/issue.svg',     iconClass: 'fas fa-list-check',      color: '#F59E0B' },
  [TypeCanal.DEFAULT]:   { label: 'Canal',     icon: 'assets/icons/default.svg',   iconClass: 'fas fa-comments',        color: '#9CA3AF' },
};

export function getChannelConfig(type: TypeCanal): ChannelVisualConfig {
  return CHANNEL_CONFIG[type] ?? CHANNEL_CONFIG[TypeCanal.DEFAULT];
}
