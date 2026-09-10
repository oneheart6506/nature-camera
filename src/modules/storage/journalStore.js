/**
 * journalStore.js - Pure IndexedDB async wrapper for nature journal records.
 */
const DB_NAME = 'nature_camera_db';
const DB_VERSION = 1;
const STORE_NAME = 'observations';

export class JournalStore {
  static openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async saveObservation(entry) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        id: entry.id || `obs_${Date.now()}`,
        photoBlob: entry.photoBlob,
        category: entry.category || 'plants',
        filter: entry.filter || 'natural',
        aspectRatio: entry.aspectRatio || '4:3',
        frame: entry.frame || 'none',
        timestamp: entry.timestamp || Date.now(),
        caption: entry.caption || '',
        cloudUrl: entry.cloudUrl || null,
        publicId: entry.publicId || null
      };

      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);

      tx.oncomplete = () => db.close();
    });
  }

  static async updateObservationCloudData(id, cloudData) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result;
        if (!record) {
          reject(new Error(`Record ${id} not found.`));
          return;
        }
        record.cloudUrl = cloudData.cloudUrl;
        record.publicId = cloudData.publicId;

        const updateReq = store.put(record);
        updateReq.onsuccess = () => resolve(record);
        updateReq.onerror = () => reject(updateReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => db.close();
    });
  }

  static async getAllObservations() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      const request = index.openCursor(null, 'prev');
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }

  static async deleteObservation(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }

  static async getCount() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }
}
