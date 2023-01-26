import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  // Get the pathname of the request (e.g. /, /login)
  const pathname = req.nextUrl.pathname;

  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (pathname == '/') {
    return NextResponse.redirect(new URL('/calendar', req.url))
  }

  if (!session && pathname === '/calendar') {
    return NextResponse.redirect(new URL('/login', req.url));
  } else if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/calendar', req.url));
  }

  return NextResponse.next();
}
