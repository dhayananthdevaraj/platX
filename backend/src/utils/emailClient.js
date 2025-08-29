const { EmailClient } = require('@azure/communication-email');

const sendOnboardingEmail = async ({ toEmail, name, role, password }) => {
  try {
    const connectionString = process.env['AZURE_COMM_CONNECTION_STRING'];
    const senderAddress = process.env['SENDER_EMAIL_ADDRESS'];
    const client = new EmailClient(connectionString);

    const emailMessage = {
      senderAddress,
      content: {
        subject: "Welcome to Our Platform! EduTrack",
        plainText: `Hi ${name}, You have been onboarded to our platform.`,
        html: `
          <html>
            <body>
              <p>Hi ${name},</p>
              <p>You have been onboarded to our platform as a <strong>${role}</strong>.</p>
              <p><strong>Email:</strong> ${toEmail}<br/><strong>Password:</strong> ${password}</p>
              <p>Please log in and change your password after your first login.</p>
              <p>Thanks,<br/>Team</p>
            </body>
          </html>`,
      },
      recipients: {
        to: [{ address: toEmail }],
      },
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    console.log('Email send status:', result.status);
  } catch (error) {
    console.error('Email sending failed:', error.message);
  }
};

const sendPasswordResetEmail = async ({ toEmail, name, resetLink }) => {
  try {    
    const connectionString = process.env['AZURE_COMM_CONNECTION_STRING'];
    const senderAddress = process.env['SENDER_EMAIL_ADDRESS'];
    const client = new EmailClient(connectionString);

    const emailMessage = {
      senderAddress,
      content: {
        subject: "Password Reset Request",
        plainText: `Hi ${name}, You requested a password reset. Click the link below to reset your password.`,
        html: `
          <html>
            <body>
              <p>Hi ${name},</p>
              <p>You requested a password reset. Click the link below to reset your password:</p>
              <p><a href="${resetLink}">Reset Password</a></p>
              <p>If you did not request this, please ignore this email.</p>
              <p>Thanks,<br/>Team</p>
            </body>
          </html>`,
      },
      recipients: {
        to: [{ address: toEmail }],
      },
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    console.log('Password reset email status:', result.status);
  } catch (error) {
    console.error('Password reset email sending failed:', error.message);
  }
}


module.exports = {
  sendOnboardingEmail,
  sendPasswordResetEmail
};
