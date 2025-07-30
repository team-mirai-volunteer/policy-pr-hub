import { HierarchicalData } from '../types/hierarchical';
import { extractHierarchicalDataFromWebapp } from './extractHierarchicalData';
import extractedData from './extracted_hierarchical_data.json';

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

export async function loadHierarchicalData(): Promise<HierarchicalData> {
  try {
    if (extractedData && extractedData.clusters && extractedData.clusters.length > 0) {
      console.log('Using extracted real hierarchical data');
      return extractedData as HierarchicalData;
    }
    
    return await extractHierarchicalDataFromWebapp();
  } catch (error) {
    console.error('Failed to load real hierarchical data, using sample data:', error);
    return sampleHierarchicalData;
  }
}
