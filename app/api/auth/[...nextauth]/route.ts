// app/api/auth/[...nextauth]/route.ts
// import { handlers } from "@/app/lib/auth";


// export { handlers as GET, handlers as POST };

// import NextAuth from "next-auth";
// import { authOptions } from "@/app/lib/auth";

//  const handler = NextAuth(authOptions);

//  export { handler as GET, handler as POST };





import { validateVerificationCode } from '@/app/lib/auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Session, User } from "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      emailVerified?: boolean;
    } & DefaultSession["user"];
  }
}
const prisma = new PrismaClient();

const customPrismaAdapter = PrismaAdapter(prisma);


customPrismaAdapter.createUser = async (data: any) => {
  return prisma.user.create({
    data: {
      ...data,
      emailVerified: true,
    },
  });
};


export const authOptions = {

  //adapter: PrismaAdapter(prisma),
  adapter: customPrismaAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        console.log(profile);
        return {
          id: profile.sub,
          fullName: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: true, // Google-verified emails are immediately marked verified
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
      async authorize(credentials) {
        if (!credentials) return null;

        // Check if verifying with code
        if(credentials.code){
          const isValid = await validateVerificationCode(credentials.email, credentials.code);
          if (!isValid) return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null
        // If using code verification
        if (credentials.code) {
          if (!user.emailVerified) return null;
          return { id: user.id.toString(), email: user.email, fullName: user.fullName };
        }
      
        // If using password
        const isValidPassword = user.password ? await bcrypt.compare(credentials.password, user.password) : false;
        if (!isValidPassword || !user.emailVerified) return null;

        return { id: user.id.toString(), email: user.email, fullName: user.fullName };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
      
    },
    async session({ session, token, user }: { session: Session; token: JWT; user: User }) {
      session.user = {
        id:  token.sub || user?.id,
        email: token.email,
        name: token.name,
      };
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            if (url.startsWith(baseUrl) && !url.includes("/dashboard")) return url;
            return `${baseUrl}/dashboard`;
    },        
  },
    session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };