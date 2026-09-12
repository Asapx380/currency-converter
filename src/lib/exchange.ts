import type { Rates } from '../types/exchange'
import { parseAmount } from './currency'

export const RATES_CACHE_KEY = 'cambio64-rates'
export const XCG_PER_USD = 1.79

export function apiCurrencyCode(code: string) {
  return code === 'XCG' ? 'USD' : code
}

export function currencyFactor(code: string) {
  return code === 'XCG' ? XCG_PER_USD : 1
}

export function computeRate(
  fromCode: string,
  toCode: string,
  rates: Rates,
): number | null {
  const fromRate = rates[fromCode]
  const toRate = rates[toCode]

  if (!fromRate || !toRate) return null

  return toRate / fromRate
}

export function convertAmount(amount: string, rate: number | null) {
  const numericAmount = parseAmount(amount)

  if (!rate || numericAmount === null) return 0

  return numericAmount * rate
}

export function readCachedRates(
  storage: { getItem(key: string): string | null } = globalThis.localStorage,
): Rates {
  try {
    const storedRates = storage.getItem(RATES_CACHE_KEY)

    if (!storedRates) return {}

    const parsedRates = JSON.parse(storedRates) as Rates

    const isValid = Object.values(parsedRates).every(
      (value) => typeof value === 'number' && Number.isFinite(value),
    )

    return isValid ? parsedRates : {}
  } catch {
    return {}
  }
}
