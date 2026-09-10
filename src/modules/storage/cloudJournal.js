/**
 * cloudJournal.js - Cloud Firestore synchronization engine.
 */
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../constants/firebase.js';

export class CloudJournal {
  /**
   * Syncs an observation record to the user's private Firestore collection.
   */
  static async syncObservation(userId, record) {
    if (!userId) {
      throw new Error('User must be authenticated to sync with cloud.');
    }

    const docRef = doc(db, 'users', userId, 'observations', record.id);

    const cloudPayload = {
      id: record.id,
      category: record.category || 'plants',
      caption: record.caption || '',
      filter: record.filter || 'natural',
      aspectRatio: record.aspectRatio || '4:3',
      frame: record.frame || 'none',
      cloudUrl: record.cloudUrl || null,
      publicId: record.publicId || null,
      capturedAt: record.timestamp,
      syncedAt: serverTimestamp()
    };

    try {
      await setDoc(docRef, cloudPayload, { merge: true });
      return cloudPayload;
    } catch (error) {
      console.error('Firestore setDoc failed:', error);
      throw error;
    }
  }

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
