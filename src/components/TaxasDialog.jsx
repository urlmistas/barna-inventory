import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const paraTexto = (v) => String(v ?? 0).replace('.', ',')
const paraNumero = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// por forma de pagamento: a taxa que a máquina cobra (R$ ou %) e o acréscimo que você soma no preço
export function TaxasDialog({ open, onOpenChange, formas, taxas, onSalvar }) {
  const [form, setForm] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!open) return
    const f = {}
    for (const { id } of formas) {
      f[id] = { tipo: taxas[id].tipo, valor: paraTexto(taxas[id].valor), acrescimo: paraTexto(taxas[id].acrescimo) }
    }
    setForm(f)
  }, [open, formas, taxas])

  const mudar = (id, campo, v) => setForm((f) => ({ ...f, [id]: { ...f[id], [campo]: v } }))

  async function enviar(e) {
    e.preventDefault()
    const novo = {}
    for (const { id } of formas) {
      novo[id] = { tipo: form[id].tipo, valor: paraNumero(form[id].valor), acrescimo: paraNumero(form[id].acrescimo) }
    }
    setSalvando(true)
    const ok = await onSalvar(novo)
    setSalvando(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div>
          <DialogTitle>Pagamento: taxas e acréscimo</DialogTitle>
          <DialogDescription>
            Taxa: descontada do que você recebe. Acréscimo: somado ao preço da lata. Vale para as vendas novas.
          </DialogDescription>
        </div>
        <form onSubmit={enviar} className="grid gap-3">
          {formas.map(({ id, nome, Icone }) =>
            form[id] ? (
              <div key={id} className="grid gap-3 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icone className="size-4 text-muted-foreground" /> {nome}
                  </span>
                  <Tabs value={form[id].tipo} onValueChange={(v) => mudar(id, 'tipo', v)}>
                    <TabsList>
                      <TabsTrigger value="fixo" className="px-3">R$</TabsTrigger>
                      <TabsTrigger value="percentual" className="px-3">%</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`t-${id}`} className="text-xs text-muted-foreground">Taxa ({form[id].tipo === 'fixo' ? 'R$' : '%'})</Label>
                    <Input id={`t-${id}`} type="text" inputMode="decimal" value={form[id].valor} onChange={(e) => mudar(id, 'valor', e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`a-${id}`} className="text-xs text-muted-foreground">Acréscimo (R$/lata)</Label>
                    <Input id={`a-${id}`} type="text" inputMode="decimal" value={form[id].acrescimo} onChange={(e) => mudar(id, 'acrescimo', e.target.value)} />
                  </div>
                </div>
              </div>
            ) : null
          )}
          <Button size="lg" disabled={salvando}>
            {salvando && <Loader2 className="animate-spin" />} Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
