import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "@/app/lib/databaseUrl";

declare global {
    var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
});

const client = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.prisma = client;

export default client;