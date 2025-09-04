import { MetadataRoute } from 'next'
import { loadHierarchicalData } from '@/lib/hierarchicalData'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://policy-pr-hub.vercel.app'
  
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/kouchou-ai`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hierarchical`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hierarchical-clusters`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scatter`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  let prRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: prs } = await supabase
      .from('prs')
      .select('pr_number, basic_info')
      .limit(1000)
      .order('pr_number', { ascending: false })

    if (prs) {
      prRoutes = prs.map((pr) => ({
        url: `${baseUrl}/pr/${pr.pr_number}`,
        lastModified: new Date(pr.basic_info?.updated_at || new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error fetching PRs for sitemap:', error)
  }

  let clusterRoutes: MetadataRoute.Sitemap = []
  try {
    const data = await loadHierarchicalData()
    clusterRoutes = data.clusters.map((cluster) => ({
      url: `${baseUrl}/cluster/${encodeURIComponent(cluster.id)}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  } catch (error) {
    console.error('Error loading clusters for sitemap:', error)
  }

  return [...staticRoutes, ...prRoutes, ...clusterRoutes]
}
