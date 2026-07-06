import { PrismaClient } from 'generated/prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  const users = [
    { username: 'root', password: 'impostoeroubo', role: 'admin' },
    { username: 'renan', password: 'renan123', role: 'admin' },
    { username: 'admin_test', password: 'admin123', role: 'admin' },
    { username: 'garcom_test', password: 'garcom123', role: 'garcom' },
    {
      username: 'cozinheiro_test',
      password: 'cozinha123',
      role: 'cozinheiro',
    },
  ];

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        password: hashed,
        role: user.role,
        workplace: '',
        active: true,
      },
    });
  }

  console.log('✓ Users seed');
}
