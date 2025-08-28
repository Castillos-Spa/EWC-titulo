// prisma/seed.ts
import { PrismaClient, Role, Permission } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      username: 'john',
      email: 'john@example.com',
      area: 'Administración',
      password: hashedPassword,
      roles: [Role.Admin],
      permissions: Object.values(Permission),
    },
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
