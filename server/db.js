import { neon } from "@neondatabase/serverless";

let cachedSql;

export function getSql() {
    if(!process.env.DATABASE_URL){
        throw new Error("DATABASE_URL is missing. Add it to .env locally or Vercel environment variables.");
    }
    if(!cachedSql) cachedSql=neon(process.env.DATABASE_URL);
    return cachedSql;
}