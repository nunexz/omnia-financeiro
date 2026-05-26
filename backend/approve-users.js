const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function approveUsers() {
  const emails = [
    'nunes.morato@gmail.com',
    'nunes.calvoso@gmail.com',
    'nunes.morato2323@gmail.com',
    'nunes.morato2424@gmail.com'
  ];

  try {
    console.log('🔄 Aprovando usuários...');

    for (const email of emails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        await prisma.user.update({
          where: { email },
          data: {
            status: 'active',
            approvedAt: new Date(),
            is_admin: true
          }
        });
        console.log(`✅ ${email} - APROVADO`);
      } else {
        console.log(`⚠️  ${email} - Não encontrado`);
      }
    }

    console.log('\n✅ Todos os usuários foram aprovados!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

approveUsers();
