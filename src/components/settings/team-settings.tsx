'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Users, UserPlus, Loader2, Crown, Shield, User, Trash2, Bot, Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  user_id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
}

const roleColors = {
  owner: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  admin: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  member: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
}

export function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    try {
      const res = await fetch('/api/team')
      const data = await res.json()
      
      if (res.ok) {
        setMembers(data.members)
        setCurrentUserRole(data.currentUserRole)
      } else {
        toast.error(data.error || 'Failed to load team')
      }
    } catch (error) {
      toast.error('Failed to load team')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email')
      return
    }

    setIsInviting(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Team member added')
        setInviteEmail('')
        loadTeam()
      } else {
        toast.error(data.error || 'Failed to add member')
      }
    } catch (error) {
      toast.error('Failed to add member')
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Role updated')
        loadTeam()
      } else {
        toast.error(data.error || 'Failed to update role')
      }
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  const handleRemove = async (memberId: string) => {
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Member removed')
        loadTeam()
      } else {
        toast.error(data.error || 'Failed to remove member')
      }
    } catch (error) {
      toast.error('Failed to remove member')
    }
  }

  const canManageTeam = ['owner', 'admin'].includes(currentUserRole)
  const isOwner = currentUserRole === 'owner'

  if (isLoading) {
    return (
      <Card className="bg-surface-raised border-border-default">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Team Members */}
      <Card className="bg-surface-raised border-border-default">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" />
            <CardTitle className="text-text-primary">Team Members</CardTitle>
          </div>
          <CardDescription className="text-text-muted">
            Manage who has access to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Member List */}
          <div className="space-y-2">
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role]
              const canEdit = canManageTeam && member.role !== 'owner' && 
                (isOwner || (currentUserRole === 'admin' && member.role === 'member'))

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border-default bg-surface"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center">
                      <RoleIcon className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{member.name}</p>
                      <p className="text-xs text-text-muted">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleUpdateRole(member.id, value)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs bg-surface border-border-default">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-border-default">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={roleColors[member.role]}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    )}
                    {canEdit && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-surface-raised border-border-default">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-text-primary">Remove team member?</AlertDialogTitle>
                            <AlertDialogDescription className="text-text-muted">
                              {member.name} will lose access to this workspace. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-surface hover:bg-surface-hover border-border-default text-text-primary">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(member.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Member Form */}
          {canManageTeam && (
            <form onSubmit={handleInvite} className="pt-4 border-t border-border-default">
              <Label className="text-text-secondary mb-2 block">Add Team Member</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-input-bg border-border-default"
                />
                <Select value={inviteRole} onValueChange={(v: 'admin' | 'member') => setInviteRole(v)}>
                  <SelectTrigger className="w-28 bg-surface border-border-default">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border-default">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  type="submit" 
                  disabled={isInviting}
                  className="bg-brand hover:bg-brand-hover text-white"
                >
                  {isInviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                User must have an account. They&apos;ll get access immediately after being added.
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      {/* MCP Integration */}
      <MCPSetupCard />
    </>
  )
}

// MCP Setup Card Component
function MCPSetupCard() {
  const [copied, setCopied] = useState(false)
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')

  useEffect(() => {
    // Get Supabase config from env (client-side available)
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    setAnonKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
               process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  }, [])

  const mcpConfig = `{
  "mcpServers": {
    "projoflow": {
      "command": "npx",
      "args": ["-y", "projoflow-mcp-server"],
      "env": {
        "PROJOFLOW_SUPABASE_URL": "${supabaseUrl}",
        "PROJOFLOW_SUPABASE_ANON_KEY": "${anonKey}",
        "PROJOFLOW_MCP_EMAIL": "your-mcp-user@example.com",
        "PROJOFLOW_MCP_PASSWORD": "your-mcp-password"
      }
    }
  }
}`

  const handleCopy = () => {
    navigator.clipboard.writeText(mcpConfig)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-surface-raised border-border-default">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand" />
          <CardTitle className="text-text-primary">AI Assistant Integration</CardTitle>
        </div>
        <CardDescription className="text-text-muted">
          Connect Claude Code, Cursor, or other MCP-compatible AI assistants to ProjoFlow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setup Steps */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-brand/10 flex items-center justify-center text-xs font-medium text-brand flex-shrink-0">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Create an MCP service account</p>
              <p className="text-xs text-text-muted">
                Create a dedicated user (e.g., mcp@yourcompany.com) and add them to your team above.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-brand/10 flex items-center justify-center text-xs font-medium text-brand flex-shrink-0">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Copy the config below</p>
              <p className="text-xs text-text-muted">
                Replace the email and password with your MCP user credentials.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-brand/10 flex items-center justify-center text-xs font-medium text-brand flex-shrink-0">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Add to your AI assistant config</p>
              <p className="text-xs text-text-muted">
                Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
              </p>
            </div>
          </div>
        </div>

        {/* Config Preview */}
        <div className="relative">
          <pre className="p-4 rounded-lg bg-surface border border-border-default text-xs overflow-x-auto">
            <code className="text-text-primary">{mcpConfig}</code>
          </pre>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 h-8 border-border-default bg-surface hover:bg-surface-hover"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Docs Link */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ExternalLink className="h-3 w-3" />
          <a 
            href="https://www.npmjs.com/package/projoflow-mcp-server" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-brand underline"
          >
            View full documentation on npm
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
