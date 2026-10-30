import { createClient } from '@supabase/supabase-js'

// chave publicável: pode ficar no código (a proteção é o login + RLS na tabela)
export const supabase = createClient(
  'https://epsddfqunjqopylrbbyv.supabase.co',
  'sb_publishable_W04BorQgNFQ2TMGxnaRYow_EwuzV5Ni'
)
