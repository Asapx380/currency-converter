import { describe, expect, it } from 'vitest'
import {
  apiCurrencyCode,
  computeRate,
  convertAmount,
  currencyFactor,
  readCachedRates,
  RATES_CACHE_KEY,
  XCG_PER_USD,
} from './exchange'

describe('apiCurrencyCode', () => {
  it('mapeia XCG para USD na API', () => {
    expect(apiCurrencyCode('XCG')).toBe('USD')
  })

  it('mantém os demais códigos', () => {
    expect(apiCurrencyCode('BRL')).toBe('BRL')
  })
})

describe('currencyFactor', () => {
  it('aplica o lastro do florim caribenho', () => {
    expect(currencyFactor('XCG')).toBe(XCG_PER_USD)
  })

  it('usa fator 1 para moedas oficiais', () => {
    expect(currencyFactor('USD')).toBe(1)
  })
})

describe('computeRate', () => {
  it('divide destino pela origem', () => {
    expect(computeRate('BRL', 'USD', { BRL: 5, USD: 1 })).toBe(0.2)
  })

  it('retorna null se alguma taxa faltar', () => {
    expect(computeRate('BRL', 'USD', { BRL: 5 })).toBeNull()
    expect(computeRate('BRL', 'USD', { BRL: 0, USD: 1 })).toBeNull()
  })
})

describe('convertAmount', () => {
  it('multiplica valor pela taxa', () => {
    expect(convertAmount('1000', 0.2)).toBe(200)
  })

  it('retorna 0 sem taxa ou valor válido', () => {
    expect(convertAmount('1000', null)).toBe(0)
    expect(convertAmount('', 0.2)).toBe(0)
  })
})

describe('readCachedRates', () => {
  it('retorna objeto vazio sem cache', () => {
    expect(
      readCachedRates({
        getItem: () => null,
      }),
    ).toEqual({})
  })

  it('rejeita JSON inválido ou valores não numéricos', () => {
    expect(
      readCachedRates({
        getItem: () => '{',
      }),
    ).toEqual({})
    expect(
      readCachedRates({
        getItem: (key) =>
          key === RATES_CACHE_KEY ? '{"BRL":"cinco"}' : null,
      }),
    ).toEqual({})
  })

  it('devolve taxas válidas', () => {
    expect(
      readCachedRates({
        getItem: () => '{"BRL":5.2,"USD":1}',
      }),
    ).toEqual({ BRL: 5.2, USD: 1 })
  })
})
