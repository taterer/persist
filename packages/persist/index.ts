import { v4 as uuid } from 'uuid'
import { concatMap, map } from "rxjs"

export type Persistable = {
  id: string
  created_at: number
}

export type Persistence<Entity, PersistenceEntityType> = {
  indexedDB?: any
  put: (entity: PersistenceEntityType, key: string | { id: string }, value: any) => Promise<Entity & Persistable>
  get: (entity: PersistenceEntityType, key: string | { id: string }) => Promise<Entity & Persistable | undefined>
  query: (entity: PersistenceEntityType, key?: string | { id: string }) => Promise<Entity & Persistable[]>
  remove: (entity: PersistenceEntityType, key: string | { id: string }) => Promise<Entity & Persistable>
}

export function toPersistable (value) {
  if (!value.id) {
    value.id = uuid()
  }
  if (!value.created_at) {
    value.created_at = Date.now()
  }
  return value
}

export function mapToPersistable<T> () {
  return map<T, T & Persistable>(toPersistable)
}

export function concatMapPersist<Entity, PersistenceEntityType> (entity: PersistenceEntityType) {
  return concatMap<[Persistable, Persistence<Entity, PersistenceEntityType>], any>(([value, persistence]) => persistence.put(entity, { id: value.id }, value))
}

export function concatMapRemove<Entity, PersistenceEntityType> (entity: PersistenceEntityType) {
  return concatMap<[Persistable, Persistence<Entity, PersistenceEntityType>], any>(([value, persistence]) => persistence.remove(entity, value))
}
