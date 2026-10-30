import { createClient } from '@supabase/supabase-js'

// chave publicável: pode ficar no código (a proteção é o login + RLS na tabela)
export const supabase = createClient(
  'https://epsddfqunjqopylrbbyv.supabase.co',
  'sb_publishable_W04BorQgNFQ2TMGxnaRYow_EwuzV5Ni'
)

// bot do BarnaBank (Cloudflare Worker): manda o aviso de estoque baixo no Telegram da conta
const BOT_URL = 'https://barnabank-bot.barnabank.workers.dev'

export async function avisarEstoque(produto, estoque) {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session && data.session.access_token
    if (!token) return
    await fetch(BOT_URL + '/api/estoque-alerta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ produto, estoque }),
    })
  } catch { /* o aviso é um extra: se falhar, a venda já foi salva */ }
}
