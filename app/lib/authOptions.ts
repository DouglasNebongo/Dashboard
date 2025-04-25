
import { validateVerificationCode } from '@/app/lib/auth';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/app/lib/prisma';
import { DefaultSession, DefaultUser } from "next-auth";
import bcrypt from 'bcrypt';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified?: boolean;
    } & DefaultSession["user"];
  }
}

const createCustomPrismaAdapter = () => {
  const adapter = PrismaAdapter(prisma);
  
  return {
    ...adapter,
    createUser: (data: any) => prisma.user.create({
      data: { ...data, emailVerified: true }
    })
  };
};

const getGoogleCredentials = () => {
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth environment variables not configured');
  }

  return { clientId, clientSecret };
};



const authorizeCredentials = async (credentials?: Record<string, string>) => {
  if (!credentials) return null;

  const { email, password, code } = credentials;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return null;
  if (code) {
    const isValidCode = await validateVerificationCode(email, code);
    if (!isValidCode) return null;
    return user;
  }

  if (password) {
    const isValidPassword = user.password 
      ? await bcrypt.compare(password, user.password)
      : false;
    return isValidPassword && user.emailVerified ? user : null;
  }

  return null;
};

export const authOptions: NextAuthOptions = {
  adapter: createCustomPrismaAdapter(),
  providers: [
    GoogleProvider({
      ...getGoogleCredentials(),
      profile(profile) {
        return {
          id: profile.sub,
          fullName: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: true,
        };
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        code: { label: "Verification Code", type: "text" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user = {
        id: token.sub || '',
        email: token.email,
        name: token.name,
        emailVerified: token.emailVerified as boolean | undefined,
      };
      return session;
    },
    redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) && !url.includes("/dashboard")
        ? url
        : `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
} satisfies NextAuthOptions;