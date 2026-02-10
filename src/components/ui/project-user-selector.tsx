'use client'

import { useAdminUsers } from '@/lib/hooks'
import { useMentionUsers } from '@/lib/hooks/use-mention-users'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Users } from 'lucide-react'

interface ProjectUserSelectorProps {
  value: string | null
  onValueChange: (value: string | null) => void
  projectId?: string // If provided, includes client users for this project
  placeholder?: string
  className?: string
}

/**
 * Enhanced user selector that can include client users when a projectId is provided.
 * Falls back to admin-only users when no projectId is given.
 */
export function ProjectUserSelector({ 
  value, 
  onValueChange, 
  projectId,
  placeholder = "Select user...",
  className 
}: ProjectUserSelectorProps) {
  // Use mention users hook if projectId provided (includes client users)
  const { data: mentionUsers, isLoading: mentionLoading } = useMentionUsers(projectId || '')
  // Fallback to admin users only
  const { data: adminUsers, isLoading: adminLoading } = useAdminUsers()

  const users = projectId ? mentionUsers : adminUsers?.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    type: 'admin' as const
  }))
  const isLoading = projectId ? mentionLoading : adminLoading

  const handleValueChange = (newValue: string) => {
    if (newValue === '__unassigned__') {
      onValueChange(null)
    } else {
      onValueChange(newValue)
    }
  }

  const displayValue = value || '__unassigned__'

  return (
    <Select value={displayValue} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-500" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-zinc-800 border-zinc-700">
        <SelectItem value="__unassigned__" className="text-zinc-400">
          Unassigned
        </SelectItem>
        {isLoading ? (
          <SelectItem value="__loading__" disabled>
            Loading users...
          </SelectItem>
        ) : (
          <>
            {/* Admin users */}
            {users?.filter(u => u.type === 'admin').map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  <span>{user.name || user.email}</span>
                </div>
              </SelectItem>
            ))}
            
            {/* Client users - show with indicator */}
            {projectId && (users?.filter(u => u.type === 'client')?.length ?? 0) > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs text-zinc-500 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Client Users
                </div>
                {users?.filter(u => u.type === 'client').map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.name || 'Client User'}</span>
                      <span className="text-xs text-emerald-500">(client)</span>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  )
}
