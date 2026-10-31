import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import {
  Boxes, CreditCard, Percent, PiggyBank, QrCode, ShoppingBag, TriangleAlert, LogOut, Minus, Plus, PackagePlus, ShoppingCart, TrendingDown, TrendingUp, Wallet, X, Loader2, Inbox,
} from 'lucide-react'
import { avisarEstoque, supabase } from '@/supabase.js'
import { brl, cn, quando } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { AutoHeight } from '@/components/AutoHeight'
import { ProdutoLinha } from '@/components/ProdutoLinha'
import { TaxasDialog } from '@/components/TaxasDialog'
import { GraficoCard } from '@/components/SaldoChart'
import { Login } from '@/components/Login'
import { mostrarApagado, mostrarPago } from '@/components/PagoToast'

// produtos que entram na primeira vez que a conta abre o site (depois ficam no banco)
const PRODUTOS_INICIAIS = [
  { nome: 'Coca-Cola', preco_venda: 6, preco_compra: null },
  { nome: 'Monster', preco_venda: 12, preco_compra: 10 },
]

function lerPreco(info) {
  if (!info) return ''
  try {
    const salvo = localStorage.getItem('preco:' + info.nome)
    if (salvo) return Number(salvo)
  } catch { /* sem armazenamento */ }
  return info.preco_venda ?? ''
}

const FORMAS = [
  { id: 'pix', nome: 'Pix', Icone: QrCode },
  { id: 'debito', nome: 'Débito', Icone: CreditCard },
  { id: 'credito', nome: 'Crédito', Icone: CreditCard },
]
const nomeForma = (id) => FORMAS.find((f) => f.id === id)?.nome

// valores que você me passou: Pix grátis, débito R$ 0,04 e crédito R$ 0,19 (dá para trocar para % em "Taxas")
const TAXAS_PADRAO = {
  pix: { tipo: 'fixo', valor: 0 },
  debito: { tipo: 'fixo', valor: 0.04 },
  credito: { tipo: 'fixo', valor: 0.19 },
}

function lerForma() {
  try {
    const salva = localStorage.getItem('forma')
    return FORMAS.some((f) => f.id === salva) ? salva : 'pix'
  } catch { return 'pix' }
}

const GERAL = '__geral__'
const ESTOQUE_BAIXO = 2

function lerProduto() {
  try { return localStorage.getItem('produto') || '' } catch { return '' }
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

function Stat({ icon: Icon, rotulo, valor, tom, formato = brl, sub }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{rotulo}</span>
          <Icon className={cn('size-4', tom)} />
        </div>
        <strong className={cn('text-lg font-bold tabular-nums tracking-tight sm:text-xl', tom)}>
          <AnimatedNumber value={valor} format={formato} />
        </strong>
        {sub && <span className="-mt-1 text-xs text-muted-foreground">{sub}</span>}
      </CardContent>
    </Card>
  )
}

