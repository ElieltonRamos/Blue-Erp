import { PrismaClient } from 'generated/prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  const users = [
    { username: 'Andrei', password: '12345678', role: 'garcom' },
    { username: 'Aleff', password: '@Factor123', role: 'garcom' },
    { username: 'Cauaale', password: '123456', role: 'garcom' },
    { username: 'MariaLuiza', password: '250640', role: 'garcom' },
    { username: 'Murilo', password: 'Murilo123', role: 'admin' },
    { username: 'Renan', password: 'renan123', role: 'admin' },
    { username: 'Luciana', password: 'luciana123', role: 'admin' },
    { username: 'domjuan', password: 'cozinha123', role: 'cozinheiro' },
    { username: 'Root', password: 'impostoeroubo', role: 'admin' },
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
