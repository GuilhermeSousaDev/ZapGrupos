import { defineConfig } from "drizzle-kit";
import { getMysqlConfig } from "./drizzle/connection";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: getMysqlConfig(),
});
