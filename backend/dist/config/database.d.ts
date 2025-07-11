import { Pool } from 'pg';
declare const pool: Pool;
declare const testConnection: () => Promise<void>;
declare const initialize: () => Promise<void>;
export { pool, initialize, testConnection };
//# sourceMappingURL=database.d.ts.map