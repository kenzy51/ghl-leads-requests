'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, logout, user, isAuthenticated, isLoading, error, clearError } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch {
      // error is set in context
    }
  }

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center p-24 bg-slate-50 min-h-screen">
        <p className="text-slate-500">Loading...</p>
      </main>
    )
  }
  if (isAuthenticated && user) {
    return (
      <main className="flex flex-col items-center justify-center gap-4 p-24 bg-slate-50 min-h-screen">
        <p className="text-slate-700">Logged in as <strong>{user.email}</strong></p>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Log out
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center p-24 bg-slate-50 min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4 p-6 bg-white rounded-xl shadow-sm border border-slate-200"
      >
        <h1 className="text-xl font-semibold text-slate-800 text-center">Log in</h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-600">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-600">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-medium"
        >
          Log in
        </button>
      </form>
    </main>
  )
}
