import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/license/validate
 * 
 * Validates a ProjoFlow license key against our database.
 * Works with any payment platform (Gumroad, LemonSqueezy, Stripe, etc.)
 */
export async function POST(request: Request) {
  try {
    const { licenseKey } = await request.json()

    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'License key is required' },
        { status: 400 }
      )
    }

    // Clean up the license key (remove spaces, convert to uppercase)
    const cleanKey = licenseKey.trim().toUpperCase().replace(/\s/g, '')

    // Validate format: PJ-XXXXXX-XXXXXX-XXXXXX
    const formatRegex = /^PJ-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/
    if (!formatRegex.test(cleanKey)) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid license key format. Expected: PJ-XXXXXX-XXXXXX-XXXXXX' 
        },
        { status: 400 }
      )
    }

    // Check license in our database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: license, error: dbError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', cleanKey)
      .single()

    if (dbError || !license) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid license key. Please check your purchase email or contact support.' 
        },
        { status: 401 }
      )
    }

    // Check if license is active
    if (license.status !== 'active') {
      return NextResponse.json(
        { 
          valid: false, 
          error: `License is ${license.status}. Please contact support.` 
        },
        { status: 401 }
      )
    }

    // Check if license is expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'License has expired. Please renew your license or contact support.' 
        },
        { status: 401 }
      )
    }

    // Check activation limit (optional - for now we allow unlimited)
    // if (license.activation_count >= license.max_activations) {
    //   return NextResponse.json(
    //     { 
    //       valid: false, 
    //       error: 'License activation limit reached. Contact support to increase limit.' 
    //     },
    //     { status: 401 }
    //   )
    // }

    // Optionally increment activation count (commented out for now - allows unlimited installs)
    // await supabase.rpc('increment_license_activation', { p_license_key: cleanKey })

    return NextResponse.json({
      valid: true,
      message: 'License verified successfully',
      license: {
        productName: license.product_name,
        purchaseEmail: license.purchase_email,
        purchasePlatform: license.purchase_platform,
        activations: `${license.activation_count}/${license.max_activations === 999 ? 'unlimited' : license.max_activations}`,
      },
    })
  } catch (error: any) {
    console.error('License validation error:', error)
    return NextResponse.json(
      { 
        valid: false, 
        error: 'License validation failed. Please try again or contact support.' 
      },
      { status: 500 }
    )
  }
}
