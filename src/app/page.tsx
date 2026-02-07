'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkSetupStatus() {
      try {
        // Check if workspace_settings table exists and has data
        const { data, error } = await supabase
          .from('workspace_settings')
          .select('id')
          .limit(1)
          .single()

        if (error) {
          // If error (table doesn't exist or no data), go to setup
          console.log('No workspace configured, redirecting to /setup')
          router.replace('/setup')
        } else if (data) {
          // Workspace exists, redirect to login
          console.log('Workspace configured, redirecting to /login')
          router.replace('/login')
        }
      } catch (err) {
        // On any error, default to setup
        console.log('Error checking setup status, defaulting to /setup')
        router.replace('/setup')
      }
    }

    checkSetupStatus()
  }, [router, supabase])

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
