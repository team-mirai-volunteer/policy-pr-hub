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

async function migrateData() {
  const prDataDir = path.join(process.cwd(), '../../pr-data/prs')
  
  if (!fs.existsSync(prDataDir)) {
    console.error('PR data directory not found:', prDataDir)
    process.exit(1)
  }

  const files = fs.readdirSync(prDataDir).filter(file => file.endsWith('.json'))
  console.log(`Found ${files.length} PR files to migrate`)

  let successCount = 0
  let errorCount = 0

  for (const file of files) {
    try {
      const prNumber = parseInt(path.basename(file, '.json'))
      const filePath = path.join(prDataDir, file)
      const prData = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      const { data: existing } = await supabase
        .from('prs')
        .select('id')
        .eq('pr_number', prNumber)
        .single()

      if (existing) {
        console.log(`PR #${prNumber} already exists, skipping`)
        continue
      }

      const insertData = {
        pr_number: prNumber,
        basic_info: prData.basic_info || prData,
        comments: prData.comments || [],
        files: prData.files || [],
        commits: prData.commits || [],
        reviews: prData.reviews || []
      }

      console.log(`Attempting to insert PR #${prNumber}...`)
      console.log('Insert data keys:', Object.keys(insertData))
      console.log('Basic info keys:', Object.keys(insertData.basic_info))

      const { data, error } = await supabase
        .from('prs')
        .insert(insertData)
        .select()

      if (error) {
        console.error(`Error inserting PR #${prNumber}:`)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.error('Error message:', error.message)
        console.error('Error code:', error.code)
        console.error('Error hint:', error.hint)
        errorCount++
      } else {
        console.log(`Successfully migrated PR #${prNumber}`)
        console.log('Inserted data:', data)
        successCount++
      }

      if (successCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

    } catch (error) {
      console.error(`Error processing file ${file}:`, error)
      errorCount++
    }
  }

  console.log(`Migration completed: ${successCount} successful, ${errorCount} errors`)
}

migrateData().catch(console.error)
