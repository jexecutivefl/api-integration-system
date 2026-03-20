import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/api_integration_dev",
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
