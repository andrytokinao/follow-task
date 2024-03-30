import {Injectable} from "@angular/core";


@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor() {
  }

  setItem(key: string, value: any): void {
    localStorage.setItem(key, value);
  }

  getItem(key: string): any | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
