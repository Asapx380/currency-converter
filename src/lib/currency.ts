export const formatApiDate = (date: Date) => date.toISOString().slice(0, 10)

export function formatDisplayDate(date?: string) {
  return date ? date.split('-').reverse().join('/') : '—'
}

export function formatAxisDate(date?: string) {
  if (!date) return ''

  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

export function sanitizeAmount(value: string) {
  const onlyNumbers = value.replace(/[^0-9,.]/g, '').replace(',', '.')
  const [integerPart, ...decimalParts] = onlyNumbers.split('.')

  return decimalParts.length === 0
    ? integerPart
    : `${integerPart}.${decimalParts.join('').slice(0, 2)}`
}

export function parseAmount(value: string) {
  if (!value || value === '.') return null

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

export function formatCurrency(value: number, currencyCode: string) {
  if (currencyCode === 'XCG') {
    return `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} XCG`
  }

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`
  }
}
