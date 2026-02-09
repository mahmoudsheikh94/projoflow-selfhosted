import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/setup/verify
 * 
 * Diagnostic endpoint to verify environment configuration.
 * Returns info about what's configured (without exposing secrets).
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'missing' | 'error'; detail?: string }> = {}
  
  // Check Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    checks.supabaseUrl = { status: 'ok', detail: supabaseUrl }
  } else {
    checks.supabaseUrl = { status: 'missing' }
  }
  
  // Check Anon Key
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (anonKey) {
    checks.anonKey = { 
      status: 'ok', 
      detail: `${anonKey.substring(0, 20)}... (${anonKey.length} chars)` 
    }
  } else {
    checks.anonKey = { status: 'missing' }
  }
  
  // Check Service Role Key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    checks.serviceRoleKey = { 
      status: 'ok', 
      detail: `${serviceKey.substring(0, 20)}... (${serviceKey.length} chars)` 
    }
  } else {
    checks.serviceRoleKey = { status: 'missing', detail: 'CRITICAL: This is required for setup!' }
  }
  
  // Test Supabase connection with anon key
  if (supabaseUrl && anonKey) {
    try {
      const anonClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      const { error } = await anonClient.from('workspaces').select('count').limit(0)
      if (error) {
        checks.anonConnection = { status: 'error', detail: error.message }
      } else {
        checks.anonConnection = { status: 'ok' }
      }
    } catch (e: any) {
      checks.anonConnection = { status: 'error', detail: e.message }
    }
  }
  
  // Test Supabase connection with service role key
  if (supabaseUrl && serviceKey) {
    try {
      const serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      
      // Try to read workspaces (should work with service role)
      const { data, error } = await serviceClient.from('workspaces').select('id').limit(1)
      if (error) {
        checks.serviceConnection = { status: 'error', detail: `Read failed: ${error.message}` }
      } else {
        checks.serviceConnection = { status: 'ok', detail: `Can read (found ${data?.length || 0} workspaces)` }
        
        // Try a test insert/delete to verify write permissions
        const testId = `test-${Date.now()}`
        const { error: insertError } = await serviceClient
          .from('workspaces')
          .insert({ 
            name: 'TEST_WORKSPACE_DELETE_ME', 
            slug: testId,
            owner_id: '00000000-0000-0000-0000-000000000000'
          })
        
        if (insertError) {
          if (insertError.code === '23503') {
            // Foreign key violation is expected (no such owner), but INSERT was attempted
            checks.serviceWritePermission = { 
              status: 'ok', 
              detail: 'INSERT permission OK (FK constraint prevented test row)' 
            }
          } else if (insertError.code === '42501') {
            // RLS violation - service role NOT working!
            checks.serviceWritePermission = { 
              status: 'error', 
              detail: `RLS BLOCKING SERVICE ROLE: ${insertError.message}` 
            }
          } else {
            checks.serviceWritePermission = { 
              status: 'error', 
              detail: `Insert error: ${insertError.code} - ${insertError.message}` 
            }
          }
        } else {
          // Insert worked, delete the test row
          await serviceClient.from('workspaces').delete().eq('slug', testId)
          checks.serviceWritePermission = { status: 'ok', detail: 'Full write permission confirmed' }
        }
      }
    } catch (e: any) {
      checks.serviceConnection = { status: 'error', detail: e.message }
    }
  }
  
  // Overall status
  const allOk = Object.values(checks).every(c => c.status === 'ok')
  const hasMissing = Object.values(checks).some(c => c.status === 'missing')
  const hasError = Object.values(checks).some(c => c.status === 'error')
  
  return NextResponse.json({
    status: allOk ? 'ready' : hasError ? 'error' : hasMissing ? 'incomplete' : 'unknown',
    checks,
    recommendation: !serviceKey 
      ? 'Add SUPABASE_SERVICE_ROLE_KEY to your environment variables. Find it in Supabase Dashboard → Settings → API → service_role (secret).'
      : hasError 
        ? 'Check that your service role key matches your Supabase project.'
        : 'Configuration looks good!'
  })
}
