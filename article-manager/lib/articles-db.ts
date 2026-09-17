import { env } from 'cloudflare:workers';
export function articlesDb(){const db=(env as unknown as {DB:D1Database}).DB;if(!db)throw new Error('Database unavailable');return db;}

export function githubReadToken(){return (env as unknown as {GITHUB_READ_TOKEN?:string}).GITHUB_READ_TOKEN;}
