'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/lib/contexts/workspace-context'
import { 
  Invoice, 
  InvoiceInsert, 
  InvoiceUpdate, 
  InvoiceItem, 
  InvoiceItemInsert,
  InvoiceWithRelations,
  InvoiceSettings 
} from '@/types/database'

// Fetch all invoices for workspace
export function useInvoices() {
  const { workspace } = useWorkspace()
  
  return useQuery({
    queryKey: ['invoices', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return []
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (id, name, company, email),
          projects (id, name)
        `)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as InvoiceWithRelations[]
    },
    enabled: !!workspace?.id
  })
}

// Fetch single invoice with items
export function useInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (id, name, company, email, address, phone),
          projects (id, name),
          invoice_items (*)
        `)
        .eq('id', invoiceId)
        .single()
      
      if (error) throw error
      return data as InvoiceWithRelations
    },
    enabled: !!invoiceId
  })
}

// Create invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { workspace } = useWorkspace()
  
  return useMutation({
    mutationFn: async (invoice: Omit<InvoiceInsert, 'workspace_id' | 'invoice_number'>) => {
      if (!workspace?.id) throw new Error('No workspace')
      
      const supabase = createClient()
      
      // Get next invoice number using RPC
      const { data: invoiceNumber, error: numError } = await supabase
        .rpc('get_next_invoice_number', { ws_id: workspace.id })
      
      if (numError) throw numError
      
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoice,
          workspace_id: workspace.id,
          invoice_number: invoiceNumber
        })
        .select()
        .single()
      
      if (error) throw error
      return data as Invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', workspace?.id] })
    }
  })
}

// Update invoice
export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  const { workspace } = useWorkspace()
  
  return useMutation({
    mutationFn: async ({ id, ...update }: InvoiceUpdate & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invoices')
        .update(update)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Invoice
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] })
    }
  })
}

// Delete invoice
export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  const { workspace } = useWorkspace()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', workspace?.id] })
    }
  })
}

// Add invoice items
export function useAddInvoiceItems() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ invoiceId, items }: { invoiceId: string, items: Omit<InvoiceItemInsert, 'invoice_id'>[] }) => {
      const supabase = createClient()
      
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: invoiceId
      }))
      
      const { data, error } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId)
        .select()
      
      if (error) throw error
      return data as InvoiceItem[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] })
    }
  })
}

// Delete invoice item
export function useDeleteInvoiceItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string, invoiceId: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return invoiceId
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    }
  })
}

// Get invoice settings from workspace_settings
export function useInvoiceSettings() {
  const { workspace } = useWorkspace()
  
  return useQuery({
    queryKey: ['invoice-settings', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return null
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('workspace_settings')
        .select('invoice_prefix, invoice_next_number, tax_rate, tax_label, currency, currency_symbol, bank_details, payment_terms, invoice_notes, invoice_footer')
        .eq('workspace_id', workspace.id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      // Return defaults if no settings exist
      return (data || {
        invoice_prefix: 'INV-',
        invoice_next_number: 1,
        tax_rate: 0,
        tax_label: 'Tax',
        currency: 'USD',
        currency_symbol: '$',
        bank_details: null,
        payment_terms: 'Net 30',
        invoice_notes: null,
        invoice_footer: null
      }) as InvoiceSettings
    },
    enabled: !!workspace?.id
  })
}

// Update invoice settings
export function useUpdateInvoiceSettings() {
  const queryClient = useQueryClient()
  const { workspace } = useWorkspace()
  
  return useMutation({
    mutationFn: async (settings: Partial<InvoiceSettings>) => {
      if (!workspace?.id) throw new Error('No workspace')
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('workspace_settings')
        .upsert({
          workspace_id: workspace.id,
          ...settings
        }, {
          onConflict: 'workspace_id'
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-settings', workspace?.id] })
    }
  })
}

// Get unbilled time entries for a client/project
export function useUnbilledTimeEntries(clientId?: string, projectId?: string) {
  const { workspace } = useWorkspace()
  
  return useQuery({
    queryKey: ['unbilled-time', workspace?.id, clientId, projectId],
    queryFn: async () => {
      if (!workspace?.id) return []
      
      const supabase = createClient()
      
      // Get all time entries that haven't been invoiced
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          projects (id, name, hourly_rate, client_id),
          tasks (id, title)
        `)
        .eq('workspace_id', workspace.id)
        .eq('billable', true)
      
      if (projectId) {
        query = query.eq('project_id', projectId)
      }
      
      const { data, error } = await query.order('date', { ascending: false })
      
      if (error) throw error
      
      // Filter by client if specified
      let entries = data || []
      if (clientId) {
        entries = entries.filter((e: any) => e.projects?.client_id === clientId)
      }
      
      // Filter out entries that are already on an invoice
      const { data: invoicedEntries } = await supabase
        .from('invoice_items')
        .select('time_entry_id')
        .not('time_entry_id', 'is', null)
      
      const invoicedIds = new Set((invoicedEntries || []).map(e => e.time_entry_id))
      
      return entries.filter((e: any) => !invoicedIds.has(e.id))
    },
    enabled: !!workspace?.id
  })
}
