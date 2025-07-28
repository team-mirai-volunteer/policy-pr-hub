import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSupabase() {
  console.log('=== Supabase Debug Session ===')
  console.log('URL:', supabaseUrl)
  console.log('Key prefix:', supabaseAnonKey.substring(0, 20) + '...')
  
  console.log('\n1. Testing table access...')
  try {
    const { data, error, count } = await supabase
      .from('prs')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log('Query result:', { data, error, count })
  } catch (err) {
    console.error('Query failed:', err)
  }

  console.log('\n2. Testing table structure...')
  try {
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: 'prs' })
    
    console.log('Table info result:', { data, error })
  } catch (err) {
    console.error('Table info failed:', err)
  }

  console.log('\n3. Testing minimal insert...')
  try {
    const { data, error } = await supabase
      .from('prs')
      .insert({
        pr_number: 99999,
        basic_info: { test: 'data' }
      })
      .select()
    
    console.log('Minimal insert result:', { data, error })
    
    if (!error && data) {
      await supabase.from('prs').delete().eq('pr_number', 99999)
      console.log('Cleaned up test record')
    }
  } catch (err) {
    console.error('Minimal insert failed:', err)
  }

  console.log('\n4. Testing permissions...')
  try {
    const { data, error } = await supabase.auth.getUser()
    console.log('Auth status:', { data, error })
  } catch (err) {
    console.error('Auth check failed:', err)
  }
}

debugSupabase().catch(console.error)
