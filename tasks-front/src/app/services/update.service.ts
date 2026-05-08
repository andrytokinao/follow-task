// update.service.ts
import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UpdateService {

  constructor(private swUpdate: SwUpdate) {}

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.pipe(
      filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY')
    ).subscribe(event => {
      console.log('Ancienne version:', event.currentVersion);
      console.log('Nouvelle version:', event.latestVersion);

      window.dispatchEvent(new CustomEvent('app-update-available'));
    });

    this.swUpdate.checkForUpdate().then(hasUpdate => {
      console.log('Mise à jour disponible:', hasUpdate);
      alert('Mise à jour disponible:'+ JSON.stringify(hasUpdate));
    });
  }

  async applyUpdate(): Promise<void> {
    await this.swUpdate.activateUpdate();
    window.location.reload();
  }
}
