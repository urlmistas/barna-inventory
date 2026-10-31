import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const paraTexto = (v) => String(v ?? 0).replace('.', ',')

// taxa de cada forma de pagamento: valor fixo em R$ ou percentual sobre a venda
export function TaxasDialog({ open, onOpenChange, formas, taxas, onSalvar }) {
  const [form, setForm] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!open) return
    const f = {}
    for (const { id } of formas) f[id] = { tipo: taxas[id].tipo, valor: paraTexto(taxas[id].valor) }
    setForm(f)
  }, [open, formas, taxas])

  const mudar = (id, campo, v) => setForm((f) => ({ ...f, [id]: { ...f[id], [campo]: v } }))

  async function enviar(e) {
    e.preventDefault()
    const novo = {}
    for (const { id } of formas) {
      const n = parseFloat(String(form[id].valor).replace(',', '.'))
      novo[id] = { tipo: form[id].tipo, valor: Number.isFinite(n) && n >= 0 ? n : 0 }
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
          <DialogTitle>Taxas de pagamento</DialogTitle>
          <DialogDescription>
            Descontadas do que você recebe em cada venda. Vale para as vendas novas: as antigas guardam a taxa que tinham.
          </DialogDescription>
        </div>
        <form onSubmit={enviar} className="grid gap-4">
          {formas.map(({ id, nome, Icone }) =>
            form[id] ? (
              <div key={id} className="flex items-center gap-3">
                <div className="flex w-24 shrink-0 items-center gap-2 text-sm font-semibold">
                  <Icone className="size-4 text-muted-foreground" /> {nome}
                </div>
                <Input
                  type="text" inputMode="decimal" aria-label={`Taxa do ${nome}`}
                  value={form[id].valor} onChange={(e) => mudar(id, 'valor', e.target.value)}
                />
                <Tabs value={form[id].tipo} onValueChange={(v) => mudar(id, 'tipo', v)}>
                  <TabsList>
                    <TabsTrigger value="fixo" className="px-3">R$</TabsTrigger>
                    <TabsTrigger value="percentual" className="px-3">%</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            ) : null
          )}
          <Button size="lg" disabled={salvando}>
            {salvando && <Loader2 className="animate-spin" />} Salvar taxas
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
