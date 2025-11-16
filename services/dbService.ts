import type { ImageState } from '../components/ImageEditor';

const DB_NAME = 'FastAIDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const PROJECTS_KEY = 'projectList';

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
};

// Type for serializable state, excluding the File object
type SerializableImageState = Omit<ImageState, 'file'>;

export const saveProjects = async (projects: SerializableImageState[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(projects, PROJECTS_KEY);

    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      console.error('Transaction error saving projects to IndexedDB:', transaction.error);
      reject('Could not save projects due to a transaction error.');
    };
  });
};

export const loadProjects = async (): Promise<SerializableImageState[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(PROJECTS_KEY);

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => {
      console.error('Error loading projects from IndexedDB:', request.error);
      reject('Could not load projects.');
    };
  });
};

export const clearProjects = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(PROJECTS_KEY);

        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => {
            console.error('Transaction error clearing projects in IndexedDB:', transaction.error);
            reject('Could not clear projects due to a transaction error.');
        };
    });
};
