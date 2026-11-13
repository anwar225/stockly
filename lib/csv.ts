/**
 * CSV Helper functions for exporting data
 * Provides utilities for CSV generation, escaping, and response formatting
 */

/**
 * Escapes a value for CSV format
 * Handles semicolons, quotes, newlines, and null/undefined values
 * Also protects against CSV formula injection by neutralizing dangerous prefixes
 * Applies CSV escaping as the final step for all text values
 */
export function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  // If value is a number, return it as-is (no CSV formula injection risk for numbers)
  if (typeof value === 'number') {
    return String(value)
  }

  let stringValue = String(value)

  // Check for dangerous formula injection prefixes after trimming leading whitespace/control chars
  const trimmedValue = stringValue.trimStart()
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r', '\n']
  const hasDangerousPrefix = dangerousPrefixes.some(prefix => trimmedValue.startsWith(prefix))

  // If the value has a dangerous prefix, neutralize it with an apostrophe prefix
  if (hasDangerousPrefix) {
    stringValue = `'${stringValue}`
  }

  // Apply CSV escaping as the final step for all text values
  // If the value contains semicolon, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Generates a CSV string from headers and data rows
 */
export function createCsv(headers: string[], rows: string[][]): string {
  const headerRow = headers.map(escapeCsv).join(';')
  const dataRows = rows.map(row => row.map(escapeCsv).join(';'))
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Creates a NextResponse with CSV content
 * Includes UTF-8 BOM for Excel compatibility
 */
export function csvResponse(csv: string, filename: string): Response {
  const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const csvWithBom = bom + csv

  return new Response(csvWithBom, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

/**
 * Formats a date for CSV export
 */
export function formatDateForCsv(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Formats a payment method for CSV export
 */
export function formatPaymentMethodForCsv(method: string): string {
  const methodMap: Record<string, string> = {
    CASH: 'Espèces',
    CARD: 'Carte',
    BANK_TRANSFER: 'Virement bancaire',
    CHECK: 'Chèque',
  }
  return methodMap[method] || method
}

/**
 * Formats a stock status for CSV export
 */
export function formatStockStatusForCsv(status: string): string {
  const statusMap: Record<string, string> = {
    IN_STOCK: 'En stock',
    LOW_STOCK: 'Stock faible',
    OUT_OF_STOCK: 'Rupture de stock',
  }
  return statusMap[status] || status
}

/**
 * Formats a sale status for CSV export
 */
export function formatSaleStatusForCsv(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'Brouillon',
    CONFIRMED: 'Confirmée',
    CANCELLED: 'Annulée',
  }
  return statusMap[status] || status
}

/**
 * Formats a purchase status for CSV export
 */
export function formatPurchaseStatusForCsv(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'Brouillon',
    ORDERED: 'Commandé',
    RECEIVED: 'Reçu',
    CANCELLED: 'Annulé',
  }
  return statusMap[status] || status
}

/**
 * Formats an invoice status for CSV export
 */
export function formatInvoiceStatusForCsv(status: string): string {
  const statusMap: Record<string, string> = {
    UNPAID: 'Non payée',
    PARTIALLY_PAID: 'Partiellement payée',
    PAID: 'Payée',
  }
  return statusMap[status] || status
}
