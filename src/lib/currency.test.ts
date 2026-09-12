import { describe, expect, it } from 'vitest'
import {
  formatApiDate,
  formatAxisDate,
  formatCurrency,
  formatDisplayDate,
  parseAmount,
  sanitizeAmount,
} from './currency'

describe('sanitizeAmount', () => {
  it('remove letras e troca vírgula por ponto', () => {
    expect(sanitizeAmount('R$ 12,5')).toBe('12.5')
  })

  it('mantém só duas casas decimais mesmo com vários pontos', () => {
    expect(sanitizeAmount('1.234.56')).toBe('1.23')
  })

  it('aceita inteiro sem decimal', () => {
    expect(sanitizeAmount('1000')).toBe('1000')
  })

  it('ignora caracteres inválidos', () => {
    expect(sanitizeAmount('abc')).toBe('')
  })
})

describe('parseAmount', () => {
  it('retorna null para vazio ou só ponto', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('.')).toBeNull()
  })

  it('converte número válido', () => {
    expect(parseAmount('10.5')).toBe(10.5)
  })

  it('retorna null para valores não finitos', () => {
    expect(parseAmount('Infinity')).toBeNull()
  })
})

describe('formatApiDate', () => {
  it('formata Date em YYYY-MM-DD', () => {
    expect(formatApiDate(new Date('2024-03-15T12:00:00.000Z'))).toBe(
      '2024-03-15',
    )
  })
})

describe('formatDisplayDate', () => {
  it('inverte ISO para dd/mm/aaaa', () => {
    expect(formatDisplayDate('2024-03-15')).toBe('15/03/2024')
  })

  it('usa traço quando a data não existe', () => {
    expect(formatDisplayDate()).toBe('—')
  })
})

describe('formatAxisDate', () => {
  it('mostra dia e mês', () => {
    expect(formatAxisDate('2024-03-15')).toBe('15/03')
  })

  it('retorna string vazia sem data', () => {
    expect(formatAxisDate()).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formata BRL no locale pt-BR', () => {
    expect(formatCurrency(10, 'BRL')).toMatch(/R\$\s*10,00/)
  })

  it('trata XCG com sufixo fixo', () => {
    expect(formatCurrency(12.3, 'XCG')).toBe('12,30 XCG')
  })

  it('cai no fallback quando o código não é ISO', () => {
    expect(formatCurrency(12.34, 'AAAA')).toBe('12.34 AAAA')
  })
})
