import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const prisma =
  ((globalThis as any).$prisma as PrismaClient) || prismaClientSingleton();

if (process.env.NODE_ENV !== "production")
  (globalThis as any).$prisma = prisma as PrismaClient;

export default prisma;
