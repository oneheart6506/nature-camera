/**
 * cloudJournal.js - Cloud Firestore synchronization engine for nature observations.
 */
import { initializeApp, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

// Reuse initialized Firebase App instance
const app = getApp();
const db = getFirestore(app);

export class CloudJournal {
  /**
   * Syncs an observation record to the user's private Firestore collection.
   */
  static async syncObservation(userId, record) {
    if (!userId) {
      throw new Error('User must be authenticated to sync with cloud.');
    }

    // Document reference: users/{userId}/observations/{observationId}
    const docRef = doc(db, 'users', userId, 'observations', record.id);

    const cloudPayload = {
      id: record.id,
      category: record.category || 'plants',
      caption: record.caption || '',
      filter: record.filter || 'natural',
      aspectRatio: record.aspectRatio || '4:3',
      frame: record.frame || 'none',
      cloudUrl: record.cloudUrl,
      publicId: record.publicId,
      capturedAt: record.timestamp,
      syncedAt: serverTimestamp()
    };

    try {
      await setDoc(docRef, cloudPayload, { merge: true });
      return cloudPayload;
    } catch (error) {
      console.error('Firestore sync failed:', error);
      throw error;
    }
  }

  /**
   * Deletes an observation document from Cloud Firestore.
   */
  static async deleteFromCloud(userId, observationId) {
    if (!userId || !observationId) return;

    const docRef = doc(db, 'users', userId, 'observations', observationId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Failed to delete cloud document:', error);
      throw error;
    }
  }
}
