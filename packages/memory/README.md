# persist-memory
For when things should be remembered. Useful for domain entities.
Implements the @taterer/persist interface

## What is it?
A basic in-memory database, implemented with simply a Map.

## Why?
The @taterer/persist interface enables use in entity services. See https://github.com/taterer/rx-entity

## Example use
```
import { from, shareReplay, withLatestFrom } from "rxjs"
import { Persistable, Persistence } from "@taterer/persist"
import { memoryFactory } from "@taterer/persist-memory"

export enum MemoryEntity {
  line = 'line',
  shape = 'shape',
}

export async function memoryPersistence (): Promise<Persistence<any & Persistable, MemoryEntity>> {
  return memoryFactory<MemoryEntity>([
    {
      name: MemoryEntity.line,
    },
    {
      name: MemoryEntity.shape,
    },
  ])
}

export const memoryDB$ = from(memoryPersistence()).pipe(shareReplay(1))

export function withMemoryDB<T> () {
  return withLatestFrom<T, [Persistence<any & Persistable, MemoryEntity>]>(memoryDB$)
}
```
