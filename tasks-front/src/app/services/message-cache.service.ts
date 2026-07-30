// src/app/services/message-cache.service.ts

import { Injectable } from '@angular/core';
import { MessageDto } from '../models/messaging.model';

const DB_NAME = 'followtask-messaging';
const DB_VERSION = 1;
const STORE_MESSAGES = 'messages';

@Injectable({ providedIn: 'root' })
export class MessageCacheService {

  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.openDb();
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
          const store = db.createObjectStore(STORE_MESSAGES, { keyPath: 'externalMessageId' });
          store.createIndex('byCanal', 'canalExternalId', { unique: false });
          store.createIndex('byCanalDate', ['canalExternalId', 'createdAt'], { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getMessages(canalExternalId: string): Promise<MessageDto[]> {
    const db = await this.dbPromise;
    return new Promise<MessageDto[]>((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const index = tx.objectStore(STORE_MESSAGES).index('byCanal');
      const request = index.getAll(IDBKeyRange.only(canalExternalId));

      request.onsuccess = () => {
        const messages = (request.result as MessageDto[]).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveMessages(messages: MessageDto[]): Promise<void> {
    if (!messages.length) return;
    const db = await this.dbPromise;
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      messages.forEach(m => store.put(m));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getLastCachedDate(canalExternalId: string): Promise<string | null> {
    const messages = await this.getMessages(canalExternalId);
    return messages.length ? messages[messages.length - 1].createdAt : null;
  }

  async clearCanal(canalExternalId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const index = tx.objectStore(STORE_MESSAGES).index('byCanal');
      const request = index.openCursor(IDBKeyRange.only(canalExternalId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) { cursor.delete(); cursor.continue(); }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
