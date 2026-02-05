import { NextResponse } from 'next/server'
import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

/**
 * POST /api/setup/migrate
 * 
 * Runs all database migrations using the provided database password.
 * The password is used only for this operation and is never stored.
 */
export async function POST(request: Request) {
  try {
    const { databasePassword } = await request.json()

    if (!databasePassword || typeof databasePassword !== 'string') {
      return NextResponse.json(
        { error: 'Database password is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL not configured' },
        { status: 500 }
      )
    }

    // Extract project ref from Supabase URL
    // Format: https://abc123xyz.supabase.co
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

    // Construct PostgreSQL connection string
    // Supabase direct connection: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
    const connectionString = `postgresql://postgres:${encodeURIComponent(databasePassword)}@db.${projectRef}.supabase.co:5432/postgres`

    const client = new Client({ connectionString })

    try {
      await client.connect()
    } catch (connError: any) {
      return NextResponse.json(
        {
          error: 'Unable to connect to database. Please check your database password.',
          hint: 'This is the password you set when creating your Supabase project (not the API keys).',
          details: connError.message,
        },
        { status: 401 }
      )
    }

    // Read all migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    let files: string[]
    
    try {
      files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
    } catch (err) {
      await client.end()
      return NextResponse.json(
        { error: 'Migration files not found. Ensure supabase/migrations folder exists.' },
        { status: 500 }
      )
    }

    if (files.length === 0) {
      await client.end()
      return NextResponse.json(
        { error: 'No migration files found in supabase/migrations/' },
        { status: 500 }
      )
    }

    const results: { file: string; success: boolean; error?: string }[] = []

    // Run each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf-8')

      try {
        await client.query(sql)
        results.push({ file, success: true })
      } catch (err: any) {
        // Check if error is benign (already exists, duplicate)
        const errorMessage = err.message || ''
        if (
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate key') ||
          errorMessage.includes('already been granted')
        ) {
          results.push({ file, success: true, error: 'Already exists (skipped)' })
        } else {
          results.push({ file, success: false, error: errorMessage })
        }
      }
    }

    await client.end()

    const failedMigrations = results.filter(r => !r.success)
    
    if (failedMigrations.length > 0) {
      return NextResponse.json(
        {
          error: `${failedMigrations.length} migrations failed`,
          results,
          failedMigrations,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ran ${results.length} migrations`,
      totalMigrations: results.length,
      results,
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'Migration failed unexpectedly' },
      { status: 500 }
    )
  }
}
