import { createTransport } from "nodemailer";
import { NextResponse } from "next/server";


const transporter = createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });


export async function sendEmail({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });
  
      console.log("Email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }


  export async function sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  
    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
    });
  }



  export async function GET() {
    try {
      await sendEmail({
        to: "nebongo26@gmail.com",
        subject: "Test Email",
        text: "This is a test email.",
      });
  
      return NextResponse.json({ message: "Email sent successfully" });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  }