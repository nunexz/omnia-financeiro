import nodemailer from 'nodemailer'

// Criar transporter com Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const emailService = {
  async sendAdminInvite(email: string, token: string, inviteUrl: string) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🎉 Você foi convidado para ser Administrador - Controle Financeiro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">Bem-vindo, Administrador!</h1>
            </div>

            <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px;">Olá,</p>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Você foi convidado para ser <strong>Administrador</strong> no sistema <strong>Controle Financeiro</strong>.
              </p>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Clique no botão abaixo para aceitar o convite e ativar suas permissões de administrador:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Aceitar Convite
                </a>
              </div>

              <p style="color: #999; font-size: 12px; line-height: 1.6;">
                <strong>Ou copie este link:</strong><br/>
                <code style="background: #eee; padding: 5px 10px; border-radius: 3px; display: block; margin-top: 5px; word-break: break-all;">
                  ${inviteUrl}
                </code>
              </p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

              <p style="color: #999; font-size: 12px;">
                Este convite expira em 7 dias.<br/>
                Se você não solicitou esse convite, ignore este email.
              </p>
            </div>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      return { success: true }
    } catch (error: any) {
      console.error('Email send error:', error)
      throw new Error(`Falha ao enviar email: ${error.message}`)
    }
  },

  async sendAccessApprovedEmail(email: string, nome: string) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '✅ Seu acesso foi aprovado - Controle Financeiro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Acesso Aprovado!</h1>
            </div>

            <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px;">Olá ${nome},</p>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Sua solicitação de acesso foi <strong>aprovada</strong>! 🎉
              </p>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Agora você pode fazer login e começar a usar o <strong>Controle Financeiro</strong>.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://seu-app.com'}/login" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Fazer Login
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

              <p style="color: #999; font-size: 12px;">
                Se tiver dúvidas, entre em contato conosco.
              </p>
            </div>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      return { success: true }
    } catch (error: any) {
      console.error('Email send error:', error)
      throw new Error(`Falha ao enviar email: ${error.message}`)
    }
  },
}
