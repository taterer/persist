import { concatMap, filter, map, mergeWith, Observable, ObservableInput, take, tap } from 'rxjs';
import { v4 as uuid } from 'uuid';

export type Persistable = {
  id: string;
};

export type Persistence<Entity, PersistenceEntityType> = {
  get: (entity: PersistenceEntityType, key: string | { id: string }) => Promise<(Entity & Persistable) | undefined>;
  indexedDB?: any;
  put: (entity: PersistenceEntityType, key: string | { id: string }, value: any) => Promise<Entity & Persistable>;
  query: (entity: PersistenceEntityType, key?: string | { id: string }) => Promise<Entity & Persistable[]>;
  remove: (entity: PersistenceEntityType, key: string | { id: string }) => Promise<Entity & Persistable>;
};

export function toPersistable<T>(value: T & { id?: string }): T & { id: string } {
  if (!value.id) {
    value.id = uuid();
  }
  return value as T & { id: string };
}

export function mapToPersistable<T>() {
  return map<T & { id?: string }, T & Persistable>(toPersistable);
}

export function concatMapPersist<Entity, PersistenceEntityType>(entity: PersistenceEntityType) {
  return concatMap<[Persistable, Persistence<Entity, PersistenceEntityType>], any>(([value, persistence]) =>
    persistence.put(entity, { id: value.id }, value)
  );
}

export function concatMapRemove<Entity, PersistenceEntityType>(entity: PersistenceEntityType) {
  return concatMap<[Persistable, Persistence<Entity, PersistenceEntityType>], any>(([value, persistence]) =>
    persistence.remove(entity, value)
  );
}

export function entityGetFactory<Entity, PersistenceEntityType>(
  persistence$: Observable<Persistence<Persistable, PersistenceEntityType>>,
  entityType: PersistenceEntityType
): (id: string) => Promise<Entity> {
  return function (id: string): Promise<Entity> {
    return new Promise((resolve) => {
      persistence$
        .pipe(
          concatMap<Persistence<Persistable, PersistenceEntityType>, ObservableInput<Entity>>(
            (db) => db.get(entityType, id) as Promise<Entity>
          ),
          take(1)
        )
        .subscribe(entity => {
          resolve(entity);
        });
    });
  };
}

export function entityGetWaitForItFactory<Entity extends Persistable, PersistenceEntityType>(
  persistence$: Observable<Persistence<Persistable, PersistenceEntityType>>,
  entityType: PersistenceEntityType,
  entity$: Observable<Entity>
): (id: string) => Promise<Entity> {
  return function (id: string): Promise<Entity> {
    return new Promise((resolve) => {
      persistence$
        .pipe(
          concatMap<Persistence<Persistable, PersistenceEntityType>, ObservableInput<Entity>>(
            (db) => db.get(entityType, id) as Promise<Entity>
          ),
          mergeWith(entity$),
          filter(i => i?.id === id),
          take(1)
        )
        .subscribe(entity => {
          resolve(entity);
        });
    });
  };
}
