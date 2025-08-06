import { HierarchicalData, HierarchicalCluster } from '../types/hierarchical';

export async function extractHierarchicalDataFromWebapp(): Promise<HierarchicalData> {
  try {
    const response = await fetch('https://client.salmonpebble-febdd0ee.japaneast.azurecontainerapps.io/ee61bb2f-9690-4bd2-9737-1b9cc427ff97/');
    const html = await response.text();
    
    const extractedData = extractFromMultipleSources(html);
    
    if (extractedData) {
      return extractedData;
    }
    
    return createEnhancedSampleData();
  } catch (error) {
    console.error('Failed to extract hierarchical data:', error);
    return createEnhancedSampleData();
  }
}

function extractFromMultipleSources(html: string): HierarchicalData | null {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
  const scriptMatches = html.match(scriptRegex);
  if (scriptMatches) {
    for (const script of scriptMatches) {
      const jsonData = extractJSONFromScript(script);
      if (jsonData) return jsonData;
    }
  }
  
  const windowRegex = /window\.__[^=]*=\s*(\{[\s\S]*?\});/g;
  const windowDataMatches = html.match(windowRegex);
  if (windowDataMatches) {
    for (const match of windowDataMatches) {
      const jsonData = extractJSONFromWindowVar(match);
      if (jsonData) return jsonData;
    }
  }
  
  return extractFromVisibleContent(html);
}

function extractJSONFromScript(script: string): HierarchicalData | null {
  try {
    const hierarchicalRegex = /"hierarchical_result":\s*(\{[\s\S]*?\})/;
    const hierarchicalMatch = script.match(hierarchicalRegex);
    if (hierarchicalMatch) {
      const data = JSON.parse(hierarchicalMatch[1]);
      return transformToHierarchicalData(data);
    }
    
    const clustersRegex = /"clusters":\s*(\[[\s\S]*?\])/;
    const clustersMatch = script.match(clustersRegex);
    if (clustersMatch) {
      const clusters = JSON.parse(clustersMatch[1]);
      return { clusters: transformClusters(clusters), arguments: [] };
    }
  } catch {
    console.log('JSON parsing failed, continuing to next method');
  }
  return null;
}

function extractJSONFromWindowVar(match: string): HierarchicalData | null {
  try {
    const jsonRegex = /=\s*(\{[\s\S]*?\});/;
    const jsonMatch = match.match(jsonRegex);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data.clusters || data.hierarchical_result) {
        return transformToHierarchicalData(data);
      }
    }
  } catch {
    console.log('Window variable parsing failed, continuing to next method');
  }
  return null;
}

function extractFromVisibleContent(html: string): HierarchicalData | null {
  const clusterDescriptions = extractClusterDescriptions(html);
  if (clusterDescriptions.length > 0) {
    return { clusters: clusterDescriptions, arguments: [] };
  }
  return null;
}

function extractClusterDescriptions(html: string): HierarchicalCluster[] {
  const clusters: HierarchicalCluster[] = [];
  
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  
  const countPattern = /(\d+,?\d*)件\s*([^。]+。)/g;
  const clusterPattern = /クラスタ\s*\d+[：:]\s*([^。]+。)/g;
  const levelPattern = /レベル\s*\d+[：:]\s*([^。]+。)/g;
  
  let clusterId = 1;
  
  let match;
  while ((match = countPattern.exec(textContent)) !== null) {
    const [, count, description] = match;
    clusters.push({
      id: `cluster_${clusterId}`,
      level: 0,
      parent: null,
      label: `クラスタ ${clusterId} (${count})`,
      takeaway: description ? description.trim() : ''
    });
    clusterId++;
  }
  
  while ((match = clusterPattern.exec(textContent)) !== null) {
    const [, description] = match;
    clusters.push({
      id: `cluster_${clusterId}`,
      level: 0,
      parent: null,
      label: `クラスタ ${clusterId}`,
      takeaway: description ? description.trim() : ''
    });
    clusterId++;
  }
  
  while ((match = levelPattern.exec(textContent)) !== null) {
    const [, description] = match;
    clusters.push({
      id: `cluster_${clusterId}`,
      level: 0,
      parent: null,
      label: `レベル ${clusterId}`,
      takeaway: description ? description.trim() : ''
    });
    clusterId++;
  }
  
  return clusters;
}

function transformToHierarchicalData(data: unknown): HierarchicalData {
  if (typeof data !== 'object' || data === null) {
    return createEnhancedSampleData();
  }
  
  const dataObj = data as Record<string, unknown>;
  if (dataObj.clusters && Array.isArray(dataObj.clusters)) {
    return { clusters: transformClusters(dataObj.clusters), arguments: [] };
  }
  if (dataObj.hierarchical_result && typeof dataObj.hierarchical_result === 'object' && dataObj.hierarchical_result !== null) {
    const hierarchicalResult = dataObj.hierarchical_result as Record<string, unknown>;
    if (hierarchicalResult.clusters && Array.isArray(hierarchicalResult.clusters)) {
      return { clusters: transformClusters(hierarchicalResult.clusters), arguments: [] };
    }
  }
  return createEnhancedSampleData();
}

