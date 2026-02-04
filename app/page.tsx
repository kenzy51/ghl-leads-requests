import Link from 'next/link'
import { createPatientLead } from './actions'

export default function Home() {
  return (
    <main className="flex flex-col items-center p-24 bg-slate-50 min-h-screen">
     <Link href='/dashboard'>
     Dashboard
     </Link>
    </main>
  )
}