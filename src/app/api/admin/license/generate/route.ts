import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/admin/license/generate
 * 
 * Generates a new ProjoFlow license key.
 * Requires ADMIN_SECRET in Authorization header for security.
 */
export async function POST(request: Request) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET
    
    if (!adminSecret) {
      return NextResponse.json(
        { error: 'ADMIN_SECRET not configured on server' },
        { status: 500 }
      )
    }
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid admin secret.' },
        { status: 401 }
      )
    }

    const {
      purchaseEmail,
      purchasePlatform = 'manual',
      purchaseId,
      productName = 'ProjoFlow Self-Hosted',
      maxActivations = 999,
      metadata = {},
    } = await request.json()

    if (!purchaseEmail) {
      return NextResponse.json(
        { error: 'purchaseEmail is required' },
        { status: 400 }
      )
    }

    // Create admin Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Generate license key using database function
    const { data: keyData, error: keyError } = await supabase
      .rpc('generate_license_key')
      .single()

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: 'Failed to generate license key' },
        { status: 500 }
      )
    }

    const licenseKey = keyData as string

    // Insert license into database
    const { data: license, error: insertError } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        purchase_email: purchaseEmail,
        purchase_platform: purchasePlatform,
        purchase_id: purchaseId,
        product_name: productName,
        max_activations: maxActivations,
        metadata,
      })
      .select()
      .single()

    if (insertError) {
      console.error('License insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create license', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      license: {
        key: license.license_key,
        email: license.purchase_email,
        platform: license.purchase_platform,
        createdAt: license.created_at,
      },
    })
  } catch (error: any) {
    console.error('License generation error:', error)
    return NextResponse.json(
      { error: error.message || 'License generation failed' },
      { status: 500 }
    )
  }
}