function Painel({ sessao }) {
  const [todas, setTodas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [produtos, setProdutos] = useState([])
  const [produto, setProduto] = useState(lerProduto)
  const [preco, setPreco] = useState('')
  const [novoAberto, setNovoAberto] = useState(false)
  const [abaProdutos, setAbaProdutos] = useState('novo')
  const [novo, setNovo] = useState({ nome: '', compra: '', venda: '' })
  const [qtd, setQtd] = useState(1)
  const [forma, setForma] = useState(lerForma)
  const [taxas, setTaxas] = useState(TAXAS_PADRAO)
  const [taxasAberto, setTaxasAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [compraAberta, setCompraAberta] = useState(false)
  const [compra, setCompra] = useState({ qtd: '6', total: '' })

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('estoque_mov').select('*').order('criado_em', { ascending: false })
    if (error) toast.error('Não consegui carregar os dados.')
    else setTodas(data)
    setCarregando(false)
  }, [])

  const carregarProdutos = useCallback(async () => {
    const ler = () => supabase.from('estoque_produto').select('*').order('criado_em', { ascending: true })
    let { data, error } = await ler()
    if (!error && data.length === 0) {
      await supabase.from('estoque_produto').insert(PRODUTOS_INICIAIS)
      ;({ data, error } = await ler())
    }
    if (error) { toast.error('Não consegui carregar os produtos.'); return }
    setProdutos(data)
    setProduto((atual) => {
      const ativos = data.filter((p) => p.ativo)
      return atual === GERAL || ativos.some((p) => p.nome === atual) ? atual : ativos[0]?.nome || ''
    })
  }, [])

  const carregarTaxas = useCallback(async () => {
    const { data, error } = await supabase.from('estoque_taxa').select('*')
    if (error) return
    const t = { ...TAXAS_PADRAO }
    for (const x of data) t[x.forma] = { tipo: x.tipo, valor: Number(x.valor) }
    setTaxas(t)
  }, [])

  useEffect(() => { carregar(); carregarProdutos(); carregarTaxas() }, [carregar, carregarProdutos, carregarTaxas])

  const taxaDe = (f, total) => {
    const t = taxas[f] || TAXAS_PADRAO.pix
    return Math.round((t.tipo === 'fixo' ? t.valor : (total * t.valor) / 100) * 100) / 100
  }

  async function salvarTaxas(novo) {
    const linhas = Object.entries(novo).map(([f, t]) => ({ forma: f, tipo: t.tipo, valor: t.valor }))
    const { error } = await supabase.from('estoque_taxa').upsert(linhas, { onConflict: 'user_id,forma' })
    if (error) { toast.error('Não consegui salvar as taxas.'); return false }
    setTaxas(novo)
    toast.success('Taxas salvas')
    return true
  }

  const ativos = useMemo(() => produtos.filter((p) => p.ativo), [produtos])
  const info = produtos.find((p) => p.nome === produto)
  const geral = produto === GERAL
  const { estoques, comprados } = useMemo(() => {
    const e = {}
    const c = {}
    for (const m of todas) {
      e[m.produto] = (e[m.produto] || 0) + (m.tipo === 'compra' ? m.qtd : -m.qtd)
      if (m.tipo === 'compra') c[m.produto] = (c[m.produto] || 0) + m.qtd
    }
    return { estoques: e, comprados: c }
  }, [todas])
  const baixo = (nome) => (comprados[nome] || 0) > 0 && (estoques[nome] || 0) <= ESTOQUE_BAIXO
  const porProduto = useMemo(() => {
    const por = {}
    for (const m of todas) {
      const d = (por[m.produto] ||= { nome: m.produto, comprado: 0, estoque: 0, vendido: 0, custo: 0, receita: 0, taxas: 0 })
      if (m.tipo === 'compra') { d.comprado += m.qtd; d.estoque += m.qtd; d.custo += Number(m.valor) }
      else { d.estoque -= m.qtd; d.vendido += m.qtd; d.receita += Number(m.valor); d.taxas += Number(m.taxa || 0) }
    }
    return Object.values(por).map((d) => {
      const custoUn = d.comprado ? d.custo / d.comprado : 0
      return {
        ...d,
        custoUn,
        precoMedio: d.vendido ? d.receita / d.vendido : 0,
        lucro: d.receita - d.taxas - d.vendido * custoUn,
        parado: Math.max(d.estoque, 0) * custoUn,
      }
    })
  }, [todas])
  const porForma = useMemo(() => {
    const por = {}
    for (const m of todas) {
      if (m.tipo !== 'venda') continue
      const k = m.forma || 'sem'
      const d = (por[k] ||= { id: k, vendas: 0, latas: 0, valor: 0, taxas: 0 })
      d.vendas += 1
      d.latas += m.qtd
      d.valor += Number(m.valor)
      d.taxas += Number(m.taxa || 0)
    }
    return [...FORMAS.map((f) => f.id), 'sem'].filter((k) => por[k]).map((k) => por[k])
  }, [todas])
  const ger = useMemo(() => ({
    lucro: porProduto.reduce((t, d) => t + d.lucro, 0),
    parado: porProduto.reduce((t, d) => t + d.parado, 0),
  }), [porProduto])
  useEffect(() => { setPreco(lerPreco(info)) }, [info])

  const movs = useMemo(() => (geral ? todas : todas.filter((m) => m.produto === produto)), [todas, produto, geral])

  const r = useMemo(() => {
    const soma = (tipo, campo) =>
      movs.filter((m) => m.tipo === tipo).reduce((s, m) => s + Number(m[campo]), 0)
    const comprado = soma('compra', 'qtd')
    const vendido = soma('venda', 'qtd')
    const custo = soma('compra', 'valor')
    const receita = soma('venda', 'valor')
    const taxasPagas = soma('venda', 'taxa')
    return {
      estoque: comprado - vendido, comprado, vendido, custo, receita,
      taxas: taxasPagas, liquido: receita - taxasPagas, saldo: receita - taxasPagas - custo,
    }
  }, [movs])

  const pct = r.comprado ? (r.vendido / r.comprado) * 100 : 0
  const qtdOk = Math.min(qtd, Math.max(r.estoque, 1))
  const total = qtdOk * Number(preco || 0)
  const visiveis = movs.filter((m) => filtro === 'todos' || m.tipo === filtro)

  async function registrar(tipo, n, valor, extra = {}) {
    setSalvando(true)
    const { error } = await supabase.from('estoque_mov').insert({ produto, tipo, qtd: n, valor, ...extra })
    setSalvando(false)
    if (error) { toast.error('Não consegui salvar. Tente de novo.'); return false }
    await carregar()
    return true
  }

  async function vender() {
    const antes = r.estoque
    const depois = antes - qtdOk
    if (await registrar('venda', qtdOk, total, { forma, taxa: taxaDe(forma, total) })) {
      // avisa uma vez: quando passa a ficar baixo ou quando acaba
      if ((depois <= ESTOQUE_BAIXO && antes > ESTOQUE_BAIXO) || depois === 0) avisarEstoque(produto, depois)
      mostrarPago('Venda registrada', `${produto} · ${qtdOk} ${qtdOk === 1 ? 'lata' : 'latas'} · ${brl(total)} · ${nomeForma(forma)}`)
      setQtd(1)
    }
  }

  async function salvarCompra(e) {
    e.preventDefault()
    const n = parseInt(compra.qtd, 10)
    const valor = parseFloat(String(compra.total).replace(',', '.'))
    if (!(n > 0) || !(valor >= 0)) return
    if (await registrar('compra', n, valor)) {
      toast.success(`Compra registrada: ${produto}, +${n} latas`)
      setCompraAberta(false)
    }
  }

  async function apagar(m) {
    const { error } = await supabase.from('estoque_mov').delete().eq('id', m.id)
    if (error) { toast.error('Não consegui apagar.'); return }
    await carregar()
    mostrarApagado(
      m.tipo === 'venda' ? 'Venda desfeita' : 'Compra desfeita',
      `${m.produto} · ${m.qtd} ${m.qtd === 1 ? 'lata' : 'latas'} · ${brl(m.valor)}`,
      {
        label: 'Restaurar',
        onClick: async () => {
          const { id, user_id, criado_em, produto, tipo, qtd: q, valor, forma, taxa } = m
          await supabase.from('estoque_mov').insert({ id, user_id, criado_em, produto, tipo, qtd: q, valor, forma, taxa })
          carregar()
        },
      }
    )
  }

  function abrirCompra() {
    const un = info?.preco_compra
    setCompra({ qtd: '6', total: un ? String(Math.round(6 * un * 100) / 100) : '' })
    setCompraAberta(true)
  }

  async function salvarProduto(e) {
    e.preventDefault()
    const nome = novo.nome.trim()
    if (!nome) return
    const num = (v) => (String(v).trim() === '' ? null : parseFloat(String(v).replace(',', '.')))
    const { error } = await supabase.from('estoque_produto').insert({ nome, preco_compra: num(novo.compra), preco_venda: num(novo.venda) })
    if (error) {
      toast.error(error.code === '23505' ? 'Esse produto já existe. Se estiver arquivado, reative em Gerenciar.' : 'Não consegui adicionar o produto.')
      return
    }
    await carregarProdutos()
    trocarProduto(nome)
    setNovo({ nome: '', compra: '', venda: '' })
    setNovoAberto(false)
    toast.success(`${nome} adicionado`)
  }

  async function alternarAtivo(p) {
    const { error } = await supabase.from('estoque_produto').update({ ativo: !p.ativo }).eq('id', p.id)
    if (error) { toast.error('Não consegui atualizar o produto.'); return }
    await carregarProdutos()
    toast.success(p.ativo ? `${p.nome} arquivado. O histórico foi mantido.` : `${p.nome} reativado`)
  }

  async function salvarEdicao(p, f) {
    const nome = f.nome.trim()
    if (!nome) return false
    const num = (v) => (String(v).trim() === '' ? null : parseFloat(String(v).replace(',', '.')))
    const { error } = await supabase.from('estoque_produto').update({ preco_compra: num(f.compra), preco_venda: num(f.venda) }).eq('id', p.id)
    if (error) { toast.error('Não consegui salvar os valores.'); return false }
    if (nome !== p.nome) {
      const { error: e2 } = await supabase.rpc('estoque_renomear', { antigo: p.nome, novo: nome })
      if (e2) { toast.error(e2.code === '23505' ? 'Já existe um produto com esse nome.' : 'Não consegui trocar o nome.'); return false }
    }
    try {
      // o preço de venda editado vale de novo (tira o valor lembrado no aparelho)
      localStorage.removeItem('preco:' + p.nome)
      localStorage.removeItem('preco:' + nome)
    } catch { /* sem armazenamento */ }
    if (produto === p.nome && nome !== p.nome) trocarProduto(nome)
    await Promise.all([carregarProdutos(), carregar()])
    setPreco(lerPreco({ ...p, nome, preco_venda: num(f.venda) }))
    toast.success(`${nome} atualizado`)
    return true
  }

  async function apagarProduto(p) {
    const { error } = await supabase.rpc('estoque_apagar_produto', { alvo: p.nome })
    if (error) { toast.error('Não consegui apagar o produto.'); return }
    try { localStorage.removeItem('preco:' + p.nome) } catch { /* sem armazenamento */ }
    await Promise.all([carregarProdutos(), carregar()])
    toast.success(`${p.nome} apagado`)
  }

  function mudarPreco(v) {
    setPreco(v)
    try { localStorage.setItem('preco:' + produto, String(v)) } catch { /* sem armazenamento */ }
  }

  function trocarForma(f) {
    setForma(f)
    try { localStorage.setItem('forma', f) } catch { /* sem armazenamento */ }
  }

  function trocarProduto(nome) {
    setProduto(nome)
    setQtd(1)
    setFiltro('todos')
    try { localStorage.setItem('produto', nome) } catch { /* sem armazenamento */ }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pb-16 pt-5 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="./box.png" alt="" className="size-11 drop-shadow-md" />
          <div className="leading-tight">
            <h1 className="text-lg font-extrabold tracking-tight">Estoque</h1>
            <p className="text-xs text-muted-foreground">{geral ? 'Todos os produtos' : produto}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Taxas de pagamento" onClick={() => setTaxasAberto(true)}>
                <Percent />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Taxas de pagamento</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} title={sessao.user.email}>
            <LogOut /> Sair
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <Tabs value={produto} onValueChange={trocarProduto} className="min-w-0">
          <TabsList className="h-11 max-w-full overflow-x-auto">
            <TabsTrigger value={GERAL} className="h-9 px-5 text-sm">Geral</TabsTrigger>
            {ativos.map((p) => (
              <TabsTrigger key={p.id} value={p.nome} className="h-9 px-5 text-sm">
                {p.nome}
                {baixo(p.nome) && <span className="ml-2 size-1.5 rounded-full bg-destructive" title="Estoque baixo" />}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0" aria-label="Adicionar ou gerenciar produtos" onClick={() => setNovoAberto(true)}>
              <PackagePlus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Adicionar ou gerenciar produtos</TooltipContent>
        </Tooltip>
      </div>

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
          {!geral && r.comprado > 0 && r.estoque <= ESTOQUE_BAIXO && (
            <Badge variant="danger">
              <TriangleAlert className="size-3.5" />
              {r.estoque <= 0 ? 'Acabou! Hora de comprar mais' : `Estoque baixo: só ${r.estoque} ${r.estoque === 1 ? 'lata' : 'latas'}`}
            </Badge>
          )}
        </CardContent>
      </Card>

      {geral ? (
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={TrendingUp} rotulo="Recebi" valor={r.liquido} tom="text-success" sub={r.taxas > 0 ? `taxas ${brl(r.taxas)}` : undefined} />
          <Stat icon={TrendingDown} rotulo="Gastei" valor={r.custo} />
          <Stat icon={Wallet} rotulo="Saldo" valor={r.saldo} tom={r.saldo >= 0 ? 'text-success' : 'text-destructive'} />
          <Stat icon={PiggyBank} rotulo="Lucro das vendas" valor={ger.lucro} tom={ger.lucro >= 0 ? 'text-success' : 'text-destructive'} />
          <Stat icon={ShoppingBag} rotulo="Latas vendidas" valor={r.vendido} formato={(v) => String(Math.round(v))} />
          <Stat icon={Boxes} rotulo="Parado no estoque" valor={ger.parado} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={TrendingDown} rotulo="Gastei" valor={r.custo} />
          <Stat icon={TrendingUp} rotulo="Recebi" valor={r.liquido} tom="text-success" sub={r.taxas > 0 ? `taxas ${brl(r.taxas)}` : undefined} />
          <Stat icon={Wallet} rotulo="Saldo" valor={r.saldo} tom={r.saldo >= 0 ? 'text-success' : 'text-destructive'} />
        </div>
      )}

      {!geral && (
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
          <div className="grid gap-2">
            <Label>Pagamento</Label>
            <Tabs value={forma} onValueChange={trocarForma}>
              <TabsList className="h-11 w-full">
                {FORMAS.map(({ id, nome, Icone }) => (
                  <TabsTrigger key={id} value={id} className="h-9 flex-1 gap-1.5 text-sm">
                    <Icone className="size-4" /> {nome}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <Button size="lg" onClick={vender} disabled={r.estoque < 1 || salvando}>
            {salvando ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
            Vender · {brl(total)}
          </Button>
          {r.estoque < 1 && !carregando && <p className="text-center text-sm text-muted-foreground">Sem estoque. Registre uma compra.</p>}
          <Button variant="secondary" onClick={abrirCompra}>
            <PackagePlus /> Registrar compra
          </Button>
        </CardContent>
      </Card>
      )}
      </div>
      <div className="flex flex-col gap-5 lg:col-span-7">
      <GraficoCard movs={movs} geral={geral} />

      {geral && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por produto</CardTitle>
            <CardDescription>Toque numa aba acima para vender ou comprar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {porProduto.map((d) => (
                <li key={d.nome} className="grid gap-2 py-3.5">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-sm font-semibold">{d.nome}</p>
                    {baixo(d.nome) && <Badge variant="danger">Baixo</Badge>}
                    <span className={cn('text-sm font-bold tabular-nums', d.lucro >= 0 ? 'text-success' : 'text-destructive')}>
                      {brl(d.lucro)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${d.comprado ? (d.vendido / d.comprado) * 100 : 0}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.vendido} de {d.comprado} vendidas · {d.estoque} em estoque
                    {d.vendido > 0 && ` · custo ${brl(d.custoUn)} → venda ${brl(d.precoMedio)}`}
                  </p>
                </li>
              ))}
              {porProduto.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nada registrado ainda.</li>}
            </ul>
          </CardContent>
        </Card>
      )}

      {geral && porForma.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formas de pagamento</CardTitle>
            <CardDescription>Quanto entrou em cada uma.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {porForma.map((d) => {
                const f = FORMAS.find((x) => x.id === d.id)
                const Icone = f ? f.Icone : Inbox
                return (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Icone className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{f ? f.nome : 'Sem registro'}</p>
                      <p className="text-xs text-muted-foreground">{d.vendas} {d.vendas === 1 ? 'venda' : 'vendas'} · {d.latas} {d.latas === 1 ? 'lata' : 'latas'}</p>
                    </div>
                    <span className="text-right text-sm font-bold tabular-nums">
                      {brl(d.valor)}
                      {d.taxas > 0 && <span className="block text-xs font-normal text-muted-foreground">taxas {brl(d.taxas)}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

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
          <AutoHeight>
          {carregando ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : visiveis.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Inbox className="size-8" />
              <p className="text-sm">Nada por aqui ainda.</p>
            </div>
          ) : (
            <ul className="divide-y">
                {visiveis.map((m) => (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className={cn('grid size-9 shrink-0 place-items-center rounded-full', m.tipo === 'venda' ? 'bg-success/15 text-success' : 'bg-accent text-accent-foreground')}>
                      {m.tipo === 'venda' ? <TrendingUp className="size-4" /> : <PackagePlus className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {m.tipo === 'venda' ? 'Venda' : 'Compra'}{geral && ` · ${m.produto}`} · {m.qtd} {m.qtd === 1 ? 'lata' : 'latas'}
                      </p>
                      <p className="text-xs text-muted-foreground">{quando(m.criado_em)}{m.forma && ` · ${nomeForma(m.forma)}`}{Number(m.taxa) > 0 && ` · taxa ${brl(m.taxa)}`}</p>
                    </div>
                    <span className={cn('text-sm font-bold tabular-nums', m.tipo === 'venda' ? 'text-success' : 'text-foreground')}>
                      {m.tipo === 'venda' ? '+' : '−'}{brl(m.valor)}
                    </span>
                    <Button variant="ghost" size="icon-sm" aria-label="Apagar lançamento" onClick={() => apagar(m)}>
                      <X className="text-muted-foreground" />
                    </Button>
                  </motion.li>
                ))}
            </ul>
          )}
          </AutoHeight>
        </CardContent>
      </Card>
      </div>
      </div>

      <TaxasDialog open={taxasAberto} onOpenChange={setTaxasAberto} formas={FORMAS} taxas={taxas} onSalvar={salvarTaxas} />

      <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
        <DialogContent>
          <div className="grid gap-3">
            <DialogTitle>Produtos</DialogTitle>
            <Tabs value={abaProdutos} onValueChange={setAbaProdutos}>
              <TabsList>
                <TabsTrigger value="novo">Adicionar</TabsTrigger>
                <TabsTrigger value="gerenciar">Gerenciar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={abaProdutos} className="grid gap-4"
            initial={{ opacity: 0, x: abaProdutos === 'novo' ? -14 : 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
          {abaProdutos === 'novo' ? (
            <>
              <DialogDescription>Só o nome é obrigatório. Os valores são por unidade.</DialogDescription>
              <form onSubmit={salvarProduto} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="n-nome">Nome do produto</Label>
                  <Input id="n-nome" maxLength={40} placeholder="Ex.: Guaraná" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} required autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="n-compra">Valor de compra (R$)</Label>
                    <Input id="n-compra" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Opcional" value={novo.compra} onChange={(e) => setNovo({ ...novo, compra: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="n-venda">Valor de venda (R$)</Label>
                    <Input id="n-venda" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Opcional" value={novo.venda} onChange={(e) => setNovo({ ...novo, venda: e.target.value })} />
                  </div>
                </div>
                <Button size="lg">Adicionar produto</Button>
              </form>
            </>
          ) : (
            <>
              <DialogDescription>Arquivar tira o produto das abas, mas mantém o histórico. Dá para reativar depois.</DialogDescription>
              <ul className="divide-y overflow-hidden rounded-lg border">
                {produtos.map((p) => (
                  <ProdutoLinha
                    key={p.id} p={p}
                    estoque={estoques[p.nome] || 0}
                    lancamentos={todas.filter((m) => m.produto === p.nome).length}
                    ultimoAtivo={ativos.length <= 1}
                    unico={produtos.length <= 1}
                    onSalvar={salvarEdicao}
                    onAlternar={alternarAtivo}
                    onApagar={apagarProduto}
                  />
                ))}
              </ul>
            </>
          )}
          </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>

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
