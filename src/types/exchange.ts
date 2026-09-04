export type Rates = Record<string, number>

export type ChartRange = '7D' | '1M' | '3M' | '1A'

export type HistoryPoint = {
  date: string
  value: number
}

export type FrankfurterRate = {
  date: string
  base: string
  quote: string
  rate: number
}
