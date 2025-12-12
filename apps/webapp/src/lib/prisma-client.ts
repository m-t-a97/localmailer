import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import ENV_CONFIG from "@/config/env-config";

const adapter = new PrismaPg({ connectionString: ENV_CONFIG.databaseUrl });
const prisma = new PrismaClient({ adapter });

export default prisma;
