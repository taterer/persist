# persist-indexed-db
For when things should be remembered. Useful for domain entities.
Implements the @taterer/persist interface

## What is it?
A wrapper for the browser API IndexedDB.

## Why?
The @taterer/persist interface enables use in entity services. See https://github.com/taterer/rx-entity

## Example use
```
import { from, Observable, Subscription } from 'rxjs'
import { map, shareReplay, takeUntil, withLatestFrom } from 'rxjs/operators'
import { indexedDbFactory } from '@taterer/persist-indexed-db'
import { concatMapPersist, concatMapRemove, Persistable, Persistence } from '@taterer/persist'

export enum IndexedDBEntity {
  view = 'view',
  datagrid = 'datagrid',
}

async function indexedDbPersistence (): Promise<Persistence<any & Persistable, IndexedDBEntity>> {
  const databaseName = 'db-tater-calc'

  try {
    // Increment the version number anytime the database schema changes
    const indexedDB = await indexedDbFactory(databaseName, 2, [
      {
        name: IndexedDBEntity.view,
        options: {
          keyPath: 'id'
        }
      },
      {
        name: IndexedDBEntity.datagrid,
        options: {
          keyPath: 'id'
        }
      },
    ])

    return indexedDB
  } catch (err) {
    console.log('Failed to create indexedDB persistence.', err)
    // return localstorage version
  }
}

export const indexedDB$ = from(indexedDbPersistence()).pipe(shareReplay(1))

export function withIndexedDB<Entity> () {
  return withLatestFrom<Entity, [Persistence<any & Persistable, IndexedDBEntity>]>(indexedDB$)
}
```
