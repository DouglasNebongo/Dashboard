

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { NextResponse } from 'next/server';
import { createUser } from '@/app/lib/auth';
import { addToQueue } from '@/app/lib/queue';
import { SignUpSchema } from '@/app/lib/schemas';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { prisma } from '@/app/lib/prisma';
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 m'),
});

export async function POST(request: Request) {
   const ip = request.headers.get('x-forwaded-for') || '';
   const { success } = await ratelimit.limit(ip);

   if(!success){
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
   }



  const { fullName, email, password, _nonce } = await request.json();
  const headers = request.headers;

  const requestId = headers.get('X-Request-ID');
  const nonce = headers.get('X-Nonce') || _nonce;

  
  console.log(`Signup attempt from IP: ${request.headers.get('x-forwarded-for')}`);
  console.log(`Attempting registration for: ${email}`);
  try {
    // create user
    SignUpSchema.parse({ fullName, email, password });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email }});     
    if(existingUser){
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    await createUser(fullName, email, password);
    await addToQueue(email);


    if (!process.env.NEXTAUTH_URL) {
      console.error("NEXTAUTH_URL environment variable is not set!");
      return NextResponse.json(
          { error: 'Server configuration error: Redirect URL missing.' },
          { status: 500 }
            );
      }
      const redirectUrl = new URL('/verify', process.env.NEXTAUTH_URL);
      redirectUrl.searchParams.set('email', email);
      console.log(`Generated redirect URL: ${redirectUrl.toString()}`);

    return NextResponse.json(
      { redirectUrl: redirectUrl.toString() },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      console.error('Error: This email is already registered');
      return NextResponse.json(
        { error: 'This email is already registered.' },
        { status: 400 }
      );
    } else {
      console.error('An unexpected error occurred:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { error: 'An unexpected error occurred: ' + errorMessage },
        { status: 400 }
      );
    }
  }
}