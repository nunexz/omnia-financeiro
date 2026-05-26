require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testInvite() {
  try {
    console.log('🧪 Testando criação de invite...\n');

    // Simular dados da request
    const email = 'teste.invite@example.com';
    const adminId = 'test-admin-id';

    console.log('📧 Email:', email);
    console.log('👤 Admin ID:', adminId);

    // Gerar token
    const token = crypto.randomBytes(32).toString('hex');
    console.log('🔐 Token:', token.substring(0, 10) + '...');

    // Tentar criar invite
    console.log('\n⏳ Criando AdminInvite...');

    const invite = await prisma.adminInvite.create({
      data: {
        email,
        token,
        createdBy: adminId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    console.log('✅ AdminInvite criado com sucesso!');
    console.log('ID:', invite.id);
    console.log('Email:', invite.email);
    console.log('Status:', invite.status);
    console.log('Expira em:', invite.expiresAt);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Detalhes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvite();
