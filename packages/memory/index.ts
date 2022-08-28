import { Persistable, Persistence } from "@taterer/persist";

type Schema = {
  name: string
}[]

export async function memoryFactory<T extends string> (schema: Schema): Promise<Persistence<any & Persistable, T>> {
  const database: { [key: string]: Map<string, object & { id: string }> } = {}

  for (const table of schema) {
    database[table.name] = new Map()
  }

  return {
    put: async (entity: string, key: string | { id: string }, value: any & Persistable) => {
      database[entity].set(typeof key === 'object' ? key.id : key, value)
      return value
    },
    get: async (entity: string, key: string | { id: string }) => {
      return database[entity].get(typeof key === 'object' ? key.id : key) as any & Persistable
    },
    remove: async (entity: string, key: string | { id: string }) => {
      database[entity].delete(typeof key === 'object' ? key.id : key)
      return (typeof key === 'object' ? key : { id: key }) as any & Persistable
    },
    query: async (entity: string, key?: string | { id: string }) => {
      if (key) {
        throw new Error("Key is not really a thing for memoryDB")
      }
      return Array.from(database[entity].values()) as any & Persistable[]
    }
  }
}
