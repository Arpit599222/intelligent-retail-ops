import { getConnection as getDatabricksConnection, query as databricksQuery, table as databricksTable } from './database/databricks.js';

export async function getConnection() {
  return getDatabricksConnection();
}

export async function query<T = any>(sql: string, params?: Record<string, any>): Promise<T[]> {
  return databricksQuery<T>(sql, params);
}

export function table(name: string): string {
  // Original routes assume the logistics_os schema.
  return databricksTable(name, 'logistics_os');
}



