export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
    const target = env.DATABASE_TARGET;
    if (target !== undefined && target !== "dev" && target !== "prod") {
        throw new Error("DATABASE_TARGET must be dev or prod");
    }
    const key = target === "dev" ? "DATABASE_URL_DEV" : target === "prod" ? "DATABASE_URL_PROD" : "DATABASE_URL";
    const url = env[key];
    if (!url?.trim()) throw new Error(`${key} is not configured`);
    return url;
}
