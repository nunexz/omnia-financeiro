require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('📧 Testando conexão com Gmail...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD existe?', process.env.EMAIL_PASSWORD ? 'SIM ✅' : 'NÃO ❌');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ ERRO na conexão:', error.message);
    console.error('Código do erro:', error.code);
  } else {
    console.log('✅ Conexão SMTP OK!');

    // Tentar enviar um email de teste
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'teste@example.com', // Não vai chegar a lugar nenhum, é só teste
      subject: 'Teste de Email',
      text: 'Este é um teste',
    }, (err, info) => {
      if (err) {
        console.error('❌ ERRO ao enviar email:', err.message);
      } else {
        console.log('✅ Email enviado com sucesso!');
        console.log('ID:', info.messageId);
      }
    });
  }
});
