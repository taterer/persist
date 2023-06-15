import { Persistable, Persistence } from '@taterer/persist';

type Schema = {
  indices?: [{ keyPath: string; name: string; options: {} }];
  name: string;
  options: {};
}[];

/**
 * @param {string} databaseName
 * @param {number} version
 * @param {Schema} schema
 * @returns {{ indexedDB
 *  get: (tableName: string, key: { id: string }) => {}
 *  put: (tableName: string, key: { id: string }, value: {}) => {}
 * }} A document database
 */
export function indexedDBFactory<EntityType extends string>(
  databaseName: string,
  version: number,
  schema: Schema
): Promise<Persistence<any & Persistable, EntityType>> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error("This browser doesn't support IndexedDB"));
    }
    const DBOpenRequest = window.indexedDB.open(databaseName, version);
    DBOpenRequest.onsuccess = () => {
      const indexedDB = DBOpenRequest.result;
      resolve({
        remove: (tableName, key) => remove<EntityType>(indexedDB, tableName, key),
        indexedDB,
        get: (tableName, key) => get<EntityType>(indexedDB, tableName, key),
        query: (tableName, key) => query<EntityType>(indexedDB, tableName, key),
        put: (tableName, key, value) => put<EntityType>(indexedDB, tableName, key, value)
      });
    };
    DBOpenRequest.onerror = (e) => {
      reject(e);
    };
    DBOpenRequest.onupgradeneeded = (event) => {
      const db = (event.target as any).result;
      db.onerror = (event: any) => {
        reject(new Error(event));
      };
      schema.forEach((schema) => {
        if (!db.objectStoreNames.contains(schema.name)) {
          const objectStore = db.createObjectStore(schema.name, schema.options);
          if (Array.isArray(schema.indices)) {
            schema.indices.forEach((index) => {
              objectStore.createIndex(index.name, index.keyPath, index.options);
            });
          }
        }
      });
    };
  });
}

function indexedDBObjectStore(indexedDB: any, tableName: string) {
  const transaction = indexedDB.transaction([tableName], 'readwrite');
  transaction.onerror = (err: any) => {
    throw new Error(`Indexed db transaction error. Tablename: ${tableName}. ${err}`);
  };
  return transaction.objectStore(tableName);
}

async function get<EntityType>(db: IDBDatabase, tableName: EntityType, key: any): Promise<object & { id: string }> {
  return new Promise((resolve, reject) => {
    const objectStore = indexedDBObjectStore(db, tableName as string);
    const index = getIndex(key);
    let request: any;
    if (index) {
      request = objectStore.get(key[index]);
    } else {
      request = objectStore.get(key);
    }
    request.onerror = (event: any) => {
      reject(
        new Error(
          `Indexed db objectStore get error. Tablename: ${tableName}. Key: ${JSON.stringify(
            key
          )}. Event: ${JSON.stringify(event)}`
        )
      );
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

async function query<EntityType>(
  db: IDBDatabase,
  tableName: EntityType,
  key?: any
): Promise<object & { id: string }[]> {
  return new Promise((resolve, reject) => {
    const objectStore = indexedDBObjectStore(db, tableName as string);
    const index = getIndex(key);
    let request: any;
    if (typeof key === 'object' && index) {
      request = objectStore.openCursor(key[index]);
    } else {
      request = objectStore.openCursor(key);
    }
    request.onerror = (event: any) => {
      reject(
        new Error(`Indexed db objectStore getAll error. Tablename: ${tableName}. Event: ${JSON.stringify(event)}`)
      );
    };
    const res: any[] = [];
    request.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        res.push(cursor.value);
        cursor.continue();
      } else {
        resolve(res);
      }
    };
  });
}

async function put<EntityType>(
  db: IDBDatabase,
  tableName: EntityType,
  key: any,
  value: any
): Promise<object & { id: string }> {
  return new Promise((resolve, reject) => {
    const objectStore = indexedDBObjectStore(db, tableName as string);
    const objectStoreRequest = objectStore.put(value);
    objectStoreRequest.onerror = (event: any) => {
      reject(
        new Error(
          `Indexed db objectStore put error. Tablename: ${tableName}. Key: ${JSON.stringify(
            key
          )}. Event: ${JSON.stringify(event)}`
        )
      );
    };
    objectStoreRequest.onsuccess = () => {
      resolve(objectStoreRequest.result);
    };
  });
}

async function remove<EntityType>(db: IDBDatabase, tableName: EntityType, key: any): Promise<object & { id: string }> {
  return new Promise((resolve, reject) => {
    const objectStore = indexedDBObjectStore(db, tableName as string);
    const index = getIndex(key);
    let request: any;
    if (index) {
      request = objectStore.delete(key[index]);
    } else {
      request = objectStore.delete(key);
    }
    request.onerror = (event: any) => {
      reject(
        new Error(
          `Indexed db objectStore remove error. Tablename: ${tableName}. Key: ${JSON.stringify(
            key
          )}. Event: ${JSON.stringify(event)}`
        )
      );
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function getIndex(obj: any) {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  const keys = Object.keys(obj);
  if (keys.length > 1) {
    console.log(`ERROR: indexedDB expected only 1 key on the object. Found (${keys.length}): ${JSON.stringify(obj)}`);
  }
  return keys[0];
}
