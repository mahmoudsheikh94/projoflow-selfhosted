'use client'

import { useAdminUsers } from '@/lib/hooks'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User } from 'lucide-react'

interface UserSelectorProps {
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  className?: string
  clientId?: string | null  // If provided, also show client users
}

interface SelectableUser {
  id: string
  name: string | null
  email: string
  type: 'team' | 'client'
}

// Hook to fetch client users for a specific client
function useClientUsers(clientId?: string | null) {
  return useQuery({
    queryKey: ['client-users-for-assignment', clientId],
    queryFn: async () => {
      if (!clientId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('client_users')
        .select('user_id, name, users(email)')
        .eq('client_id', clientId)
      
      if (error) {
        console.warn('Error fetching client users:', error)
        return []
      }
      
      return data.map(cu => ({
        id: cu.user_id,
        name: cu.name,
        email: (cu.users as any)?.email || 'Unknown',
        type: 'client' as const
      }))
    },
    enabled: !!clientId
  })
}

export function UserSelector({ 
  value, 
  onValueChange, 
  placeholder = "Select user...",
  className,
  clientId
}: UserSelectorProps) {
  const { data: adminUsers, isLoading: adminsLoading } = useAdminUsers()
  const { data: clientUsers, isLoading: clientsLoading } = useClientUsers(clientId)

  const isLoading = adminsLoading || clientsLoading

  // Combine admin users and client users
  const allUsers: SelectableUser[] = [
    ...(adminUsers?.map(u => ({ ...u, type: 'team' as const })) || []),
    ...(clientUsers || [])
  ]

  // Remove duplicates (same user might be in both)
  const uniqueUsers = allUsers.filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  )

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
        ) : uniqueUsers.length === 0 ? (
          <SelectItem value="__none__" disabled>
            No users available
          </SelectItem>
        ) : (
          uniqueUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <span>{user.name || user.email}</span>
                {clientId && (
                  <span className="text-xs text-zinc-500">
                    ({user.type === 'team' ? 'Team' : 'Client'})
                  </span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
