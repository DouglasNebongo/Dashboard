import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const requestCounts = new Map<string, { count: number, timestamp: number }>();

//rate limit config
const RATE_LIMIT_WINDOW: number = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS: number = 100;

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  const ip: string = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  //rate limit

  const currentTime: number = Date.now();
  const userKey: string = token?.sub || ip;

  if(!requestCounts.has(userKey)){
     requestCounts.set(userKey, { count: 1, timestamp: currentTime });
  } else {
     const userRequestData = requestCounts.get(userKey);

     if(userRequestData) {

      if((currentTime - userRequestData.timestamp) > RATE_LIMIT_WINDOW){
        userRequestData.count = 1;
        userRequestData.timestamp = currentTime;
      } else {
          userRequestData.count += 1;

          if(userRequestData.count > RATE_LIMIT_MAX_REQUESTS){
            return new NextResponse('Too many requests. Please try again later.', {
              status: 429,
            });
          }
      }

      requestCounts.set(userKey, userRequestData);
     }
  }

  // redirect unauthenticated users away from protected routes
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/customers/create'))) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // redirect authenticated users away from auth-related routes
  if (token && (pathname === '/' || pathname.startsWith('/auth'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};