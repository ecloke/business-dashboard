import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { DashboardData, CacheData, FirebaseConfig } from './types';

// Firebase configuration from environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase (singleton pattern to avoid multiple initializations)
let app: FirebaseApp;
let db: Firestore;

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Cache collection and document names
const CACHE_COLLECTION = 'dashboard_cache';
const CACHE_DOCUMENT = 'current_data';
const CACHE_DURATION_MINUTES = parseInt(process.env.CACHE_DURATION_MINUTES || '10');

/**
 * Save dashboard data to Firebase cache
 * Stores data with expiration timestamp for automatic invalidation
 */
export async function saveToCache(data: DashboardData, source: 'baseline' | 'api' | 'cache' = 'api'): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const now = Date.now();
    const expiresAt = now + (CACHE_DURATION_MINUTES * 60 * 1000);
    
    const cacheData: CacheData = {
      data,
      lastUpdated: new Date(now).toISOString(),
      source,
      cacheExpiry: new Date(expiresAt).toISOString()
    };

    const docRef = doc(db, CACHE_COLLECTION, CACHE_DOCUMENT);
    await setDoc(docRef, {
      ...cacheData,
      timestamp: serverTimestamp()
    });

    console.log('Data saved to cache successfully', { source, dataCount: data.leads.length });
  } catch (error) {
    console.error('Error saving to cache:', error);
    throw new Error('Failed to save data to cache');
  }
}

/**
 * Get dashboard data from Firebase cache
 * Returns cached data if valid, null if expired or not found
 */
export async function getFromCache(): Promise<CacheData | null> {
  try {
    if (!db) {
      console.warn('Firebase not initialized, returning null');
      return null;
    }

    const docRef = doc(db, CACHE_COLLECTION, CACHE_DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('No cached data found');
      return null;
    }

    const cachedData = docSnap.data() as CacheData & { timestamp?: Timestamp };
    
    // Check if cache is expired
    if (cachedData.cacheExpiry) {
      const expiryTime = new Date(cachedData.cacheExpiry).getTime();
      const now = Date.now();
      
      if (now > expiryTime) {
        console.log('Cached data expired, clearing cache');
        await clearCache();
        return null;
      }
    }

    console.log('Retrieved data from cache', { 
      source: cachedData.source, 
      lastUpdated: cachedData.lastUpdated,
      dataCount: cachedData.data.leads.length 
    });

    return cachedData;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
}

/**
 * Clear cached dashboard data
 * Removes the cached document from Firestore
 */
export async function clearCache(): Promise<void> {
  try {
    if (!db) {
      console.warn('Firebase not initialized');
      return;
    }

    const docRef = doc(db, CACHE_COLLECTION, CACHE_DOCUMENT);
    await deleteDoc(docRef);
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw new Error('Failed to clear cache');
  }
}

/**
 * Check if cached data exists and is valid
 * Returns true if valid cache exists, false otherwise
 */
export async function isCacheValid(): Promise<boolean> {
  try {
    const cachedData = await getFromCache();
    return cachedData !== null;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Get cache metadata without fetching full data
 * Useful for checking cache status without loading large datasets
 */
export async function getCacheMetadata(): Promise<{ lastUpdated: string; source: string; isValid: boolean } | null> {
  try {
    if (!db) {
      return null;
    }

    const docRef = doc(db, CACHE_COLLECTION, CACHE_DOCUMENT);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const now = Date.now();
    const expiryTime = data.cacheExpiry ? new Date(data.cacheExpiry).getTime() : now + 1;
    const isValid = now <= expiryTime;

    return {
      lastUpdated: data.lastUpdated,
      source: data.source,
      isValid
    };
  } catch (error) {
    console.error('Error getting cache metadata:', error);
    return null;
  }
}

/**
 * Update cache expiry time without changing data
 * Useful for extending cache lifetime when fresh data isn't needed
 */
export async function extendCacheExpiry(additionalMinutes: number = CACHE_DURATION_MINUTES): Promise<void> {
  try {
    const currentCache = await getFromCache();
    if (!currentCache) {
      throw new Error('No cache found to extend');
    }

    const newExpiryTime = Date.now() + (additionalMinutes * 60 * 1000);
    currentCache.cacheExpiry = new Date(newExpiryTime).toISOString();

    await saveToCache(currentCache.data, currentCache.source);
    console.log(`Cache expiry extended by ${additionalMinutes} minutes`);
  } catch (error) {
    console.error('Error extending cache expiry:', error);
    throw new Error('Failed to extend cache expiry');
  }
}

/**
 * Get cache statistics for monitoring
 * Returns information about cache usage and performance
 */
export async function getCacheStats(): Promise<{
  hasCache: boolean;
  isValid: boolean;
  lastUpdated?: string;
  source?: string;
  dataCount?: number;
  expiresIn?: number; // minutes until expiry
} | null> {
  try {
    const metadata = await getCacheMetadata();
    
    if (!metadata) {
      return {
        hasCache: false,
        isValid: false
      };
    }

    let dataCount: number | undefined;
    let expiresIn: number | undefined;

    if (metadata.isValid) {
      // Get full data to count leads
      const fullCache = await getFromCache();
      if (fullCache) {
        dataCount = fullCache.data.leads.length;
        
        // Calculate time until expiry
        if (fullCache.cacheExpiry) {
          const expiryTime = new Date(fullCache.cacheExpiry).getTime();
          const now = Date.now();
          expiresIn = Math.max(0, Math.floor((expiryTime - now) / (60 * 1000)));
        }
      }
    }

    return {
      hasCache: true,
      isValid: metadata.isValid,
      lastUpdated: metadata.lastUpdated,
      source: metadata.source,
      dataCount,
      expiresIn
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Initialize Firebase connection and test it
 * Useful for health checks and debugging
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    if (!db) {
      return false;
    }

    // Try to read from Firestore to test connection
    const testDocRef = doc(db, 'health_check', 'test');
    await getDoc(testDocRef);
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

// Export the Firestore instance for direct use if needed
export { db };

// Export Firebase app instance
export { app };