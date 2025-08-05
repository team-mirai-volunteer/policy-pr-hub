import { HierarchicalData } from '../types/hierarchical';
import { extractHierarchicalDataFromWebapp } from './extractHierarchicalData';

interface RawHierarchicalResult {
  clusters: Array<{
    level: number;
    id: string;
    label: string;
    takeaway: string;
    value: number;
    parent: string;
    density_rank_percentile: number;
  }>;
  arguments: Array<{
    arg_id: string;
    argument: string;
    x: number;
    y: number;
    p: number;
    cluster_ids: string[];
  }>;
  [key: string]: unknown;
}

import hierarchicalResultDataRaw from '../data/hierarchical_result.json';
const hierarchicalResultData = hierarchicalResultDataRaw as RawHierarchicalResult;

export const sampleHierarchicalData: HierarchicalData = {
  clusters: [
    {
      id: "cluster_1",
      level: 0,
      parent: null,
      label: "教育と福祉の包括的支援体制",
      takeaway: "教育と福祉の包括的支援体制の強化が求められ、特に障がいのある子どもや不登校児童への支援が不足している。"
    },
    {
      id: "cluster_1_1", 
      level: 1,
      parent: "cluster_1",
      label: "障がい児支援",
      takeaway: "障がいのある子どもへの教育支援体制の充実が必要。"
    },
    {
      id: "cluster_1_2",
      level: 1, 
      parent: "cluster_1",
      label: "不登校児童支援",
      takeaway: "不登校児童への多様な学習機会の提供が求められている。"
    },
    {
      id: "cluster_2",
      level: 0,
      parent: null,
      label: "政策形成の透明性と公正性",
      takeaway: "政策形成においては透明性と公正性が重要視され、市民参加の仕組みづくりが必要。"
    },
    {
      id: "cluster_2_1",
      level: 1,
      parent: "cluster_2", 
      label: "市民参加制度",
      takeaway: "政策決定プロセスへの市民参加を促進する制度設計が重要。"
    },
    {
      id: "cluster_3",
      level: 0,
      parent: null,
      label: "デジタル化の推進",
      takeaway: "AI技術の倫理的導入とデジタル化の推進が重要な課題として挙げられている。"
    }
  ]
};

function transformClustersData(rawClusters: RawHierarchicalResult['clusters']): HierarchicalData {
  const filteredClusters = rawClusters.filter(cluster => cluster.level !== 0);
  
  const clusters = filteredClusters.map(cluster => ({
    id: cluster.id,
    level: cluster.level - 1,
    parent: cluster.parent === "0" ? null : cluster.parent,
    label: cluster.level === 1 ? `${cluster.label} (${cluster.value.toLocaleString()}件)` : cluster.label,
    takeaway: cluster.takeaway,
    value: cluster.value,
    count: cluster.value
  }));

  return {
    clusters,
    metadata: {
      totalItems: clusters.length,
      extractedAt: new Date().toISOString()
    }
  };
}

export async function loadHierarchicalData(): Promise<HierarchicalData> {
  try {
    if (hierarchicalResultData && hierarchicalResultData.clusters && hierarchicalResultData.clusters.length > 0) {
      console.log('Using real kouchou-ai hierarchical data');
      return transformClustersData(hierarchicalResultData.clusters);
    }
    
    return await extractHierarchicalDataFromWebapp();
  } catch (error) {
    console.error('Failed to load real hierarchical data, using sample data:', error);
    return sampleHierarchicalData;
  }
}
