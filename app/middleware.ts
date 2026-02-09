import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_EMAIL = process.env.AUTH_EMAIL

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('isLoggedIn')
  const userCookie = request.cookies.get('user')

  if (!authCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!AUTH_EMAIL || !userCookie?.value) {
    const res = NextResponse.redirect(new URL('/', request.url))
    res.cookies.delete('isLoggedIn')
    res.cookies.delete('user')
    return res
  }

  let cookieEmail: string | null = null
  try {
    const raw = userCookie.value
    const parsed = JSON.parse(
      raw.startsWith('{') ? raw : decodeURIComponent(raw)
    ) as { email?: string }
    cookieEmail = parsed?.email ?? null
  } catch {
    cookieEmail = null
  }

  if (cookieEmail !== AUTH_EMAIL) {
    const res = NextResponse.redirect(new URL('/', request.url))
    res.cookies.delete('isLoggedIn')
    res.cookies.delete('user')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}