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

async function testSingleMigration() {
  console.log('Testing single PR migration...')
  console.log('Supabase URL:', supabaseUrl)
  
  try {
    const { data: testData, error: testError } = await supabase
      .from('prs')
      .select('count', { count: 'exact', head: true })
    
    if (testError) {
      console.error('Connection test failed:', JSON.stringify(testError, null, 2))
      return
    }
    
    console.log('✅ Connection successful, current record count:', testData)
  } catch (err) {
    console.error('❌ Connection failed:', err)
    return
  }

  const prDataPath = path.join(process.cwd(), '../../pr-data/prs/108.json')
  
  if (!fs.existsSync(prDataPath)) {
    console.error('PR #108 data file not found:', prDataPath)
    return
  }

  const prData = JSON.parse(fs.readFileSync(prDataPath, 'utf8'))
  console.log('PR data loaded, keys:', Object.keys(prData))
  console.log('Basic info keys:', Object.keys(prData.basic_info || {}))

  const insertData = {
    pr_number: 108,
    basic_info: prData.basic_info || prData,
    comments: prData.comments || [],
    files: prData.files || [],
    commits: prData.commits || [],
    reviews: prData.reviews || []
  }

  console.log('\nAttempting to insert PR #108...')
  console.log('Insert data structure:')
  console.log('- pr_number:', insertData.pr_number)
  console.log('- basic_info type:', typeof insertData.basic_info)
  console.log('- comments length:', insertData.comments.length)
  console.log('- files length:', insertData.files.length)
  console.log('- commits length:', insertData.commits.length)
  console.log('- reviews length:', insertData.reviews.length)

  const { data, error } = await supabase
    .from('prs')
    .insert(insertData)
    .select()

  if (error) {
    console.error('\n❌ Insert failed:')
    console.error('Full error object:', JSON.stringify(error, null, 2))
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error hint:', error.hint)
    console.error('Error details:', error.details)
  } else {
    console.log('\n✅ Insert successful!')
    console.log('Inserted data:', JSON.stringify(data, null, 2))
  }
}

testSingleMigration().catch(console.error)
