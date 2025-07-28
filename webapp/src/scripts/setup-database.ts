import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupDatabase() {
  console.log('Setting up Supabase database schema...')
  console.log('Supabase URL:', supabaseUrl)
  
  const schemaPath = path.join(process.cwd(), 'src/lib/database.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  console.log('\n=== Database Schema ===')
  console.log(schema)
  console.log('========================\n')
  
  try {
    const { data, error } = await supabase.from('prs').select('count', { count: 'exact', head: true })
    if (error && error.code === 'PGRST116') {
      console.log('✅ Connection successful, but prs table does not exist yet')
      console.log('Please execute the above SQL schema in your Supabase dashboard SQL editor')
    } else if (error) {
      console.error('❌ Connection error:', error)
    } else {
      console.log('✅ Connection successful, prs table exists with', data, 'records')
    }
  } catch (err) {
    console.error('❌ Connection failed:', err)
  }
}

setupDatabase().catch(console.error)
