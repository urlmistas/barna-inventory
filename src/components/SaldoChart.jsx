import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Area, AreaChart, Bar, BarChart, Brush, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { brl } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const dia = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
const hora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const eixo = { stroke: 'var(--muted-foreground)', fontSize: 11, tickLine: false, axisLine: false }

function Dica({ active, payload, label, linhas }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-muted-foreground">{label}</p>
      {linhas(d).map(([nome, valor]) => (
        <p key={nome} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{nome}</span>
          <b className="tabular-nums">{valor}</b>
        </p>
      ))}
    </div>
  )
}

function Saldo({ movs }) {
  const dados = useMemo(() => {
    let saldo = 0
    return [...movs]
      .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em))
      .map((m) => {
        const delta = (m.tipo === 'venda' ? 1 : -1) * Number(m.valor)
        saldo += delta
        return {
          hora: hora(m.criado_em),
          saldo: Math.round(saldo * 100) / 100,
          delta,
          tipo: m.tipo === 'venda' ? 'Venda' : 'Compra',
        }
      })
  }, [movs])

  if (dados.length < 2) return <Vazio texto="O gráfico aparece com 2 ou mais lançamentos." />

  return (
    <ResponsiveContainer>
      <AreaChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="hora" hide />
        <YAxis {...eixo} width={52} tickFormatter={(v) => brl(v).replace(',00', '')} />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
        <Tooltip
          cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
          content={<Dica linhas={(d) => [['Lançamento', `${d.tipo} ${d.delta >= 0 ? '+' : '−'}${brl(Math.abs(d.delta))}`], ['Saldo', brl(d.saldo)]]} />}
        />
        <Area
          type="monotone" dataKey="saldo" stroke="var(--primary)" strokeWidth={2.5} fill="url(#saldoFill)"
          dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
        />
        {dados.length > 12 && <Brush dataKey="hora" height={22} stroke="var(--primary)" fill="var(--muted)" travellerWidth={8} />}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function VendasPorDia({ movs }) {
  const dados = useMemo(() => {
    const por = new Map()
    for (const m of [...movs].sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em))) {
      if (m.tipo !== 'venda') continue
      const k = dia(m.criado_em)
      const d = por.get(k) || { dia: k, latas: 0, valor: 0 }
      d.latas += m.qtd
      d.valor += Number(m.valor)
      por.set(k, d)
    }
    return [...por.values()]
  }, [movs])

  if (dados.length === 0) return <Vazio texto="Ainda não há vendas." />

  return (
    <ResponsiveContainer>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="dia" {...eixo} />
        <YAxis {...eixo} width={28} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'var(--accent)', opacity: 0.5 }}
          content={<Dica linhas={(d) => [['Latas', String(d.latas)], ['Recebido', brl(d.valor)]]} />}
        />
        <Bar dataKey="latas" fill="var(--primary)" radius={[8, 8, 0, 0]} maxBarSize={56} activeBar={{ fill: 'var(--primary)', opacity: 0.8 }} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const Vazio = ({ texto }) => (
  <p className="grid h-full place-items-center text-center text-sm text-muted-foreground">{texto}</p>
)

export function GraficoCard({ movs }) {
  const [aba, setAba] = useState('saldo')
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="grid gap-1">
          <CardTitle className="text-base">{aba === 'saldo' ? 'Saldo ao longo do tempo' : 'Vendas por dia'}</CardTitle>
          <CardDescription>
            {aba === 'saldo' ? 'Recebido menos gasto. Passe o mouse ou toque nos pontos.' : 'Latas vendidas em cada dia.'}
          </CardDescription>
        </div>
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList>
            <TabsTrigger value="saldo">Saldo</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full lg:h-72">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={aba} className="h-full w-full"
              initial={{ opacity: 0, x: aba === 'saldo' ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {aba === 'saldo' ? <Saldo movs={movs} /> : <VendasPorDia movs={movs} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
