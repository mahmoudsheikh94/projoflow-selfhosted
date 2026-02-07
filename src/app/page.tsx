'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Self-Hosted ProjoFlow Homepage
 * 
 * This is NOT a marketing page. It redirects to:
 * - /setup if the workspace is not configured
 * - /login if the workspace is already set up
 * 
 * Marketing happens on the hosted SaaS landing page.
 */
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Use the /api/setup endpoint to check status
    // This is more reliable than client-side checks
    async function checkSetupStatus() {
      try {
        const res = await fetch('/api/setup')
        const data = await res.json()
        
        if (data.setupRequired) {
          router.replace('/setup')
        } else {
          router.replace('/login')
        }
      } catch (err) {
        // On any error, default to setup
        console.log('Error checking setup status, defaulting to /setup')
        router.replace('/setup')
      }
    }

    checkSetupStatus()
  }, [router])

  // Show loading state while checking
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4"></div>
        <p className="text-gray-400">Loading ProjoFlow...</p>
      </div>
    </div>
  )
}
