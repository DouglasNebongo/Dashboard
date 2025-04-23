import { prisma } from "@/app/lib/prisma";
import { createTransport } from "nodemailer";
import { randomUUID } from "crypto";
import { generateVerificationCode } from "@/app/lib/auth";

const transport = createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD
    }
  });

export async function sendVerificationEmail(email: string, code: string) {

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your email",
    html: `
      <h1>Your Verification Code: ${code}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>Or click here to verify: 
        <a href="${process.env.NEXTAUTH_URL}/verify?email=${encodeURIComponent(email)}">
          Verify Email
        </a>
      </p>
    `,
  });
}

