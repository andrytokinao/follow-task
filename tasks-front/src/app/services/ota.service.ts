import { HttpClient } from '@angular/common/http';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import {Injectable} from "@angular/core";
import {environment} from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class OtaService {

  constructor(private http: HttpClient) {}

  async checkAndUpdate(currentVersion: string) {
    const { version, url } = await this.http
      .get<any>(`${environment.apiURL}api/updates/check`)
      .toPromise();

    if (version !== currentVersion) {
      // Télécharge et installe le ZIP
      const bundle = await CapacitorUpdater.download({ url, version });
      await CapacitorUpdater.set(bundle);
    }
  }
}
