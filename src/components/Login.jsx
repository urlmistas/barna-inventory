import { useState } from 'react'
import { motion } from 'motion/react'
import { GlassWater, Loader2 } from 'lucide-react'
import { supabase } from '@/supabase.js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Login() {
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
    <main className="grid min-h-dvh place-items-center p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
        <Card className="p-7">
          <form onSubmit={entrar} className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <GlassWater className="size-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Estoque</h1>
                <p className="text-sm text-muted-foreground">Entre para controlar suas vendas.</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
            <Button size="lg" disabled={carregando}>
              {carregando && <Loader2 className="animate-spin" />}
              Entrar
            </Button>
          </form>
        </Card>
      </motion.div>
    </main>
  )
}
