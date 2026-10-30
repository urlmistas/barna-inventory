import { useState } from 'react'
import { Archive, ArchiveRestore, Check, Pencil, Trash2, X } from 'lucide-react'
import { brl, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function Acao({ texto, children, ...p }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={texto} {...p}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>{texto}</TooltipContent>
    </Tooltip>
  )
}

const numero = (v) => (v == null ? '' : String(v))

// uma linha da aba "Gerenciar": ver, editar ou confirmar a exclusão
export function ProdutoLinha({ p, estoque, lancamentos, ultimoAtivo, unico, onSalvar, onAlternar, onApagar }) {
  const [modo, setModo] = useState('ver')
  const [f, setF] = useState({ nome: p.nome, compra: numero(p.preco_compra), venda: numero(p.preco_venda) })
  const [ocupado, setOcupado] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setOcupado(true)
    const ok = await onSalvar(p, f)
    setOcupado(false)
    if (ok) setModo('ver')
  }

  async function apagar() {
    setOcupado(true)
    await onApagar(p)
    setOcupado(false)
  }

  if (modo === 'editar') {
    return (
      <li className="px-3 py-3">
        <form onSubmit={salvar} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={`e-nome-${p.id}`}>Nome</Label>
            <Input id={`e-nome-${p.id}`} maxLength={40} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`e-compra-${p.id}`}>Compra (R$)</Label>
              <Input id={`e-compra-${p.id}`} type="number" inputMode="decimal" min="0" step="0.01" placeholder="Opcional" value={f.compra} onChange={(e) => setF({ ...f, compra: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`e-venda-${p.id}`}>Venda (R$)</Label>
              <Input id={`e-venda-${p.id}`} type="number" inputMode="decimal" min="0" step="0.01" placeholder="Opcional" value={f.venda} onChange={(e) => setF({ ...f, venda: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModo('ver')}><X /> Cancelar</Button>
            <Button size="sm" disabled={ocupado}><Check /> Salvar</Button>
          </div>
        </form>
      </li>
    )
  }

  if (modo === 'apagar') {
    return (
      <li className="grid gap-3 bg-destructive/8 px-3 py-3">
        <p className="text-sm">
          Apagar <b>{p.nome}</b>{lancamentos > 0 ? <> e os <b>{lancamentos}</b> {lancamentos === 1 ? 'lançamento' : 'lançamentos'} dele</> : null}? Não dá para desfazer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setModo('ver')}>Cancelar</Button>
          <Button variant="destructive" size="sm" disabled={ocupado} onClick={apagar}><Trash2 /> Apagar de vez</Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', !p.ativo && 'text-muted-foreground line-through')}>{p.nome}</p>
        <p className="text-xs text-muted-foreground">
          {estoque} {estoque === 1 ? 'lata' : 'latas'} em estoque
          {p.preco_venda != null && ` · venda ${brl(p.preco_venda)}`}
        </p>
      </div>
      <Acao texto="Editar" onClick={() => setModo('editar')}><Pencil /></Acao>
      <Acao
        texto={p.ativo ? (ultimoAtivo ? 'Precisa sobrar um produto ativo' : 'Arquivar') : 'Reativar'}
        disabled={p.ativo && ultimoAtivo}
        onClick={() => onAlternar(p)}
      >
        {p.ativo ? <Archive /> : <ArchiveRestore />}
      </Acao>
      <Acao texto={unico ? 'Precisa sobrar um produto' : 'Apagar'} disabled={unico} onClick={() => setModo('apagar')}>
        <Trash2 className="text-destructive" />
      </Acao>
    </li>
  )
}
