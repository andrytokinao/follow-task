import { HttpClient } from '@angular/common/http';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import {Injectable} from "@angular/core";
import {environment} from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class OtaService {

  constructor(private http: HttpClient) {}

  async checkAndUpdate(currentVersion: string) {
    // Une mise à jour OTA n'a de sens que dans l'application native : dans un
    // navigateur, CapacitorUpdater ne peut rien installer.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Cette vérification tourne en tâche de fond au démarrage, y compris sur
    // les pages publiques. Un échec ne doit jamais remonter : sans ce try,
    // l'erreur partait dans l'intercepteur HTTP, qui renvoyait le visiteur
    // vers /login alors qu'il consultait simplement la page d'accueil.
    try {
      const { version, url } = await this.http
        .get<any>(`${environment.apiURL}api/updates/check`)
        .toPromise();

      if (version !== currentVersion) {
        // Télécharge et installe le ZIP
        const bundle = await CapacitorUpdater.download({ url, version });
        await CapacitorUpdater.set(bundle);
      }
    } catch (err) {
      console.warn('[OTA] Vérification de mise à jour ignorée :', err);
    }
  }
}
