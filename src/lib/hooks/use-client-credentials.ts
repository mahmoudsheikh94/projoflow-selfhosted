import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ClientCredential, ClientCredentialInsert } from '@/types/database'

export function useClientCredentials(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client_credentials', clientId],
    queryFn: async () => {
      if (!clientId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('client_credentials')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ClientCredential[]
    },
    enabled: !!clientId
  })
}

export function useCreateCredential() {
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
        .select()
        .single()
      
      if (error) throw error
      return data as ClientCredential
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client_credentials', data.client_id] })
    }
  })
}

export function useUpdateCredential() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientCredential> & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('client_credentials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as ClientCredential
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client_credentials', data.client_id] })
    }
  })
}

export function useDeleteCredential() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('client_credentials')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, clientId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client_credentials', data.clientId] })
    }
  })
}
