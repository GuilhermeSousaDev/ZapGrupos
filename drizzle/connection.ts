import type { ConnectionOptions } from "mysql2/promise";

/**
 * Constrói as opções de conexão MySQL a partir de DATABASE_URL.
 *
 * SSL é habilitado automaticamente para hosts remotos (Railway, PlanetScale,
 * etc.), que derrubam conexões sem TLS — causa do erro PROTOCOL_CONNECTION_LOST.
 * Para localhost o SSL fica desligado. Use DATABASE_SSL=true|false para forçar.
 */
export function getMysqlConfig(): ConnectionOptions {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to connect to the database");
  }

  const parsed = new URL(url);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  const useSsl =
    process.env.DATABASE_SSL === "true" ||
    (!isLocal && process.env.DATABASE_SSL !== "false");

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ...(useSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}
