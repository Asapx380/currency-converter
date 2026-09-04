import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { currencies, type Currency } from './data/currencies'
import {
  formatApiDate,
  formatAxisDate,
  formatCurrency,
  formatDisplayDate,
  parseAmount,
  sanitizeAmount,
} from './lib/currency'
import type { ChartRange, FrankfurterRate, HistoryPoint, Rates } from './types/exchange'

const chartDays: Record<ChartRange, number> = {
  '7D': 7,
  '1M': 30,
  '3M': 90,
  '1A': 365,
}

const frankfurterApi = 'https://api.frankfurter.dev'
const xcgPerUsd = 1.79

const chartWidth = 800
const chartHeight = 220
const chartPaddingLeft = 46
const chartPaddingRight = 12
const chartPaddingTop = 16
const chartPaddingBottom = 26
const chartUpColor = '#34d399'
const chartDownColor = '#f87171'

function apiCurrencyCode(code: string) {
  return code === 'XCG' ? 'USD' : code
}

function currencyFactor(code: string) {
  return code === 'XCG' ? xcgPerUsd : 1
}

function readCachedRates(): Rates {
  try {
    const storedRates = localStorage.getItem('cambio64-rates')

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

const FlagRow = ({ flags }: { flags: Currency[] }) => (
  <div className="marquee">
    <div className="marqueeTrack">
      {[flags, flags].map((group, groupIndex) => (
        <div className="marqueeGroup" key={groupIndex}>
          {group.map((item, index) => (
            <div
              className="flagCard"
              key={`${item.country}-${groupIndex}-${index}`}
              title={item.country}
            >
              <img
                src={`/flags/${item.flag}.png`}
                alt={`Bandeira de ${item.country}`}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
)
type CurrencyDropdownProps = {
  value: Currency
  label: string
  onChange: (currency: Currency) => void
}

function CurrencyDropdown({
  value,
  label,
  onChange,
}: CurrencyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCurrencies = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')

    return currencies.filter(
      (item) =>
        item.country.toLocaleLowerCase('pt-BR').includes(term) ||
        item.code.toLocaleLowerCase('pt-BR').includes(term) ||
        item.currency.toLocaleLowerCase('pt-BR').includes(term),
    )
  }, [search])

  useEffect(() => {
    function closeWhenClickingOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (!isOpen) return

    document.addEventListener('mousedown', closeWhenClickingOutside)

    return () => {
      document.removeEventListener('mousedown', closeWhenClickingOutside)
    }
  }, [isOpen])

  function selectCurrency(currency: Currency) {
    onChange(currency)
    setSearch('')
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setSearch('')
    }
  }

  return (
    <div
      className={`currency-dropdown ${isOpen ? 'is-open' : ''}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        className="currency-dropdown-trigger"
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <img src={`/flags/${value.flag}.png`} alt="" />

        <span className="currency-dropdown-value">
          <strong>{value.code}</strong>
          <small>{value.country}</small>
        </span>

        <span className="currency-dropdown-arrow">⌄</span>
      </button>

      {isOpen && (
        <div className="currency-dropdown-menu" role="listbox" aria-label={label}>
          <div className="currency-dropdown-search">
            <input
              autoFocus
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar moeda ou país"
              aria-label="Buscar moeda ou país"
            />
          </div>

          <div className="currency-dropdown-list">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((item) => (
                <button
                  className={`currency-dropdown-option ${item.country === value.country ? 'is-selected' : ''
                    }`}
                  key={item.country}
                  type="button"
                  role="option"
                  aria-selected={item.country === value.country}
                  onClick={() => selectCurrency(item)}
                >
                  <img src={`/flags/${item.flag}.png`} alt="" />

                  <span>
                    <strong>{item.code}</strong>
                    <small>{item.country}</small>
                  </span>

                  {item.country === value.country && (
                    <b aria-hidden="true">✓</b>
                  )}
                </button>
              ))
            ) : (
              <p className="currency-dropdown-empty">
                Nenhuma moeda encontrada.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [from, setFrom] = useState<Currency>(
    currencies.find((item) => item.code === 'BRL') ?? currencies[0],
  )

  const [to, setTo] = useState<Currency>(
    currencies.find((item) => item.code === 'USD') ?? currencies[1],
  )

  const [amount, setAmount] = useState('1000')
  const [rates, setRates] = useState<Rates>(readCachedRates)
  const [chartRange, setChartRange] = useState<ChartRange>('1M')
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const panelRef = useRef<HTMLDivElement>(null)
  const rateChartRef = useRef<HTMLElement>(null)
  const chartSvgRef = useRef<SVGSVGElement>(null)
  const spotlightFrameRef = useRef<number | null>(null)
  const spotlightPositionRef = useRef({ x: 50, y: 50 })

  const [hoverPoint, setHoverPoint] = useState<
    (HistoryPoint & { x: number; y: number }) | null
  >(null)

  function handlePanelMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const panel = panelRef.current

    if (!panel) return

    const bounds = panel.getBoundingClientRect()

    spotlightPositionRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    }

    if (spotlightFrameRef.current) return

    spotlightFrameRef.current = requestAnimationFrame(() => {
      const { x, y } = spotlightPositionRef.current

      panel.style.setProperty('--mx', `${x}%`)
      panel.style.setProperty('--my', `${y}%`)

      spotlightFrameRef.current = null
    })
  }

  useEffect(() => {
    return () => {
      if (spotlightFrameRef.current) {
        cancelAnimationFrame(spotlightFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadRates() {
      try {
        const availableCodes = Array.from(
          new Set(currencies.map((item) => apiCurrencyCode(item.code))),
        ).filter((code) => code !== 'USD')

        const response = await fetch(
          `${frankfurterApi}/v2/rates?base=USD&quotes=${availableCodes.join(',')}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Taxas indisponíveis')
        }

        const data = (await response.json()) as FrankfurterRate[]
        const nextRates: Rates = {
          USD: 1,
          XCG: xcgPerUsd,
        }

        data.forEach((item) => {
          if (item.base === 'USD' && Number.isFinite(item.rate)) {
            nextRates[item.quote] = item.rate
          }
        })

        if (Object.keys(nextRates).length > 2) {
          setRates(nextRates)
          localStorage.setItem('cambio64-rates', JSON.stringify(nextRates))
        }
      } catch {
        // Em caso de falha, usa as últimas taxas válidas salvas no navegador.
      }
    }

    loadRates()

    return () => controller.abort()
  }, [])

  const rate = useMemo(() => {
    const fromRate = rates[from.code]
    const toRate = rates[to.code]

    if (!fromRate || !toRate) return null

    return toRate / fromRate
  }, [from, rates, to])

  const convertedAmount = useMemo(() => {
    const numericAmount = parseAmount(amount)

    if (!rate || numericAmount === null) return 0

    return numericAmount * rate
  }, [amount, rate])

  useEffect(() => {
    const controller = new AbortController()

    async function loadHistory() {
      setHoverPoint(null)

      const apiFrom = apiCurrencyCode(from.code)
      const apiTo = apiCurrencyCode(to.code)
      const pairFactor = currencyFactor(to.code) / currencyFactor(from.code)

      if (apiFrom === apiTo) {
        setHistory([
          {
            date: formatApiDate(new Date(Date.now() - 86_400_000)),
            value: pairFactor,
          },
          {
            date: formatApiDate(new Date()),
            value: pairFactor,
          },
        ])

        setHistoryLoading(false)
        return
      }

      setHistoryLoading(true)

      const endDate = new Date()
      const startDate = new Date()

      startDate.setDate(endDate.getDate() - chartDays[chartRange])

      try {
        const response = await fetch(
          `${frankfurterApi}/v2/rates?from=${formatApiDate(
            startDate,
          )}&to=${formatApiDate(endDate)}&base=${apiFrom}&quotes=${apiTo}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Histórico indisponível')
        }

        const data = (await response.json()) as FrankfurterRate[]

        const points = data
          .map((item) => ({
            date: item.date,
            value: item.rate * pairFactor,
          }))
          .filter((point) => Number.isFinite(point.value))
          .sort((first, second) => first.date.localeCompare(second.date))

        setHistory(points)
      } catch {
        if (!controller.signal.aborted) {
          setHistory([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false)
        }
      }
    }

    loadHistory()

    return () => controller.abort()
  }, [from.code, to.code, chartRange])

  const chartGeometry = useMemo(() => {
    if (history.length < 2) return null

    const plotWidth = chartWidth - chartPaddingLeft - chartPaddingRight
    const plotHeight = chartHeight - chartPaddingTop - chartPaddingBottom

    const values = history.map((point) => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || Math.max(max * 0.02, 0.01)

    const points = history.map((point, index) => {
      const x =
        chartPaddingLeft + (index / (history.length - 1)) * plotWidth

      const y =
        chartPaddingTop +
        plotHeight -
        ((point.value - min) / range) * plotHeight

      return { ...point, x, y }
    })

    const line = points
      .map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(
          2,
        )}`,
      )
      .join(' ')

    const floorY = chartPaddingTop + plotHeight

    const area = `${line} L ${points[points.length - 1].x.toFixed(
      2,
    )} ${floorY} L ${points[0].x.toFixed(2)} ${floorY} Z`

    const yTicks = [max, (max + min) / 2, min].map((value) => ({
      value,
      y:
        chartPaddingTop +
        plotHeight -
        ((value - min) / range) * plotHeight,
    }))

    const tickCount = Math.min(5, points.length)

    const xTicks = Array.from({ length: tickCount }, (_, index) => {
      const pointIndex = Math.round(
        (index / (tickCount - 1)) * (points.length - 1),
      )

      return points[pointIndex]
    })

    return { line, area, points, yTicks, xTicks }
  }, [history])

  const trendUp =
    history.length >= 2
      ? history[history.length - 1].value >= history[0].value
      : true

  const chartColor = trendUp ? chartUpColor : chartDownColor

  function updateHoverPoint(clientX: number) {
    if (!chartGeometry) return

    const svg = chartSvgRef.current

    if (!svg) return

    const bounds = svg.getBoundingClientRect()
    const relativeX =
      ((clientX - bounds.left) / bounds.width) * chartWidth

    let closest = chartGeometry.points[0]
    let closestDistance = Math.abs(closest.x - relativeX)

    for (const point of chartGeometry.points) {
      const distance = Math.abs(point.x - relativeX)

      if (distance < closestDistance) {
        closest = point
        closestDistance = distance
      }
    }

    setHoverPoint(closest)
  }

  function handleChartPointerMove(
    event: React.PointerEvent<SVGSVGElement>,
  ) {
    updateHoverPoint(event.clientX)
  }

  function handleChartKeyDown(
    event: React.KeyboardEvent<SVGSVGElement>,
  ) {
    if (!chartGeometry) return

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()

    const currentIndex = hoverPoint
      ? chartGeometry.points.findIndex(
        (point) => point.date === hoverPoint.date,
      )
      : 0

    const direction = event.key === 'ArrowRight' ? 1 : -1

    const nextIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      chartGeometry.points.length - 1,
    )

    setHoverPoint(chartGeometry.points[nextIndex])
  }

  function handleChartMouseLeave() {
    setHoverPoint(null)
  }

  function swapCurrencies() {
    setFrom(to)
    setTo(from)
  }

  function showQuote(): void {
    rateChartRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  return (
    <main className="app">
      <nav className="nav">
        <a className="logo" href="/">
          câmbio<span>64</span>
        </a>
      </nav>

      <section className="hero">
        <p className="eyebrow">CÂMBIO GLOBAL, SIMPLIFICADO</p>

        <h1>
          Movimente-se entre
          <span> moedas.</span>
        </h1>

        <p className="heroText">
          Compare moedas, acompanhe taxas e converta valores entre 64 países.
        </p>

        <a className="heroButton" href="#conversor">
          Começar a converter <span>→</span>
        </a>
      </section>

      <section className="stats">
        <div>
          <strong>64</strong>
          <span>países disponíveis</span>
        </div>

        <div>
          <strong>24h</strong>
          <span>atualização de taxas</span>
        </div>

        <div>
          <strong>1 lugar</strong>
          <span>para acompanhar seu câmbio</span>
        </div>
      </section>

      <section className="workspace" id="conversor">
        <div
          className="converter-panel"
          ref={panelRef}
          onMouseMove={handlePanelMouseMove}
        >
          <header className="converter-header">
            <div>
              <p className="converter-kicker">CONVERSÃO INTELIGENTE</p>
              <h2>Escolha o seu câmbio</h2>
            </div>

            <span className="markets-badge">64 países</span>
          </header>

          <div className="exchange-stage">
            <div className="currency-side send-side">
              <div className="currency-side-top">
                <span>Você envia</span>
                <strong>{from.code}</strong>
              </div>

              <CurrencyDropdown
                value={from}
                label="Moeda que você envia"
                onChange={setFrom}
              />

              <div className="currency-value">
                <input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) =>
                    setAmount(sanitizeAmount(event.target.value))
                  }
                  aria-label="Valor a enviar"
                />
                <span>{from.symbol}</span>
              </div>

              <p>
                {from.currency} · {from.country}
              </p>
            </div>

            <button
              className="swap-button swap-button-main"
              type="button"
              onClick={swapCurrencies}
              aria-label="Inverter moedas"
            >
              ⇄
            </button>

            <div className="currency-side receive-side">
              <div className="currency-side-top">
                <span>Você recebe</span>
                <strong>{to.code}</strong>
              </div>

              <CurrencyDropdown
                value={to}
                label="Moeda que você recebe"
                onChange={setTo}
              />

              <div className="received-value">
                <span
                  key={
                    rate
                      ? `${convertedAmount.toFixed(6)}-${to.code}`
                      : 'unavailable'
                  }
                >
                  {rate
                    ? formatCurrency(convertedAmount, to.code)
                    : 'Taxa indisponível'}
                </span>
              </div>

              <p>
                {to.currency} · {to.country}
              </p>
            </div>
          </div>

          <section className="rate-chart" id="grafico" ref={rateChartRef}>
            <header className="rate-chart-header">
              <div>
                <p>Histórico da taxa</p>
                <h3>
                  {rate
                    ? `1 ${from.code} = ${rate.toLocaleString('pt-BR', {
                      maximumFractionDigits: 4,
                    })} ${to.code}`
                    : 'Taxa indisponível'}
                </h3>
              </div>

              <div className="chart-tabs">
                {(['7D', '1M', '3M', '1A'] as ChartRange[]).map((period) => (
                  <button
                    className={chartRange === period ? 'active' : ''}
                    key={period}
                    type="button"
                    onClick={() => setChartRange(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </header>

            <div className="chart-canvas">
              {historyLoading && (
                <p className="chart-message">Carregando histórico…</p>
              )}

              {!historyLoading && !chartGeometry && (
                <p className="chart-message">
                  Histórico indisponível para esta combinação.
                </p>
              )}

              {!historyLoading && chartGeometry && (
                <svg
                  ref={chartSvgRef}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  role="img"
                  tabIndex={0}
                  aria-label={`Histórico de ${from.code} para ${to.code}`}
                  onPointerDown={handleChartPointerMove}
                  onPointerMove={handleChartPointerMove}
                  onPointerLeave={handleChartMouseLeave}
                  onPointerCancel={handleChartMouseLeave}
                  onKeyDown={handleChartKeyDown}
                >
                  <defs>
                    <linearGradient
                      id="chartGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={chartColor}
                        stopOpacity="0.32"
                      />
                      <stop
                        offset="100%"
                        stopColor={chartColor}
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  {chartGeometry.yTicks.map((tick, index) => (
                    <g key={`${tick.value}-${index}`}>
                      <line
                        className="chart-gridline"
                        x1={chartPaddingLeft}
                        x2={chartWidth - chartPaddingRight}
                        y1={tick.y}
                        y2={tick.y}
                      />

                      <text
                        className="chart-axis-label"
                        x={chartPaddingLeft - 10}
                        y={tick.y + 4}
                        textAnchor="end"
                      >
                        {tick.value.toLocaleString('pt-BR', {
                          maximumFractionDigits: 2,
                        })}
                      </text>
                    </g>
                  ))}

                  {chartGeometry.xTicks.map((point) => (
                    <text
                      className="chart-axis-label"
                      key={point.date}
                      x={point.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                    >
                      {formatAxisDate(point.date)}
                    </text>
                  ))}

                  <path d={chartGeometry.area} fill="url(#chartGradient)" />

                  <path
                    key={`${from.code}-${to.code}-${chartRange}-${chartGeometry.line}`}
                    d={chartGeometry.line}
                    fill="none"
                    stroke={chartColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {hoverPoint && (
                    <g>
                      <line
                        className="chart-hover-line"
                        x1={hoverPoint.x}
                        x2={hoverPoint.x}
                        y1={chartPaddingTop}
                        y2={chartHeight - chartPaddingBottom}
                      />

                      <circle
                        cx={hoverPoint.x}
                        cy={hoverPoint.y}
                        r="4.5"
                        fill={chartColor}
                        stroke="#0c1123"
                        strokeWidth="2"
                      />
                    </g>
                  )}
                </svg>
              )}

              {hoverPoint && (
                <div
                  className="chart-tooltip"
                  style={{
                    left: `${(hoverPoint.x / chartWidth) * 100}%`,
                    top: `${(hoverPoint.y / chartHeight) * 100}%`,
                  }}
                >
                  <strong>{formatDisplayDate(hoverPoint.date)}</strong>
                  <span>
                    {hoverPoint.value.toLocaleString('pt-BR', {
                      maximumFractionDigits: 4,
                    })}{' '}
                    {to.code}
                  </span>
                </div>
              )}
            </div>
          </section>

          <footer className="quote-footer">
            <div>
              <span>Taxa de referência</span>
              <strong>
                {rate
                  ? `1 ${from.code} = ${rate.toLocaleString('pt-BR', {
                    maximumFractionDigits: 4,
                  })} ${to.code}`
                  : 'Indisponível'}
              </strong>
            </div>

            <button
              className="continue-button"
              type="button"
              onClick={showQuote}
            >
              Ver cotação <span>→</span>
            </button>
          </footer>
        </div>
      </section>

      <section className="flagsSection" id="moedas">
        <div className="flagsAnimation flagsAnimationSingle">
          <FlagRow flags={currencies} />
        </div>

        <div className="flagsHeading">
          <p>UMA SELEÇÃO CONSTRUÍDA PARA O MUNDO REAL.</p>
          <h2>Todas as 64 bandeiras fazem parte da experiência.</h2>
        </div>
      </section>
    </main>
  )
}

export default App
