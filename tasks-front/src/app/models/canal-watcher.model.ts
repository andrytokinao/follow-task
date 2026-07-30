
export interface CanalWatcherInfo {
  canalId: string;
  userAppId: string;
  grantedByUserAppId: string | null;
  grantedAt: string;
  reason: string | null;
}

export interface CanallInterne {
  id: string;
  pseudo: string;
  typeCanal: string;
  membersIds: string[];
}
