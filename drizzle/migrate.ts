import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { getMysqlConfig } from "./connection";

// Migrate resiliente: o proxy público do Railway derruba conexões
// intermitentemente (PROTOCOL_CONNECTION_LOST). O drizzle-kit não tenta de novo,
// então rodamos o migrator programaticamente com retry e backoff.
const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 3000;

// Só vale retentar erros de conexão/rede. Senha errada, banco inexistente, etc.
// não melhoram com retry — falha rápido pra deixar a causa óbvia no log.
const TRANSIENT_CODES = new Set([
  "PROTOCOL_CONNECTION_LOST",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "PROTOCOL_SEQUENCE_TIMEOUT",
]);

async function run() {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let connection: mysql.Connection | undefined;
    try {
      connection = await mysql.createConnection({
        ...getMysqlConfig(),
        connectTimeout: 20000,
      });
      const db = drizzle(connection);
      await migrate(db, { migrationsFolder: "./drizzle" });
      await connection.end();
      console.log(`✅ Migrations aplicadas com sucesso (tentativa ${attempt}).`);
      return;
    } catch (err) {
      lastErr = err;
      if (connection) {
        try {
          await connection.end();
        } catch {
          /* ignore */
        }
      }
      const code = (err as { code?: string }).code ?? "";
      const msg = (err as Error).message ?? String(err);
      console.warn(`⚠️  Migrate tentativa ${attempt}/${MAX_RETRIES} falhou: ${code} ${msg}`);
      if (!TRANSIENT_CODES.has(code)) {
        console.error(`❌ Erro não-transiente (${code}) — sem retry.`);
        throw err;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  console.error("❌ Migrate falhou após todas as tentativas.");
  throw lastErr;
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
