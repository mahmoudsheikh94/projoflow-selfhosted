import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ClientCredential, ClientCredentialInsert, Client } from '@/types/database'

export interface CredentialWithClient extends ClientCredential {
  client: Pick<Client, 'id' | 'name' | 'company'>
}

// Fetch ALL credentials with client info (admin only)
export function useAllCredentials() {
  return useQuery({
    queryKey: ['admin_credentials'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('client_credentials')
        .select(`
          *,
          client:clients!client_id (
            id,
            name,
            company
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as CredentialWithClient[]
    }
  })
}

// Create credential for any client (admin)
export function useAdminCreateCredential() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (credential: ClientCredentialInsert) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('client_credentials')
        .insert({
          ...credential,
          created_by: user?.id
        })
        .select(`
          *,
          client:clients!client_id (
            id,
            name,
            company
          )
        `)
        .single()
      
      if (error) throw error
      return data as CredentialWithClient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_credentials'] })
    }
  })
}

// Update credential (admin)
export function useAdminUpdateCredential() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientCredential> & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('client_credentials')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients!client_id (
            id,
            name,
            company
          )
        `)
        .single()
      
      if (error) throw error
      return data as CredentialWithClient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_credentials'] })
    }
  })
}

// Delete credential (admin)
export function useAdminDeleteCredential() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('client_credentials')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_credentials'] })
    }
  })
}
