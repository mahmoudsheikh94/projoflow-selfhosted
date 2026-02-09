'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useClients, useProjects, useCreateInvoice, useAddInvoiceItems, useInvoiceSettings, useUnbilledTimeEntries } from '@/lib/hooks'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Plus, Trash2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedClientId?: string
  preselectedProjectId?: string
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number // in cents
  timeEntryId?: string
}

export function InvoiceDialog({ 
  open, 
  onOpenChange,
  preselectedClientId,
  preselectedProjectId 
}: InvoiceDialogProps) {
  const [clientId, setClientId] = useState<string>(preselectedClientId || '')
  const [projectId, setProjectId] = useState<string>(preselectedProjectId || '')
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [selectedTimeEntries, setSelectedTimeEntries] = useState<Set<string>>(new Set())

  const { data: clients } = useClients()
  const { data: projects } = useProjects()
  const { data: settings } = useInvoiceSettings()
  const { data: unbilledTime } = useUnbilledTimeEntries(clientId || undefined, projectId || undefined)
  const createInvoice = useCreateInvoice()
  const addInvoiceItems = useAddInvoiceItems()

  // Filter projects by selected client
  const filteredProjects = useMemo(() => {
    if (!clientId) return projects
    return projects?.filter(p => p.client_id === clientId)
  }, [projects, clientId])

  // Calculate totals
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }, [lineItems])

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * ((settings?.tax_rate || 0) / 100))
  }, [subtotal, settings?.tax_rate])

  const total = subtotal + taxAmount

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientId(preselectedClientId || '')
      setProjectId(preselectedProjectId || '')
      setIssueDate(format(new Date(), 'yyyy-MM-dd'))
      setDueDate('')
      setNotes(settings?.invoice_notes || '')
      setLineItems([])
      setSelectedTimeEntries(new Set())
      
      // Set default due date based on payment terms
      if (settings?.payment_terms === 'Net 30') {
        const due = new Date()
        due.setDate(due.getDate() + 30)
        setDueDate(format(due, 'yyyy-MM-dd'))
      } else if (settings?.payment_terms === 'Net 15') {
        const due = new Date()
        due.setDate(due.getDate() + 15)
        setDueDate(format(due, 'yyyy-MM-dd'))
      }
    }
  }, [open, preselectedClientId, preselectedProjectId, settings])

  // Add empty line item
  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0
    }])
  }

  // Remove line item
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Toggle time entry selection
  const toggleTimeEntry = (entryId: string) => {
    const newSelected = new Set(selectedTimeEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedTimeEntries(newSelected)
  }

  // Add selected time entries as line items
  const addTimeEntriesToInvoice = () => {
    if (!unbilledTime) return
    
    const newItems: LineItem[] = []
    
    unbilledTime.forEach((entry: any) => {
      if (selectedTimeEntries.has(entry.id)) {
        const hours = entry.duration_minutes / 60
        const rate = entry.projects?.hourly_rate || 0
        
        newItems.push({
          id: crypto.randomUUID(),
          description: `${entry.projects?.name}${entry.tasks ? ` - ${entry.tasks.title}` : ''}${entry.description ? `: ${entry.description}` : ''} (${format(new Date(entry.date), 'MMM d')})`,
          quantity: parseFloat(hours.toFixed(2)),
          unitPrice: Math.round(rate * 100), // Convert to cents
          timeEntryId: entry.id
        })
      }
    })
    
    setLineItems([...lineItems, ...newItems])
    setSelectedTimeEntries(new Set())
  }

  // Format currency
  const formatCurrency = (cents: number) => {
    const symbol = settings?.currency_symbol || '$'
    return `${symbol}${(cents / 100).toFixed(2)}`
  }

  // Handle submit
  const handleSubmit = async () => {
    if (lineItems.length === 0) {
      toast.error('Please add at least one line item')
      return
    }

    try {
      // Create invoice
      const invoice = await createInvoice.mutateAsync({
        client_id: clientId || null,
        project_id: projectId || null,
        issue_date: issueDate,
        due_date: dueDate || null,
        subtotal,
        tax_rate: settings?.tax_rate || 0,
        tax_amount: taxAmount,
        total,
        currency: settings?.currency || 'USD',
        currency_symbol: settings?.currency_symbol || '$',
        notes: notes || null,
        payment_terms: settings?.payment_terms || null
      })

      // Add line items
      await addInvoiceItems.mutateAsync({
        invoiceId: invoice.id,
        items: lineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          amount: Math.round(item.quantity * item.unitPrice),
          time_entry_id: item.timeEntryId || null,
          sort_order: index
        }))
      })

      toast.success('Invoice created successfully')
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to create invoice')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-raised border-border-default text-text-primary max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription className="text-text-muted">
            Create a new invoice for your client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client & Project Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="bg-input-bg border-border-default">
                  <SelectValue placeholder="Select client (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-surface-raised border-border-default">
                  <SelectItem value="__none__">No client</SelectItem>
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bg-input-bg border-border-default">
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-surface-raised border-border-default">
                  <SelectItem value="__none__">No project</SelectItem>
                  {filteredProjects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="bg-input-bg border-border-default"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-input-bg border-border-default"
              />
            </div>
          </div>

          {/* Unbilled Time Entries */}
          {unbilledTime && unbilledTime.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand" />
                  Unbilled Time Entries
                </Label>
                {selectedTimeEntries.size > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={addTimeEntriesToInvoice}
                    className="bg-brand hover:bg-brand-hover text-white"
                  >
                    Add Selected ({selectedTimeEntries.size})
                  </Button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border-default">
                {unbilledTime.map((entry: any) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 p-3 border-b border-border-default last:border-b-0 cursor-pointer hover:bg-surface-hover",
                      selectedTimeEntries.has(entry.id) && "bg-brand/10"
                    )}
                    onClick={() => toggleTimeEntry(entry.id)}
                  >
                    <Checkbox
                      checked={selectedTimeEntries.has(entry.id)}
                      onCheckedChange={() => toggleTimeEntry(entry.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {entry.projects?.name} {entry.tasks && `- ${entry.tasks.title}`}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {entry.description || 'No description'} • {format(new Date(entry.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-text-primary">
                        {(entry.duration_minutes / 60).toFixed(2)}h
                      </p>
                      <p className="text-xs text-text-muted">
                        @ {formatCurrency((entry.projects?.hourly_rate || 0) * 100)}/hr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addLineItem}
                className="border-border-default text-text-primary hover:bg-surface-hover"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-text-muted border border-dashed border-border-default rounded-lg">
                No line items yet. Add items manually or select from unbilled time entries.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs text-text-muted px-2">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>

                {/* Items */}
                {lineItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-input-bg rounded-lg p-2">
                    <div className="col-span-6">
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                        className="bg-transparent border-0 h-8 px-2"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="bg-transparent border-0 h-8 px-2 text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(item.unitPrice / 100).toFixed(2)}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className="bg-transparent border-0 h-8 px-2 text-right"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-sm text-text-primary">
                        {formatCurrency(Math.round(item.quantity * item.unitPrice))}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLineItem(item.id)}
                        className="h-6 w-6 p-0 text-text-muted hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {lineItems.length > 0 && (
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text-primary">{formatCurrency(subtotal)}</span>
                </div>
                {(settings?.tax_rate || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{settings?.tax_label} ({settings?.tax_rate}%)</span>
                    <span className="text-text-primary">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-border-default pt-2">
                  <span className="text-text-primary">Total</span>
                  <span className="text-brand">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for this invoice..."
              className="bg-input-bg border-border-default min-h-[60px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border-default">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border-default text-text-primary hover:bg-surface-hover"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-brand hover:bg-brand-hover text-white"
              disabled={createInvoice.isPending || addInvoiceItems.isPending}
            >
              Create Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
