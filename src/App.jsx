import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'

const brl = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const quando = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })

function lerPreco() {
  try { return Number(localStorage.getItem('preco')) || 6 } catch { return 6 }
}

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setCarregando(false)
  }

  return (
    <main className="login">
      <form className="card login-card" onSubmit={entrar}>
        <div className="logo" aria-hidden="true" />
        <h1>Estoque</h1>
        <p className="muted">Entre para ver suas vendas.</p>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button className="btn primary" disabled={carregando}>{carregando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  )
}

function Painel({ sessao }) {
  const [movs, setMovs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [preco, setPreco] = useState(lerPreco)
  const [compra, setCompra] = useState({ qtd: '6', total: '22' })
  const [mostraCompra, setMostraCompra] = useState(false)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('estoque_mov')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) setErro('Não consegui carregar os dados.')
    else { setMovs(data); setErro('') }
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

  async function registrar(tipo, qtd, valor) {
    const { error } = await supabase.from('estoque_mov').insert({ tipo, qtd, valor })
    if (error) { setErro('Não consegui salvar. Tente de novo.'); return }
    await carregar()
  }

  async function apagar(id) {
    const { error } = await supabase.from('estoque_mov').delete().eq('id', id)
    if (error) setErro('Não consegui apagar.')
    else await carregar()
  }

  function mudarPreco(v) {
    setPreco(v)
    try { localStorage.setItem('preco', String(v)) } catch { /* sem armazenamento */ }
  }

  async function salvarCompra(e) {
    e.preventDefault()
    const qtd = parseInt(compra.qtd, 10)
    const total = parseFloat(String(compra.total).replace(',', '.'))
    if (!(qtd > 0) || !(total >= 0)) return
    await registrar('compra', qtd, total)
    setMostraCompra(false)
  }

  const progresso = r.comprado ? (r.vendido / r.comprado) * 100 : 0
  const podeVender = r.estoque > 0 && Number(preco) >= 0

  return (
    <main className="app">
      <header className="topo">
        <div>
          <h1>Estoque</h1>
          <p className="muted">Coca-Cola</p>
        </div>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()} title={sessao.user.email}>Sair</button>
      </header>

      <section className="card hero">
        <span className="rotulo">Em estoque</span>
        <strong className="grande">{r.estoque}</strong>
        <span className="muted">{r.estoque === 1 ? 'lata' : 'latas'}</span>
        <div className="barra" role="progressbar" aria-valuenow={Math.round(progresso)} aria-valuemin="0" aria-valuemax="100">
          <i style={{ width: `${progresso}%` }} />
        </div>
        <span className="muted">{r.vendido} vendidas de {r.comprado}</span>
      </section>

      <section className="grade">
        <div className="card mini"><span className="rotulo">Gastei</span><strong>{brl(r.custo)}</strong></div>
        <div className="card mini"><span className="rotulo">Recebi</span><strong>{brl(r.receita)}</strong></div>
        <div className={`card mini ${r.saldo >= 0 ? 'pos' : 'neg'}`}>
          <span className="rotulo">Saldo</span><strong>{brl(r.saldo)}</strong>
        </div>
      </section>

      <section className="card acoes">
        <div className="linha-preco">
          <label>
            Preço por lata
            <input
              type="number" inputMode="decimal" min="0" step="0.5"
              value={preco} onChange={(e) => mudarPreco(e.target.value)}
            />
          </label>
          <button className="btn primary vender" disabled={!podeVender} onClick={() => registrar('venda', 1, Number(preco))}>
            Vendi 1 · {brl(preco)}
          </button>
        </div>
        {r.estoque === 0 && <p className="muted">Sem estoque. Registre uma compra.</p>}
        <button className="btn" onClick={() => setMostraCompra((v) => !v)}>
          {mostraCompra ? 'Cancelar' : 'Registrar compra'}
        </button>
        {mostraCompra && (
          <form className="compra" onSubmit={salvarCompra}>
            <label>Latas
              <input type="number" inputMode="numeric" min="1" value={compra.qtd} onChange={(e) => setCompra({ ...compra, qtd: e.target.value })} required />
            </label>
            <label>Total pago (R$)
              <input type="number" inputMode="decimal" min="0" step="0.01" value={compra.total} onChange={(e) => setCompra({ ...compra, total: e.target.value })} required />
            </label>
            <button className="btn primary">Salvar compra</button>
          </form>
        )}
      </section>

      {erro && <p className="erro">{erro}</p>}

      <section className="card">
        <h2>Histórico</h2>
        {carregando ? <p className="muted">Carregando…</p> : movs.length === 0 ? (
          <p className="muted">Nada registrado ainda.</p>
        ) : (
          <ul className="lista">
            {movs.map((m) => (
              <li key={m.id}>
                <span className={`pilula ${m.tipo}`}>{m.tipo === 'compra' ? 'Compra' : 'Venda'}</span>
                <div className="info">
                  <b>{m.tipo === 'compra' ? '+' : '−'}{m.qtd} {m.qtd === 1 ? 'lata' : 'latas'}</b>
                  <small className="muted">{quando(m.criado_em)}</small>
                </div>
                <span className="valor">{brl(m.valor)}</span>
                <button className="x" aria-label="Apagar lançamento" onClick={() => apagar(m.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
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
