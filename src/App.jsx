import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import {
  LogOut, Minus, Plus, PackagePlus, ShoppingCart, TrendingDown, TrendingUp, Wallet, X, Loader2, Inbox,
} from 'lucide-react'
import { supabase } from '@/supabase.js'
import { brl, cn, quando } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { GraficoCard } from '@/components/SaldoChart'
import { Login } from '@/components/Login'
import { mostrarApagado, mostrarPago } from '@/components/PagoToast'

function lerPreco() {
  try { return Number(localStorage.getItem('preco')) || 6 } catch { return 6 }
}

function Anel({ pct, children }) {
  const raio = 52
  const c = 2 * Math.PI * raio
  return (
    <div className="relative grid size-44 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={raio} fill="none" strokeWidth="9" className="stroke-muted" />
        <motion.circle
          cx="60" cy="60" r={raio} fill="none" strokeWidth="9" strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

function Stat({ icon: Icon, rotulo, valor, tom }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{rotulo}</span>
          <Icon className={cn('size-4', tom)} />
        </div>
        <strong className={cn('text-lg font-bold tabular-nums tracking-tight sm:text-xl', tom)}>
          <AnimatedNumber value={valor} format={brl} />
        </strong>
      </CardContent>
    </Card>
  )
}

function Painel({ sessao }) {
  const [movs, setMovs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [preco, setPreco] = useState(lerPreco)
  const [qtd, setQtd] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [compraAberta, setCompraAberta] = useState(false)
  const [compra, setCompra] = useState({ qtd: '6', total: '22' })

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('estoque_mov').select('*').order('criado_em', { ascending: false })
    if (error) toast.error('Não consegui carregar os dados.')
    else setMovs(data)
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const r = useMemo(() => {
    const soma = (tipo, campo) =>
      movs.filter((m) => m.tipo === tipo).reduce((s, m) => s + Number(m[campo]), 0)
    const comprado = soma('compra', 'qtd')
    const vendido = soma('venda', 'qtd')
    const custo = soma('compra', 'valor')
    const receita = soma('venda', 'valor')
    return { estoque: comprado - vendido, comprado, vendido, custo, receita, saldo: receita - custo }
  }, [movs])

  const pct = r.comprado ? (r.vendido / r.comprado) * 100 : 0
  const qtdOk = Math.min(qtd, Math.max(r.estoque, 1))
  const total = qtdOk * Number(preco || 0)
  const visiveis = movs.filter((m) => filtro === 'todos' || m.tipo === filtro)

  async function registrar(tipo, n, valor) {
    setSalvando(true)
    const { error } = await supabase.from('estoque_mov').insert({ tipo, qtd: n, valor })
    setSalvando(false)
    if (error) { toast.error('Não consegui salvar. Tente de novo.'); return false }
    await carregar()
    return true
  }

  async function vender() {
    if (await registrar('venda', qtdOk, total)) {
      mostrarPago('Pago!', `${qtdOk} ${qtdOk === 1 ? 'lata' : 'latas'} · ${brl(total)}`)
      setQtd(1)
    }
  }

  async function salvarCompra(e) {
    e.preventDefault()
    const n = parseInt(compra.qtd, 10)
    const valor = parseFloat(String(compra.total).replace(',', '.'))
    if (!(n > 0) || !(valor >= 0)) return
    if (await registrar('compra', n, valor)) {
      toast.success(`Compra registrada: +${n} latas`)
      setCompraAberta(false)
    }
  }

  async function apagar(m) {
    const { error } = await supabase.from('estoque_mov').delete().eq('id', m.id)
    if (error) { toast.error('Não consegui apagar.'); return }
    await carregar()
    mostrarApagado(
      m.tipo === 'venda' ? 'Pagamento apagado' : 'Compra apagada',
      `${m.qtd} ${m.qtd === 1 ? 'lata' : 'latas'} · ${brl(m.valor)}`,
      {
        label: 'Desfazer',
        onClick: async () => {
          const { id, user_id, criado_em, produto, tipo, qtd: q, valor } = m
          await supabase.from('estoque_mov').insert({ id, user_id, criado_em, produto, tipo, qtd: q, valor })
          carregar()
        },
      }
    )
  }

  function mudarPreco(v) {
    setPreco(v)
    try { localStorage.setItem('preco', String(v)) } catch { /* sem armazenamento */ }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pb-16 pt-5 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="./box.png" alt="" className="size-11 drop-shadow-md" />
          <div className="leading-tight">
            <h1 className="text-lg font-extrabold tracking-tight">Estoque</h1>
            <p className="text-xs text-muted-foreground">Coca-Cola</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} title={sessao.user.email}>
          <LogOut /> Sair
        </Button>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-5">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-3 p-6">
          <Anel pct={pct}>
            <div className="text-5xl font-extrabold tabular-nums tracking-tighter">
              <AnimatedNumber value={r.estoque} />
            </div>
            <div className="text-xs font-medium text-muted-foreground">{r.estoque === 1 ? 'lata em estoque' : 'latas em estoque'}</div>
          </Anel>
          <Badge variant="muted">{r.vendido} vendidas de {r.comprado}</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={TrendingDown} rotulo="Gastei" valor={r.custo} />
        <Stat icon={TrendingUp} rotulo="Recebi" valor={r.receita} tom="text-success" />
        <Stat icon={Wallet} rotulo="Saldo" valor={r.saldo} tom={r.saldo >= 0 ? 'text-success' : 'text-destructive'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova venda</CardTitle>
          <CardDescription>Escolha quantas latas e confirme.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <Button variant="ghost" size="icon-sm" aria-label="Menos" onClick={() => setQtd(Math.max(1, qtd - 1))} disabled={qtdOk <= 1}><Minus /></Button>
                <span className="w-8 text-center text-base font-bold tabular-nums">{qtdOk}</span>
                <Button variant="ghost" size="icon-sm" aria-label="Mais" onClick={() => setQtd(Math.min(r.estoque, qtdOk + 1))} disabled={qtdOk >= r.estoque}><Plus /></Button>
              </div>
            </div>
            <div className="grid flex-1 gap-2">
              <Label htmlFor="preco">Preço por lata (R$)</Label>
              <Input id="preco" type="number" inputMode="decimal" min="0" step="0.5" value={preco} onChange={(e) => mudarPreco(e.target.value)} />
            </div>
          </div>
          <Button size="lg" onClick={vender} disabled={r.estoque < 1 || salvando}>
            {salvando ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
            Vender · {brl(total)}
          </Button>
          {r.estoque < 1 && !carregando && <p className="text-center text-sm text-muted-foreground">Sem estoque. Registre uma compra.</p>}
          <Button variant="secondary" onClick={() => setCompraAberta(true)}>
            <PackagePlus /> Registrar compra
          </Button>
        </CardContent>
      </Card>
      </div>
      <div className="flex flex-col gap-5 lg:col-span-7">
      <GraficoCard movs={movs} />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Histórico</CardTitle>
          <Tabs value={filtro} onValueChange={setFiltro}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="venda">Vendas</TabsTrigger>
              <TabsTrigger value="compra">Compras</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : visiveis.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Inbox className="size-8" />
              <p className="text-sm">Nada por aqui ainda.</p>
            </div>
          ) : (
            <ul className="divide-y">
              <AnimatePresence initial={false}>
                {visiveis.map((m) => (
                  <motion.li
                    key={m.id} layout
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 overflow-hidden py-3"
                  >
                    <div className={cn('grid size-9 shrink-0 place-items-center rounded-full', m.tipo === 'venda' ? 'bg-success/15 text-success' : 'bg-accent text-accent-foreground')}>
                      {m.tipo === 'venda' ? <TrendingUp className="size-4" /> : <PackagePlus className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {m.tipo === 'venda' ? 'Venda' : 'Compra'} · {m.tipo === 'venda' ? '−' : '+'}{m.qtd} {m.qtd === 1 ? 'lata' : 'latas'}
                      </p>
                      <p className="text-xs text-muted-foreground">{quando(m.criado_em)}</p>
                    </div>
                    <span className={cn('text-sm font-bold tabular-nums', m.tipo === 'venda' ? 'text-success' : 'text-foreground')}>
                      {m.tipo === 'venda' ? '+' : '−'}{brl(m.valor)}
                    </span>
                    <Button variant="ghost" size="icon-sm" aria-label="Apagar lançamento" onClick={() => apagar(m)}>
                      <X className="text-muted-foreground" />
                    </Button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </CardContent>
      </Card>
      </div>
      </div>

      <Dialog open={compraAberta} onOpenChange={setCompraAberta}>
        <DialogContent>
          <div>
            <DialogTitle>Registrar compra</DialogTitle>
            <DialogDescription>Quantas latas entraram e quanto você pagou no total.</DialogDescription>
          </div>
          <form onSubmit={salvarCompra} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="c-qtd">Latas</Label>
                <Input id="c-qtd" type="number" inputMode="numeric" min="1" value={compra.qtd} onChange={(e) => setCompra({ ...compra, qtd: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-total">Total pago (R$)</Label>
                <Input id="c-total" type="number" inputMode="decimal" min="0" step="0.01" value={compra.total} onChange={(e) => setCompra({ ...compra, total: e.target.value })} required />
              </div>
            </div>
            <Button size="lg" disabled={salvando}>
              {salvando && <Loader2 className="animate-spin" />} Salvar compra
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function App() {
  const [sessao, setSessao] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (sessao === undefined) return null
  return sessao ? <Painel sessao={sessao} /> : <Login />
}
