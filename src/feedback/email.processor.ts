import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

@Processor('email')
export class EmailProcessor {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    // Create Ethereal account for testing
    const testAccount = await nodemailer.createTestAccount();

    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('Ethereal Email Transporter Initialized');
    console.log(`User: ${testAccount.user}`);
  }

  @Process('feedback-ack')
  async handleFeedbackAck(job: Job) {
    const { userId, email, message } = job.data;
    console.log(`Processing feedback acknowledgement for user ${userId}...`);

    if (!this.transporter) {
      await this.initializeTransporter();
    }

    const info = await this.transporter.sendMail({
      from: '"GTD App" <no-reply@gtd-app.com>',
      to: email,
      subject: 'We received your feedback!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Thank you for your feedback!</h2>
          <p>We appreciate you taking the time to help us improve.</p>
          <hr />
          <p><strong>Your Message:</strong></p>
          <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
            ${message}
          </blockquote>
          <p>Best regards,<br>The GTD Team</p>
        </div>
      `,
    });

    console.log(`Feedback email sent: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  @Process('welcome-email')
  async handleWelcomeEmail(job: Job) {
    const { userId, email } = job.data;
    console.log(`Processing welcome email for ${email} (${userId})...`);

    if (!this.transporter) {
      await this.initializeTransporter();
    }

    const info = await this.transporter.sendMail({
      from: '"GTD App" <welcome@gtd-app.com>',
      to: email,
      subject: 'Welcome to GTD App!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Welcome to GTD! 🚀</h1>
          <p>We are excited to have you on board.</p>
          <p>Start by creating your first habit and tracking your progress.</p>
          <br />
          <a href="http://localhost:3000" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to App</a>
          <p>Best regards,<br>The GTD Team</p>
        </div>
      `,
    });

    console.log(`Welcome email sent: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
