import { HierarchicalCluster } from '@/types/hierarchical'

interface DensityDataRow {
  level: number
  id: string
  label: string
  description: string
  value: number
  parent: string
  density: number
  density_rank: number
  density_rank_percentile: number
}

let densityDataCache: DensityDataRow[] | null = null

export async function loadDensityData(): Promise<DensityDataRow[]> {
  if (densityDataCache) {
    return densityDataCache
  }

  try {
    const response = await fetch('/data/hierarchical_merge_labels.csv')
    const csvText = await response.text()
    
    const lines = csvText.split('\n')
    const headers = lines[0].split(',')
    
    const data: DensityDataRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = parseCSVLine(line)
      if (values.length < headers.length) continue
      
      const row: DensityDataRow = {
        level: parseInt(values[0]) || 0,
        id: values[1] || '',
        label: values[2] || '',
        description: values[3] || '',
        value: parseInt(values[4]) || 0,
        parent: values[5] || '',
        density: parseFloat(values[6]) || 0,
        density_rank: parseFloat(values[7]) || 0,
        density_rank_percentile: parseFloat(values[8]) || 0
      }
      
      data.push(row)
    }
    
    densityDataCache = data
    console.log(`Loaded ${data.length} density data rows`)
    return data
  } catch (error) {
    console.error('Failed to load density data:', error)
    return []
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

export function getDensityForCluster(clusterId: string, densityData: DensityDataRow[]): number | undefined {
  const row = densityData.find(d => d.id === clusterId)
  return row?.density_rank_percentile
}
