// Service worker registration and offline storage for recipes
export class OfflineRecipeStorage {
  private dbName = 'RecipeDB';
  private version = 1;
  private storeName = 'recipes';

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        const transaction = e.target.transaction;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          objectStore.createIndex('userId', 'userId', { unique: false });
        }

        transaction.oncomplete = () => {
          console.log('Database setup completed');
        };
      };
    });
  }

  async saveRecipe(recipe: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const objectStore = transaction.objectStore(this.storeName);

    // Add timestamp if not present
    if (!recipe.createdAt) {
      recipe.createdAt = new Date().toISOString();
    }

    return new Promise((resolve, reject) => {
      const request = objectStore.put(recipe);

      request.onsuccess = () => {
        console.log('Recipe saved to offline storage');
        resolve();
      };

      request.onerror = () => {
        console.error('Error saving recipe to offline storage');
        reject(request.error);
      };
    });
  }

  async getRecipe(id: string): Promise<any | null> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.get(id);

      request.onsuccess = () => {
        const recipe = request.result;
        if (recipe) {
          console.log('Recipe retrieved from offline storage');
          resolve(recipe);
        } else {
          console.log('Recipe not found in offline storage');
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Error retrieving recipe from offline storage');
        reject(request.error);
      };
    });
  }

  async getAllRecipes(userId?: string): Promise<any[]> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = userId
        ? objectStore.index('userId').getAll(IDBKeyRange.only(userId))
        : objectStore.getAll();

      request.onsuccess = () => {
        console.log(`Retrieved ${request.result.length} recipes from offline storage`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error retrieving recipes from offline storage');
        reject(request.error);
      };
    });
  }

  async deleteRecipe(id: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        console.log('Recipe deleted from offline storage');
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting recipe from offline storage');
        reject(request.error);
      };
    });
  }

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

// Service Worker registration helper
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | undefined> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
      return registration;
    } catch (error) {
      console.error('SW registration failed: ', error);
    }
  }
};

// Helper to check if we're offline
export const isOnline = (): boolean => {
  return navigator.onLine;
};