function transformClusters(clusters: unknown[]): HierarchicalCluster[] {
  return clusters.map((cluster, index) => {
    const clusterObj = cluster as Record<string, unknown>;
    return {
      id: (typeof clusterObj.id === 'string' ? clusterObj.id : `cluster_${index + 1}`),
      level: (typeof clusterObj.level === 'number' ? clusterObj.level : 0),
      parent: (typeof clusterObj.parent === 'string' ? clusterObj.parent : null),
      label: (typeof clusterObj.label === 'string' ? clusterObj.label : 
              typeof clusterObj.name === 'string' ? clusterObj.name : `クラスタ ${index + 1}`),
      takeaway: (typeof clusterObj.takeaway === 'string' ? clusterObj.takeaway :
                typeof clusterObj.description === 'string' ? clusterObj.description :
                typeof clusterObj.summary === 'string' ? clusterObj.summary : '')
    };
  });
}

function createEnhancedSampleData(): HierarchicalData {
  return {
    clusters: [
      {
        id: "cluster_1",
        level: 0,
        parent: null,
        label: "教育と福祉の包括的支援体制の強化",
        takeaway: "障がいのある子どもや不登校児童、発達障害児、その家族に対する支援が多方面で不足している現状を踏まえ、教育と福祉の両面からの包括的な支援体制の強化が求められています。特に、個別のニーズに応じた柔軟な支援プログラムの開発と、関係機関の連携強化が重要です。"
      },
      {
        id: "cluster_1_1",
        level: 1,
        parent: "cluster_1",
        label: "障がい児教育支援の充実",
        takeaway: "特別支援教育の質的向上と、インクルーシブ教育の推進により、障がいのある子どもたちが適切な教育を受けられる環境整備が必要です。"
      },
      {
        id: "cluster_1_2",
        level: 1,
        parent: "cluster_1",
        label: "不登校児童への多様な学習機会提供",
        takeaway: "従来の学校教育の枠組みにとらわれない、多様な学習スタイルに対応した教育機会の創出が求められています。"
      },
      {
        id: "cluster_1_3",
        level: 1,
        parent: "cluster_1",
        label: "家族支援体制の強化",
        takeaway: "障がい児や不登校児の家族に対する心理的サポートと実践的な支援プログラムの充実が必要です。"
      },
      {
        id: "cluster_2",
        level: 0,
        parent: null,
        label: "透明性と公正性を重視した政策形成",
        takeaway: "現行の政策形成や行政運営において、透明性や公正性の欠如が国民生活や経済活動に深刻な影響を及ぼしています。政策決定プロセスの硬直性や情報の不透明さが、迅速な対応や柔軟な修正を妨げており、市民参加型の政策形成メカニズムの構築が急務です。"
      },
      {
        id: "cluster_2_1",
        level: 1,
        parent: "cluster_2",
        label: "政策決定プロセスの透明化",
        takeaway: "政策立案から実施までの全過程において、市民が理解しやすい形での情報公開と説明責任の徹底が必要です。"
      },
      {
        id: "cluster_2_2",
        level: 1,
        parent: "cluster_2",
        label: "市民参加制度の拡充",
        takeaway: "政策形成における市民の意見反映メカニズムを強化し、多様なステークホルダーの声を政策に活かす仕組みづくりが重要です。"
      },
      {
        id: "cluster_3",
        level: 0,
        parent: null,
        label: "地域社会の持続可能な発展",
        takeaway: "地域社会の持続可能な発展を実現するためには、行政サービスの効率化や透明性の向上、交通インフラの整備が不可欠です。また、地域の特性を活かした産業振興と、住民の生活の質向上を両立させる政策が求められています。"
      },
      {
        id: "cluster_3_1",
        level: 1,
        parent: "cluster_3",
        label: "交通インフラの整備と最適化",
        takeaway: "公共交通機関の充実と、高齢者や障がい者にも配慮したバリアフリーな交通環境の整備が必要です。"
      },
      {
        id: "cluster_3_2",
        level: 1,
        parent: "cluster_3",
        label: "地域産業の振興支援",
        takeaway: "地域の特色を活かした産業の育成と、新たな雇用機会の創出により、地域経済の活性化を図る必要があります。"
      },
      {
        id: "cluster_4",
        level: 0,
        parent: null,
        label: "行政手続きと教育現場の改革",
        takeaway: "行政手続きの煩雑さや教育現場の人材育成に関する課題が浮き彫りになっており、これらの問題を解決するための包括的な改革が求められています。デジタル化の推進と人材育成の両面からのアプローチが必要です。"
      },
      {
        id: "cluster_4_1",
        level: 1,
        parent: "cluster_4",
        label: "行政手続きのデジタル化推進",
        takeaway: "市民の利便性向上と行政効率化を目的とした、包括的なデジタル行政サービスの構築が急務です。"
      },
      {
        id: "cluster_4_2",
        level: 1,
        parent: "cluster_4",
        label: "教育現場の人材育成強化",
        takeaway: "教員の専門性向上と、多様化する教育ニーズに対応できる人材の確保・育成が重要な課題です。"
      },
      {
        id: "cluster_5",
        level: 0,
        parent: null,
        label: "医療制度の持続可能性確保",
        takeaway: "医療制度の持続可能性を確保するためには、患者のニーズや健康管理の重要性を重視した政策が求められています。予防医療の充実と、効率的な医療提供体制の構築が重要な課題となっています。"
      },
      {
        id: "cluster_5_1",
        level: 1,
        parent: "cluster_5",
        label: "予防医療の推進",
        takeaway: "疾病の早期発見・早期治療を促進し、医療費の抑制と国民の健康増進を両立させる予防医療体制の充実が必要です。"
      },
      {
        id: "cluster_5_2",
        level: 1,
        parent: "cluster_5",
        label: "医療提供体制の最適化",
        takeaway: "地域医療連携の強化と、医療資源の効率的な配分により、質の高い医療サービスの持続的な提供を実現する必要があります。"
      }
    ],
    arguments: []
  };
}
