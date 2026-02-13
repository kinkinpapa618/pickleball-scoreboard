import * as drizzleKit from "drizzle-kit";

export default drizzleKit.defineConfig({
    out: "./drizzle",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
