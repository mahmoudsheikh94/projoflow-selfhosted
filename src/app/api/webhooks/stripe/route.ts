import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/webhooks/stripe
 * 
 * Receives Stripe payment notifications and generates license keys.
 * Configure in Stripe: Developers → Webhooks → Add endpoint
 * Events: checkout.session.completed
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    
    // Verify webhook signature (requires stripe package)
    // For now, we'll accept all requests. Add signature verification in production.
    // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    // if (!signature || !webhookSecret) {
    //   return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    // }
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    const event = JSON.parse(body)

    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ message: 'Event ignored' })
    }

    const session = event.data.object
    const {
      id: sessionId,
      customer_email: email,
      metadata,
    } = session

    if (!sessionId || !email) {
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
      .eq('purchase_id', sessionId)
      .single()

    if (existing) {
      console.log(`License already exists for session ${sessionId}`)
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
        purchase_platform: 'stripe',
        purchase_id: sessionId,
        product_name: metadata?.product_name || 'ProjoFlow Self-Hosted',
        metadata: metadata || {},
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
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
