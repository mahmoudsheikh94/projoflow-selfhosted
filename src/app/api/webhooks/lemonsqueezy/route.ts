import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/**
 * POST /api/webhooks/lemonsqueezy
 * 
 * Receives LemonSqueezy order notifications and generates license keys.
 * Configure in LemonSqueezy: Settings → Webhooks → Add endpoint
 * Events: order_created
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')
    
    // Verify webhook signature (if LEMONSQUEEZY_WEBHOOK_SECRET is set)
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret)
      const digest = hmac.update(body).digest('hex')
      
      if (digest !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const data = JSON.parse(body)
    
    // LemonSqueezy webhook structure
    const {
      meta: { event_name },
      data: orderData,
    } = data

    if (event_name !== 'order_created') {
      return NextResponse.json({ message: 'Event ignored' })
    }

    const {
      id: orderId,
      attributes: {
        user_email: email,
        user_name: fullName,
        first_order_item: {
          product_name: productName,
        },
      },
    } = orderData

    if (!orderId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Check if license already exists
    const { data: existing } = await supabase
      .from('licenses')
      .select('license_key')
      .eq('purchase_id', orderId.toString())
      .single()

    if (existing) {
      console.log(`License already exists for order ${orderId}`)
      return NextResponse.json({ 
        success: true, 
        message: 'License already generated' 
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
        purchase_platform: 'lemonSqueezy',
        purchase_id: orderId.toString(),
        product_name: productName || 'ProjoFlow Self-Hosted',
        metadata: { full_name: fullName },
      })

    if (insertError) {
      console.error('License insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save license' }, { status: 500 })
    }

    // TODO: Send email with license key using Resend
    
    console.log(`License generated for ${email}: ${licenseKey}`)

    return NextResponse.json({
      success: true,
      message: 'License generated',
    })
  } catch (error: any) {
    console.error('LemonSqueezy webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
