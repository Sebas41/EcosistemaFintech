import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  await prisma.user.upsert({
    where: { email: "demo@fintech.local" },
    update: {},
    create: {
      email: "demo@fintech.local",
      passwordHash,
      categories: {
        create: [
          { name: "Alimentacion", monthlyBudget: 600000 },
          { name: "Transporte", monthlyBudget: 250000 },
          { name: "Servicios", monthlyBudget: 400000 },
          { name: "Entretenimiento", monthlyBudget: 300000 }
        ]
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
