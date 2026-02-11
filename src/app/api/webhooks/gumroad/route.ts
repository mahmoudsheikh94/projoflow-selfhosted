import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

/**
 * POST /api/webhooks/gumroad
 * 
 * Receives Gumroad sale notifications and generates license keys.
 * Configure in Gumroad: Settings → Advanced → Ping URL
 */
export async function POST(request: Request) {
  try {
    // Gumroad sends form-urlencoded data, NOT JSON
    const formData = await request.formData()
    
    // Convert FormData to object for easier access
    const body: Record<string, string> = {}
    formData.forEach((value, key) => {
      body[key] = value.toString()
    })
    
    console.log('Gumroad webhook received:', JSON.stringify(body, null, 2))
    
    // Gumroad sends: seller_id, product_id, product_name, permalink, 
    //                email, sale_id, full_name, price, etc.
    const sale_id = body.sale_id
    const email = body.email
    const product_name = body.product_name
    const full_name = body.full_name

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

    // Send email with license key
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: 'ProjoFlow <no-reply@projoflow.com>',
          to: email,
          subject: '🎉 Your ProjoFlow License Key',
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7c3aed; margin: 0;">ProjoFlow</h1>
    <p style="color: #666; margin: 5px 0;">AI-Powered Project Management</p>
  </div>
  
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0 0 10px 0;">Thank you for your purchase${full_name ? `, ${full_name}` : ''}! 🎉</h2>
    <p style="margin: 0; opacity: 0.9;">Your license key is ready</p>
  </div>
  
  <div style="background: #f8f9fa; border: 2px dashed #7c3aed; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">YOUR LICENSE KEY</p>
    <code style="font-size: 24px; font-weight: bold; color: #7c3aed; letter-spacing: 2px;">${licenseKey}</code>
  </div>
  
  <h3 style="color: #333;">🚀 Getting Started</h3>
  <ol style="color: #555;">
    <li><strong>Clone the repository:</strong><br>
      <code style="background: #f1f1f1; padding: 2px 6px; border-radius: 4px;">git clone https://github.com/mahmoudsheikh94/projoflow-selfhosted</code>
    </li>
    <li style="margin-top: 15px;"><strong>Follow the setup guide:</strong><br>
      Check the README.md for detailed installation instructions
    </li>
    <li style="margin-top: 15px;"><strong>Enter your license key</strong> during setup</li>
  </ol>
  
  <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; color: #166534;"><strong>💡 Pro Tip:</strong> Star the repo to get notified about updates and new features!</p>
  </div>
  
  <h3 style="color: #333;">📚 Resources</h3>
  <ul style="color: #555;">
    <li><a href="https://github.com/mahmoudsheikh94/projoflow-selfhosted" style="color: #7c3aed;">GitHub Repository</a></li>
    <li><a href="https://www.projoflow.com" style="color: #7c3aed;">ProjoFlow Website</a></li>
  </ul>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #888; font-size: 14px; text-align: center;">
    Need help? Reply to this email or reach out at <a href="mailto:support@z-flow.de" style="color: #7c3aed;">support@z-flow.de</a>
  </p>
  
  <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 20px;">
    © ${new Date().getFullYear()} ProjoFlow by Z-Flow. All rights reserved.
  </p>
</body>
</html>
          `,
        })
        
        console.log(`License email sent to ${email}`)
      } catch (emailError) {
        // Log but don't fail the webhook if email fails
        console.error('Failed to send license email:', emailError)
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping email')
    }
    
    console.log(`License generated for ${email}: ${licenseKey}`)

    return NextResponse.json({
      success: true,
      message: 'License generated',
      licenseKey,
    })
  } catch (error: any) {
    console.error('Gumroad webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
