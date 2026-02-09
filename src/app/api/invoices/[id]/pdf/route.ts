import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

interface InvoiceData {
  id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string | null
  paid_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency_symbol: string
  notes: string | null
  payment_terms: string | null
  clients: {
    name: string
    company: string | null
    email: string | null
    address: string | null
  } | null
  invoice_items: {
    description: string
    quantity: number
    unit_price: number
    amount: number
  }[]
}

interface SettingsData {
  company_name: string | null
  bank_details: string | null
  tax_label: string | null
  invoice_footer: string | null
}

function formatCurrency(cents: number, symbol: string) {
  return `${symbol}${(cents / 100).toFixed(2)}`
}

function generateInvoicePDF(invoice: InvoiceData, settings: SettingsData): ArrayBuffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Colors
  const primaryColor = '#10b981'
  const textColor = '#1f2937'
  const mutedColor = '#6b7280'

  // Helper function to add text
  const addText = (text: string, x: number, yPos: number, options?: { 
    fontSize?: number, 
    color?: string, 
    fontStyle?: 'normal' | 'bold',
    align?: 'left' | 'center' | 'right'
  }) => {
    const { fontSize = 10, color = textColor, fontStyle = 'normal', align = 'left' } = options || {}
    doc.setFontSize(fontSize)
    doc.setTextColor(color)
    doc.setFont('helvetica', fontStyle)
    
    let xPos = x
    if (align === 'right') {
      xPos = pageWidth - margin - doc.getTextWidth(text)
    } else if (align === 'center') {
      xPos = (pageWidth - doc.getTextWidth(text)) / 2
    }
    
    doc.text(text, xPos, yPos)
  }

  // PAID stamp (if applicable)
  if (invoice.status === 'paid') {
    doc.setFontSize(40)
    doc.setTextColor('#d1fae5')
    doc.setFont('helvetica', 'bold')
    doc.text('PAID', pageWidth - 70, 50, { angle: -15 })
    doc.setTextColor(textColor)
  }

  // Header - Invoice title
  addText('INVOICE', margin, y, { fontSize: 24, fontStyle: 'bold' })
  y += 8
  addText(invoice.invoice_number, margin, y, { fontSize: 14, color: mutedColor })

  // Company name (right side)
  const companyName = settings.company_name || 'Your Company'
  addText(companyName, 0, 20, { fontSize: 12, fontStyle: 'bold', align: 'right' })
  
  // Bank details (right side, smaller)
  if (settings.bank_details) {
    const bankLines = settings.bank_details.split('\n')
    let bankY = 28
    bankLines.forEach(line => {
      addText(line, 0, bankY, { fontSize: 8, color: mutedColor, align: 'right' })
      bankY += 4
    })
  }

  y = 55

  // Bill To section
  addText('BILL TO', margin, y, { fontSize: 9, color: mutedColor })
  y += 6
  
  if (invoice.clients) {
    addText(invoice.clients.name, margin, y, { fontSize: 12, fontStyle: 'bold' })
    y += 5
    if (invoice.clients.company) {
      addText(invoice.clients.company, margin, y, { fontSize: 10, color: mutedColor })
      y += 5
    }
    if (invoice.clients.email) {
      addText(invoice.clients.email, margin, y, { fontSize: 10, color: mutedColor })
      y += 5
    }
    if (invoice.clients.address) {
      const addressLines = invoice.clients.address.split('\n')
      addressLines.forEach(line => {
        addText(line, margin, y, { fontSize: 10, color: mutedColor })
        y += 5
      })
    }
  } else {
    addText('No client', margin, y, { fontSize: 10, color: mutedColor })
    y += 5
  }

  // Dates (right side)
  let dateY = 55
  addText(`Issue Date: ${format(new Date(invoice.issue_date), 'MMMM d, yyyy')}`, 0, dateY, { fontSize: 10, align: 'right' })
  dateY += 6
  if (invoice.due_date) {
    addText(`Due Date: ${format(new Date(invoice.due_date), 'MMMM d, yyyy')}`, 0, dateY, { fontSize: 10, align: 'right' })
    dateY += 6
  }
  if (invoice.paid_date) {
    addText(`Paid Date: ${format(new Date(invoice.paid_date), 'MMMM d, yyyy')}`, 0, dateY, { fontSize: 10, color: primaryColor, align: 'right' })
  }

  // Line items table
  y = Math.max(y, 95) + 10

  // Table header background
  doc.setFillColor('#f9fafb')
  doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F')

  // Table header
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(mutedColor)
  doc.text('DESCRIPTION', margin + 2, y)
  doc.text('QTY', pageWidth - margin - 80, y)
  doc.text('PRICE', pageWidth - margin - 50, y)
  doc.text('AMOUNT', pageWidth - margin - 20, y, { align: 'right' })

  y += 8

  // Table rows
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(textColor)
  doc.setFontSize(10)

  invoice.invoice_items.forEach((item) => {
    // Description (truncate if too long)
    const maxDescWidth = 90
    let desc = item.description
    if (doc.getTextWidth(desc) > maxDescWidth) {
      while (doc.getTextWidth(desc + '...') > maxDescWidth && desc.length > 0) {
        desc = desc.slice(0, -1)
      }
      desc += '...'
    }
    doc.text(desc, margin + 2, y)
    doc.text(item.quantity.toString(), pageWidth - margin - 80, y)
    doc.text(formatCurrency(item.unit_price, invoice.currency_symbol), pageWidth - margin - 50, y)
    doc.text(formatCurrency(item.amount, invoice.currency_symbol), pageWidth - margin - 2, y, { align: 'right' })
    
    // Row separator
    y += 3
    doc.setDrawColor('#e5e7eb')
    doc.line(margin, y, pageWidth - margin, y)
    y += 7
  })

  // Totals section
  y += 5
  const totalsX = pageWidth - 80

  // Subtotal
  doc.setTextColor(mutedColor)
  doc.text('Subtotal', totalsX, y)
  doc.setTextColor(textColor)
  doc.text(formatCurrency(invoice.subtotal, invoice.currency_symbol), pageWidth - margin - 2, y, { align: 'right' })
  y += 7

  // Tax
  if (invoice.tax_amount > 0) {
    doc.setTextColor(mutedColor)
    doc.text(`${settings.tax_label || 'Tax'} (${invoice.tax_rate}%)`, totalsX, y)
    doc.setTextColor(textColor)
    doc.text(formatCurrency(invoice.tax_amount, invoice.currency_symbol), pageWidth - margin - 2, y, { align: 'right' })
    y += 7
  }

  // Total line
  doc.setDrawColor('#e5e7eb')
  doc.line(totalsX, y - 2, pageWidth - margin, y - 2)
  y += 3

  // Grand total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total', totalsX, y)
  doc.text(formatCurrency(invoice.total, invoice.currency_symbol), pageWidth - margin - 2, y, { align: 'right' })

  // Notes
  if (invoice.notes) {
    y += 20
    doc.setDrawColor('#e5e7eb')
    doc.line(margin, y - 5, pageWidth - margin, y - 5)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor)
    doc.text('NOTES', margin, y)
    y += 5
    doc.setFontSize(10)
    doc.setTextColor('#4b5563')
    
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
    noteLines.forEach((line: string) => {
      doc.text(line, margin, y)
      y += 5
    })
  }

  // Payment terms
  if (invoice.payment_terms) {
    y += 5
    doc.setFontSize(10)
    doc.setTextColor('#4b5563')
    doc.text(`Payment Terms: ${invoice.payment_terms}`, margin, y)
  }

  // Footer
  if (settings.invoice_footer) {
    y = doc.internal.pageSize.getHeight() - 20
    doc.setDrawColor('#e5e7eb')
    doc.line(margin, y - 10, pageWidth - margin, y - 10)
    doc.setFontSize(9)
    doc.setTextColor(mutedColor)
    doc.text(settings.invoice_footer, pageWidth / 2, y, { align: 'center' })
  }

  return doc.output('arraybuffer')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoice with items and client
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (name, company, email, address),
        invoice_items (description, quantity, unit_price, amount)
      `)
      .eq('id', id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch workspace settings
    const { data: settings } = await supabase
      .from('workspace_settings')
      .select('company_name, bank_details, tax_label, invoice_footer')
      .eq('workspace_id', invoice.workspace_id)
      .single()

    // Generate PDF
    const pdfBuffer = generateInvoicePDF(
      invoice as InvoiceData, 
      settings || { company_name: null, bank_details: null, tax_label: null, invoice_footer: null }
    )

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
