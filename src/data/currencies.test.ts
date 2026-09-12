import { describe, expect, it } from 'vitest'
import { currencies } from './currencies'

describe('catálogo de moedas', () => {
  it('lista 64 países com campos obrigatórios', () => {
    expect(currencies).toHaveLength(64)

    for (const item of currencies) {
      expect(item.country.length).toBeGreaterThan(0)
      expect(item.currency.length).toBeGreaterThan(0)
      expect(item.code).toMatch(/^[A-Z]{3}$/)
      expect(item.symbol.length).toBeGreaterThan(0)
      expect(item.flag.length).toBeGreaterThan(0)
    }
  })

  it('inclui BRL e USD usados como padrão do conversor', () => {
    expect(currencies.some((item) => item.code === 'BRL')).toBe(true)
    expect(currencies.some((item) => item.code === 'USD')).toBe(true)
  })
})
