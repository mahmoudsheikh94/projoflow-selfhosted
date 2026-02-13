import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/team - List team members
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Get all members of this workspace
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        created_at
      `)
      .eq('workspace_id', membership.workspace_id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user details from users table (has name) and admin_users (has email)
    const userIds = members.map(m => m.user_id)
    
    // Try users table first (has name)
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', userIds)

    // Also get from admin_users as fallback for email
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('id, email')
      .in('id', userIds)

    // Merge user info - prefer users table, fallback to admin_users
    const enrichedMembers = members.map(m => {
      const userInfo = usersData?.find(u => u.id === m.user_id)
      const adminInfo = adminUsers?.find(u => u.id === m.user_id)
      const email = userInfo?.email || adminInfo?.email || 'Unknown'
      const name = userInfo?.name || email.split('@')[0] || 'Unknown'
      return {
        ...m,
        email,
        name
      }
    })

    return NextResponse.json({ 
      members: enrichedMembers,
      currentUserRole: membership.role,
      workspaceId: membership.workspace_id
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/team - Add member (by user ID, for MCP setup)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, email, role = 'member' } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is owner/admin
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners and admins can add members' }, { status: 403 })
    }

    let targetUserId = userId

    // If email provided, find user
    if (email && !userId) {
      // Check users table first, then admin_users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        targetUserId = existingUser.id
      } else {
        // Fallback to admin_users
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', email)
          .single()
        
        if (adminUser) {
          targetUserId = adminUser.id
        } else {
          return NextResponse.json({ 
            error: 'User not found. They must sign up first, then you can add them.' 
          }, { status: 404 })
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID or email required' }, { status: 400 })
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', membership.workspace_id)
      .eq('user_id', targetUserId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 })
    }

    // Prevent creating multiple owners
    if (role === 'owner') {
      return NextResponse.json({ error: 'Cannot add another owner' }, { status: 400 })
    }

    // Add member
    const { data: newMember, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: membership.workspace_id,
        user_id: targetUserId,
        role: role
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ member: newMember })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
