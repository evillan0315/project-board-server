import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Client as PgClient } from 'pg';
import * as mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { CreateTableDto } from './dto/create-table.dto';
import { ExecuteSqlDto } from './dto/execute-sql.dto';

export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface TableInfo {
  tableName: string;
  columns: TableColumn[];
}

export interface MongoField {
  fieldName: string;
  fieldType: string;
}
@Injectable()
export class DatabaseService {
  constructor(private readonly configService: ConfigService) {}

  async getAllTables(
    connectionString: string,
    dbType: 'postgres' | 'mysql' | 'mongodb',
  ): Promise<TableInfo[]> {
    try {
      switch (dbType) {
        case 'postgres':
          return await this.getPostgresTables(connectionString);
        case 'mysql':
          return await this.getMysqlTables(connectionString);
        case 'mongodb':
          return await this.getMongoCollections(connectionString);
        default:
          throw new BadRequestException(`Unsupported database type: ${dbType}`);
      }
    } catch (error) {
      console.error(`[DatabaseService] getAllTables error:`, error);
      throw new InternalServerErrorException(
        `Failed to retrieve tables from ${dbType} database.`,
      );
    }
  }

  private async getPostgresTables(
    connectionString: string,
  ): Promise<TableInfo[]> {
    const client = new PgClient({ connectionString });

    try {
      await client.connect();

      const tableResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE';
      `);

      const tables = tableResult.rows.map((row) => row.table_name);
      const tableDetails: TableInfo[] = [];

      for (const tableName of tables) {
        const columnResult = await client.query(
          `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1;
        `,
          [tableName],
        );

        tableDetails.push({
          tableName,
          columns: columnResult.rows,
        });
      }

      return tableDetails;
    } catch (error) {
      console.error(`[DatabaseService] getPostgresTables error:`, error);
      throw new InternalServerErrorException(
        'Failed to fetch PostgreSQL tables.',
      );
    } finally {
      await client
        .end()
        .catch((err) =>
          console.warn(
            'Failed to close PostgreSQL connection gracefully:',
            err,
          ),
        );
    }
  }

  private async getMysqlTables(connectionString: string): Promise<TableInfo[]> {
    let connection: mysql.Connection | undefined;

    try {
      connection = await mysql.createConnection(connectionString);

      const [tables] = await connection.query(
        `SELECT table_name AS TABLE_NAME 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE();`,
      );

      const tableDetails: TableInfo[] = [];

      for (const row of tables as any[]) {
        const tableName = row.TABLE_NAME;

        const [columns] = await connection.query(
          `SELECT column_name AS COLUMN_NAME, 
                data_type AS DATA_TYPE, 
                is_nullable AS IS_NULLABLE, 
                column_default AS COLUMN_DEFAULT
         FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ?`,
          [tableName],
        );

        const normalizedColumns: TableColumn[] = (columns as any[]).map(
          (col) => ({
            column_name: col.COLUMN_NAME,
            data_type: col.DATA_TYPE,
            is_nullable: col.IS_NULLABLE,
            column_default: col.COLUMN_DEFAULT,
          }),
        );

        tableDetails.push({
          tableName,
          columns: normalizedColumns,
        });
      }

      return tableDetails;
    } catch (error) {
      console.error('[DatabaseService] getMysqlTables error:', error);
      throw new InternalServerErrorException('Failed to fetch MySQL tables.');
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (endErr) {
          console.warn('Failed to close MySQL connection:', endErr);
        }
      }
    }
  }
  private async getMongoCollections(
    connectionString: string,
  ): Promise<TableInfo[]> {
    let mongoClient: MongoClient | null = null;

    try {
      mongoClient = new MongoClient(connectionString);
      await mongoClient.connect();

      const db = mongoClient.db();
      const collections = await db.collections();

      const collectionDetails: TableInfo[] = [];

      for (const collection of collections) {
        const sampleDoc = await collection.findOne({});
        const columns: TableColumn[] = sampleDoc
          ? Object.entries(sampleDoc).map(([key, value]) => ({
              column_name: key,
              data_type: typeof value,
              is_nullable: 'YES', // MongoDB fields are nullable by default
              column_default: null,
            }))
          : [];

        collectionDetails.push({
          tableName: collection.collectionName,
          columns,
        });
      }

      return collectionDetails;
    } catch (error) {
      console.error('[DatabaseService] getMongoCollections error:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve MongoDB collections.',
      );
    } finally {
      if (mongoClient) {
        try {
          await mongoClient.close();
        } catch (closeErr) {
          console.warn('Failed to close MongoDB connection:', closeErr);
        }
      }
    }
  }
  async getTableColumns(
    connectionString: string,
    tableName: string,
    filters?: { columnName?: string; dataType?: string; isNullable?: string },
  ): Promise<any[]> {
    const client = new PgClient({ connectionString });
    //const client = new Client({ connectionString });

    try {
      await client.connect();

      const queryParts = [
        `SELECT column_name, data_type, is_nullable, column_default`,
        `FROM information_schema.columns`,
        `WHERE table_schema = 'public' AND table_name = $1`,
      ];
      const values: any[] = [tableName];
      let paramIndex = 2;

      if (filters?.columnName) {
        queryParts.push(`AND column_name ILIKE $${paramIndex++}`);
        values.push(`%${filters.columnName}%`);
      }
      if (filters?.dataType) {
        queryParts.push(`AND data_type = $${paramIndex++}`);
        values.push(filters.dataType);
      }
      if (filters?.isNullable) {
        queryParts.push(`AND is_nullable = $${paramIndex++}`);
        values.push(filters.isNullable);
      }

      const query = queryParts.join(' ');
      const result = await client.query(query, values);

      return result.rows;
    } catch (error) {
      console.error(`Failed to fetch columns for table "${tableName}":`, error);
      throw error;
    } finally {
      await client.end();
    }
  }
  async createTable(
    dto: CreateTableDto & { dbType: 'postgres' | 'mysql' | 'mongodb' },
  ): Promise<string> {
    const { connectionString, tableName, columns, dbType } = dto;

    switch (dbType) {
      case 'postgres': {
        const client = new PgClient({ connectionString });

        // Build column definitions for Postgres
        const columnDefinitions = columns
          .map(
            ({ columnName, dataType }) =>
              `"${columnName.replace(/"/g, '""')}" ${dataType}`,
          )
          .join(', ');

        const createQuery = `CREATE TABLE IF NOT EXISTS "${tableName.replace(
          /"/g,
          '""',
        )}" (${columnDefinitions});`;

        try {
          await client.connect();
          await client.query(createQuery);
          return `Postgres table "${tableName}" created successfully.`;
        } catch (error) {
          console.error('Failed to create Postgres table:', error);
          throw error;
        } finally {
          await client.end();
        }
      }

      case 'mysql': {
        const connection = await mysql.createConnection(connectionString);

        // Build column definitions for MySQL
        // Note: MySQL uses backticks (`) for identifiers instead of double quotes
        const columnDefinitions = columns
          .map(
            ({ columnName, dataType }) =>
              `\`${columnName.replace(/`/g, '``')}\` ${dataType}`,
          )
          .join(', ');

        const createQuery = `CREATE TABLE IF NOT EXISTS \`${tableName.replace(
          /`/g,
          '``',
        )}\` (${columnDefinitions});`;

        try {
          await connection.execute(createQuery);
          return `MySQL table "${tableName}" created successfully.`;
        } catch (error) {
          console.error('Failed to create MySQL table:', error);
          throw error;
        } finally {
          await connection.end();
        }
      }

      case 'mongodb': {
        const mongoClient = new MongoClient(connectionString);

        try {
          await mongoClient.connect();
          const db = mongoClient.db();

          // In MongoDB, collections are created implicitly when inserting documents.
          // You can create an empty collection explicitly:
          const collections = await db
            .listCollections({ name: tableName })
            .toArray();
          if (collections.length === 0) {
            await db.createCollection(tableName);
            return `MongoDB collection "${tableName}" created successfully.`;
          } else {
            return `MongoDB collection "${tableName}" already exists.`;
          }
        } catch (error) {
          console.error('Failed to create MongoDB collection:', error);
          throw error;
        } finally {
          await mongoClient.close();
        }
      }

      default:
        throw new Error('Unsupported database type');
    }
  }
  async executeSql(dto: ExecuteSqlDto): Promise<any> {
    const { sql, dbType } = dto;
    const connectionString =
      dto.connectionString || this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('Connection string is missing');
    }

    switch (dbType) {
      case 'postgres':
        return this.executePostgresSql(connectionString, sql);
      case 'mysql':
        return this.executeMysqlSql(connectionString, sql);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  private async executePostgresSql(connectionString: string, sql: string) {
    let client: PgClient | null = null;
    try {
      console.log(sql, 'sql');
      client = new PgClient({ connectionString });
      await client.connect();
      const result = await client.query(sql);
      return result.rows ?? result;
    } catch (error) {
      console.error('[PostgresSQL] Execution error:', error);
      throw new Error(
        'PostgreSQL execution failed: ' + (error as Error).message,
      );
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (closeErr) {
          console.warn('[PostgresSQL] Failed to close connection:', closeErr);
        }
      }
    }
  }

  private async executeMysqlSql(connectionString: string, sql: string) {
    let connection: mysql.Connection | null = null;
    try {
      connection = await mysql.createConnection(connectionString);
      const [rows] = await connection.query(sql);
      return rows;
    } catch (error) {
      console.error('[MySQL] Execution error:', error);
      throw new Error('MySQL execution failed: ' + (error as Error).message);
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (closeErr) {
          console.warn('[MySQL] Failed to close connection:', closeErr);
        }
      }
    }
  }
}
