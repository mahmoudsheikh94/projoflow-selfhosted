import { NextResponse } from 'next/server'

/**
 * GET /api/setup/verify
 * 
 * Diagnostic endpoint to verify environment variables are configured correctly.
 * This helps debug setup issues.
 */
export async function GET() {
  const checks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT SET',
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT SET',
    serviceKeyFormat: process.env.SUPABASE_SERVICE_ROLE_KEY?.split('.')[0] || 'NOT SET',
  }

  const allConfigured = checks.supabaseUrl && checks.anonKey && checks.serviceRoleKey

  return NextResponse.json({
    configured: allConfigured,
    checks,
    message: allConfigured 
      ? 'All environment variables are configured' 
      : 'Missing required environment variables',
  })
}
