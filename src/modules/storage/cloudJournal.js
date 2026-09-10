/**
 * cloudJournal.js - Cloud Firestore synchronization & community feed engine.
 */
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../constants/firebase.js';

export class CloudJournal {
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
      syncedAt: serverTimestamp(),
      isPublic: record.isPublic || false
    };

    try {
      await setDoc(docRef, cloudPayload, { merge: true });
      return cloudPayload;
    } catch (error) {
      console.error('Firestore setDoc failed:', error);
      throw error;
    }
  }

  static async setPublicStatus(userId, userEmail, record, isPublic) {
    if (!userId) throw new Error('Sign in required to publish.');
    if (!record.cloudUrl) throw new Error('Photo must be cloud-backed before publishing.');

    const publicRef = doc(db, 'public_observations', record.id);
    const userDocRef = doc(db, 'users', userId, 'observations', record.id);

    if (isPublic) {
      const publicPayload = {
        id: record.id,
        authorId: userId,
        authorName: userEmail.split('@')[0],
        category: record.category || 'plants',
        caption: record.caption || '',
        filter: record.filter || 'natural',
        aspectRatio: record.aspectRatio || '4:3',
        frame: record.frame || 'none',
        cloudUrl: record.cloudUrl,
        capturedAt: record.timestamp,
        publishedAt: serverTimestamp()
      };
      await setDoc(publicRef, publicPayload);
      await setDoc(userDocRef, { isPublic: true }, { merge: true });
    } else {
      await deleteDoc(publicRef);
      await setDoc(userDocRef, { isPublic: false }, { merge: true });
    }
  }

  static async getPublicFeed(maxRecords = 30) {
    try {
      const publicCol = collection(db, 'public_observations');
      const q = query(publicCol, orderBy('publishedAt', 'desc'), limit(maxRecords));
      const snapshot = await getDocs(q);

      const feed = [];
      snapshot.forEach((d) => feed.push(d.data()));
      return feed;
    } catch (error) {
      console.error('Failed to load community feed:', error);
      throw error;
    }
  }

  /**
   * Fetches all public contributions from a specific author.
   */
  static async getObserverPublicFolio(authorId) {
    if (!authorId) return [];

    try {
      const publicCol = collection(db, 'public_observations');
      const q = query(publicCol, where('authorId', '==', authorId));
      const snapshot = await getDocs(q);

      const folio = [];
      snapshot.forEach((d) => folio.push(d.data()));

      // Sort newest first in memory
      return folio.sort((a, b) => {
        const timeA = a.capturedAt || 0;
        const timeB = b.capturedAt || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Failed to load observer folio:', error);
      throw error;
    }
  }

  static async fetchUserObservations(userId) {
    if (!userId) return [];

    try {
      const obsRef = collection(db, 'users', userId, 'observations');
      const q = query(obsRef, orderBy('capturedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const records = [];
      querySnapshot.forEach((docSnap) => {
        records.push(docSnap.data());
      });

      return records;
    } catch (error) {
      console.error('Failed to fetch user observations:', error);
      throw error;
    }
  }

  static async deleteFromCloud(userId, observationId) {
    if (!userId || !observationId) return;

    try {
      await deleteDoc(doc(db, 'users', userId, 'observations', observationId));
      await deleteDoc(doc(db, 'public_observations', observationId));
    } catch (error) {
      console.error('Failed to purge cloud document:', error);
      throw error;
    }
  }
}
