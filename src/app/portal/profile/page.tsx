'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthUser, useSignOut } from '@/lib/hooks/use-client-portal'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { Zap, LogOut, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PortalProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthUser()
  const signOut = useSignOut()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/portal/login')
    }
  }, [user, authLoading, router])

  const handleSignOut = async () => {
    await signOut.mutateAsync()
    router.push('/portal/login')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Zap className="h-6 w-6 md:h-7 md:w-7 text-emerald-500" />
            <div>
              <span className="text-base md:text-lg font-bold text-white">z-flow</span>
              <span className="text-zinc-500 text-xs md:text-sm ml-1 md:ml-2 hidden sm:inline">Client Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-zinc-400 hidden sm:block truncate max-w-[150px]">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs md:text-sm h-8"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-4 md:py-8">
        {/* Back link */}
        <Link 
          href="/portal" 
          className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Profile Card */}
        <ProfileSettings variant="client" />
      </main>
    </div>
  )
}
