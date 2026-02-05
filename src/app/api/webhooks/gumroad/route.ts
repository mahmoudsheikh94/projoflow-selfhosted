import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/webhooks/gumroad
 * 
 * Receives Gumroad sale notifications and generates license keys.
 * Configure in Gumroad: Settings → Advanced → Ping URL
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Gumroad sends: { sale_id, sale_timestamp, product_name, product_permalink, 
    //                  email, full_name, price, currency, etc. }
    
    const {
      sale_id,
      email,
      product_name,
      full_name,
    } = body

    if (!sale_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create admin Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if license already exists for this sale
    const { data: existing } = await supabase
      .from('licenses')
      .select('license_key')
      .eq('purchase_id', sale_id)
      .single()

    if (existing) {
      console.log(`License already exists for sale ${sale_id}`)
      return NextResponse.json({ 
        success: true, 
        message: 'License already generated',
        licenseKey: existing.license_key 
      })
    }

    // Generate license key
    const { data: keyData, error: keyError } = await supabase
      .rpc('generate_license_key')
      .single()

    if (keyError || !keyData) {
      console.error('Failed to generate license key:', keyError)
      return NextResponse.json({ error: 'License generation failed' }, { status: 500 })
    }

    const licenseKey = keyData as string

    // Insert license
    const { error: insertError } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        purchase_email: email,
        purchase_platform: 'gumroad',
        purchase_id: sale_id,
        product_name: product_name || 'ProjoFlow Self-Hosted',
        metadata: { full_name },
      })

    if (insertError) {
      console.error('License insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save license' }, { status: 500 })
    }

    // TODO: Send email with license key using Resend
    // For now, Gumroad will send the email (you can customize their email template)
    
    console.log(`License generated for ${email}: ${licenseKey}`)

    return NextResponse.json({
      success: true,
      message: 'License generated',
      licenseKey, // Gumroad can include this in their confirmation email
    })
  } catch (error: any) {
    console.error('Gumroad webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
