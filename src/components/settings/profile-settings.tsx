'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ProfileSettingsProps {
  variant?: 'admin' | 'client'
}

export function ProfileSettings({ variant = 'admin' }: ProfileSettingsProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalName, setOriginalName] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    setHasChanges(name !== originalName)
  }, [name, originalName])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setEmail(user.email || '')
        
        // Try to get name from user metadata first, then from users table
        const metaName = user.user_metadata?.name || user.user_metadata?.display_name
        
        if (metaName) {
          setName(metaName)
          setOriginalName(metaName)
        } else {
          // Fallback to users table
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single()
          
          if (userData?.name) {
            setName(userData.name)
            setOriginalName(userData.name)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          name: name.trim(),
          display_name: name.trim()
        }
      })

      if (authError) throw authError

      // Also update users table if it exists for this user
      await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', user.id)

      setOriginalName(name.trim())
      toast.success('Profile updated')
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      toast.error(error.message || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

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
    <Card className="bg-surface-raised border-border-default">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-brand" />
          <CardTitle className="text-text-primary">Profile</CardTitle>
        </div>
        <CardDescription className="text-text-muted">
          Manage your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-text-secondary">Email</Label>
          <Input
            type="email"
            value={email}
            disabled
            className="bg-input-bg border-border-default text-text-muted"
          />
          <p className="text-xs text-text-muted">
            Email cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-text-secondary">Display Name</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="bg-input-bg border-border-default text-text-primary"
          />
          <p className="text-xs text-text-muted">
            This name will be shown in comments and activities
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-brand hover:bg-brand-hover text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : hasChanges ? (
              'Save Changes'
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
