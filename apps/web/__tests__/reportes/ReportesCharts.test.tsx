import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportesCharts } from '@/components/dashboard/ReportesCharts'

// ── Base props ─────────────────────────────────────────────────────────────────

const BASE_PROPS = {
  coverageRate:          42,
  supportRate:           35,
  activeVolunteers:       8,
  communicationsReach: 1200,
  totalContacts:        500,
  totalVisits:          210,
  visitsByDay: [
    { date: '01/03', visitas: 12 },
    { date: '02/03', visitas: 18 },
  ],
  visitResults: [
    { name: 'Positivo',  value: 90 },
    { name: 'Negativo',  value: 40 },
    { name: 'Indeciso',  value: 50 },
    { name: 'No estaba', value: 30 },
  ],
  contactIntentions: [
    { name: 'Simpatizante', value: 175 },
    { name: 'Opositor',     value: 100 },
    { name: 'Indeciso',     value: 150 },
    { name: 'Desconocido',  value:  75 },
  ],
  territoryCoverage: [
    { name: 'Zona Norte', visitas: 45 },
    { name: 'Zona Sur',   visitas: 30 },
  ],
  volunteerRanking: [
    { id: 'v1', name: 'Ana García',   visitas: 32 },
    { id: 'v2', name: 'Luis Herrera', visitas: 25 },
  ],
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ReportesCharts', () => {

  // ── KPI cards ──────────────────────────────────────────────────────────────

  it('muestra el porcentaje de cobertura', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('muestra el porcentaje de simpatizantes', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getAllByText('35%').length).toBeGreaterThan(0)
  })

  it('muestra el número de voluntarios activos', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('muestra el alcance de comunicaciones formateado', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    // toLocaleString output varies by environment — just check the number appears
    expect(screen.getByText(/1[.,]?200/)).toBeInTheDocument()
  })

  // ── Gráficas ───────────────────────────────────────────────────────────────

  it('renderiza BarChart de visitas por día cuando hay datos', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renderiza 2 DonutCharts (resultados + intención de voto)', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getAllByTestId('donut-chart')).toHaveLength(2)
  })

  // ── Tabla de territorios ───────────────────────────────────────────────────

  it('muestra los nombres de territorios en la tabla', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getByText('Zona Norte')).toBeInTheDocument()
    expect(screen.getByText('Zona Sur')).toBeInTheDocument()
  })

  it('muestra el conteo de visitas por territorio', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  // ── Ranking de voluntarios ─────────────────────────────────────────────────

  it('muestra el nombre de los voluntarios en el ranking', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('Luis Herrera')).toBeInTheDocument()
  })

  it('muestra el conteo de visitas por voluntario', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.getByText('32')).toBeInTheDocument()
  })

  // ── Edge cases (datos vacíos) ──────────────────────────────────────────────

  it('no crashea con datos vacíos', () => {
    render(<ReportesCharts
      {...BASE_PROPS}
      visitsByDay={[]}
      visitResults={[]}
      contactIntentions={[]}
      territoryCoverage={[]}
      volunteerRanking={[]}
      totalContacts={0}
      totalVisits={0}
      coverageRate={0}
      supportRate={0}
      activeVolunteers={0}
      communicationsReach={0}
    />)
    // Both coverageRate and supportRate are 0%, so there will be multiple — use getAllBy
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1)
  })

  it('muestra estado vacío cuando no hay territorios', () => {
    render(<ReportesCharts {...BASE_PROPS} territoryCoverage={[]} />)
    expect(screen.getByText('Sin datos de territorios aún')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay voluntarios', () => {
    render(<ReportesCharts {...BASE_PROPS} volunteerRanking={[]} />)
    expect(screen.getByText('Sin actividad de voluntarios aún')).toBeInTheDocument()
  })

  // ── Referral KPIs ────────────────────────────────────────────────────────

  it('muestra KPIs de referidos cuando hay registros', () => {
    render(<ReportesCharts {...BASE_PROPS} registrationsPublic={150} registrationsReferred={45} />)
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('Registros directos')).toBeInTheDocument()
    expect(screen.getByText('Registros por referido')).toBeInTheDocument()
  })

  it('no muestra KPIs de referidos cuando ambos son 0', () => {
    render(<ReportesCharts {...BASE_PROPS} registrationsPublic={0} registrationsReferred={0} />)
    expect(screen.queryByText('Registros directos')).not.toBeInTheDocument()
  })

  it('muestra leaderboard de captadores', () => {
    render(
      <ReportesCharts
        {...BASE_PROPS}
        referralRanking={[
          { referrer_code: '573001112222', referrer_name: 'Pedro Gómez', total_referred: 15 },
          { referrer_code: '573003334444', referrer_name: null, total_referred: 8 },
        ]}
      />
    )
    expect(screen.getByText('Top Captadores')).toBeInTheDocument()
    expect(screen.getByText('Pedro Gómez')).toBeInTheDocument()
    expect(screen.getByText('573003334444')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('no muestra leaderboard sin datos de referidos', () => {
    render(<ReportesCharts {...BASE_PROPS} referralRanking={[]} />)
    expect(screen.queryByText('Top Captadores')).not.toBeInTheDocument()
  })

  it('no crashea sin props de referidos', () => {
    render(<ReportesCharts {...BASE_PROPS} />)
    expect(screen.queryByText('Top Captadores')).not.toBeInTheDocument()
    expect(screen.queryByText('Registros directos')).not.toBeInTheDocument()
  })
})
