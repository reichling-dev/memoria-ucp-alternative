// Email notification utilities
// This is a basic implementation - in production, use a service like SendGrid, Resend, or Nodemailer

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In production, implement actual email sending here
  // For now, this is a placeholder that logs to console
  
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('[Email] Email notifications disabled. Set EMAIL_ENABLED=true to enable.')
    console.log('[Email] Would send:', {
      to: options.to,
      subject: options.subject,
    })
    return false
  }

  // Example implementation with a service:
  // const response = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: process.env.EMAIL_FROM,
  //     to: options.to,
  //     subject: options.subject,
  //     html: options.html,
  //   }),
  // })
  // return response.ok

  console.log('[Email] Sending email:', options)
  return true
}

export function generateApplicationStatusEmail(
  recipientName: string,
  status: 'approved' | 'denied',
  reason?: string
): EmailOptions {
  const isApproved = status === 'approved'
  
  return {
    to: '', // Will be set by caller
    subject: `Your Application Has Been ${isApproved ? 'Approved' : 'Denied'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isApproved ? '#10b981' : '#ef4444'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .status { font-size: 24px; font-weight: bold; margin: 10px 0; }
          .reason { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application ${isApproved ? 'Approved' : 'Denied'}</h1>
          </div>
          <div class="content">
            <p>Hello ${recipientName},</p>
            <p>Your whitelist application has been <strong>${status}</strong>.</p>
            ${reason ? `
              <div class="reason">
                <strong>Reviewer Notes:</strong><br>
                ${reason}
              </div>
            ` : ''}
            ${isApproved ? `
              <p>Congratulations! You can now join the server.</p>
            ` : `
              <p>If you have any questions, please contact an administrator.</p>
            `}
            <p>Best regards,<br>Server Administration Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${recipientName},

Your whitelist application has been ${status}.

${reason ? `Reviewer Notes: ${reason}\n\n` : ''}
${isApproved ? 'Congratulations! You can now join the server.' : 'If you have any questions, please contact an administrator.'}

Best regards,
Server Administration Team
    `.trim(),
  }
}
