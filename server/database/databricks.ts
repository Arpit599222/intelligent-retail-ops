import { DBSQLClient } from '@databricks/sql';
import dotenv from 'dotenv';

dotenv.config();

const { DATABRICKS_HOST, DATABRICKS_HTTP_PATH, DATABRICKS_TOKEN, DATABRICKS_CATALOG, DATABRICKS_SCHEMA } = process.env;

if (!DATABRICKS_HOST || !DATABRICKS_HTTP_PATH || !DATABRICKS_TOKEN) {
  console.error('Missing required Databricks connection env vars: DATABRICKS_HOST, DATABRICKS_HTTP_PATH, DATABRICKS_TOKEN');
}

const client = new DBSQLClient();
let isConnected = false;

export async function getConnection() {
  if (!isConnected) {
    await client.connect({
      host: DATABRICKS_HOST || '',
      path: DATABRICKS_HTTP_PATH || '',
      token: DATABRICKS_TOKEN || '',
    });
    isConnected = true;
  }
  return client;
}

export async function query<T = any>(sql: string, params?: Record<string, any>): Promise<T[]> {
  const conn = await getConnection();
  const session = await conn.openSession({
    initialCatalog: DATABRICKS_CATALOG || 'logistics_os',
    initialSchema: DATABRICKS_SCHEMA || 'identity_management'
  });
  
  try {
    let formattedSql = sql;
    // Replace named parameters (:param) with values for basic substitution
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        const valStr = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : (value === null ? 'NULL' : value);
        formattedSql = formattedSql.replace(new RegExp(`:${key}\\b`, 'g'), () => valStr as string);
      }
    }
    
    console.log('[Databricks SQL] Executing:', formattedSql);
    const queryOperation = await session.executeStatement(formattedSql);
    const result = await queryOperation.fetchAll();
    await queryOperation.close();
    return result as T[];
  } finally {
    await session.close();
  }
}

export function table(name: string, schema: string = DATABRICKS_SCHEMA || 'identity_management'): string {
  const catalog = DATABRICKS_CATALOG || 'logistics_os';
  return `${catalog}.${schema}.${name}`;
}
