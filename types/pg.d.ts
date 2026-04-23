declare module 'pg' {
  export class Client {
    constructor(config: {
      connectionString: string
    })

    connect(): Promise<void>
    query<T = Record<string, unknown>>(
      queryText: string,
      values?: readonly unknown[],
    ): Promise<{
      rows: T[]
    }>
    end(): Promise<void>
  }
}
