import { concatMap, map } from 'rxjs';
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
