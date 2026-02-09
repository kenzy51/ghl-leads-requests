'use server'

import { cookies } from 'next/headers'

const IS_LOGGED_IN = 'isLoggedIn'
const USER_COOKIE = 'user'

/** Validates credentials against AUTH_EMAIL and AUTH_PASSWORD from .env, then sets login cookie. */
export async function loginWithCredentials(email: string, password: string): Promise<{ email: string; name?: string }> {
  const envEmail = process.env.AUTH_EMAIL
  const envPassword = process.env.AUTH_PASSWORD

  if (!envEmail || !envPassword) {
    throw new Error('Auth is not configured. Set AUTH_EMAIL and AUTH_PASSWORD in .env.local')
  }

  if (email !== envEmail || password !== envPassword) {
    throw new Error('Invalid email or password')
  }

  const userInfo = { email: envEmail, name: envEmail.split('@')[0] }
  const cookieStore = await cookies()
  cookieStore.set(IS_LOGGED_IN, 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  cookieStore.set(USER_COOKIE, JSON.stringify(userInfo), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  return userInfo
}

export async function setLoginCookie(userInfo: { email: string; name?: string }) {
  const cookieStore = await cookies()
  cookieStore.set(IS_LOGGED_IN, 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  cookieStore.set(USER_COOKIE, JSON.stringify(userInfo), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
}

export async function clearLoginCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(IS_LOGGED_IN)
  cookieStore.delete(USER_COOKIE)
}
