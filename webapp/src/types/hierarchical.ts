export interface HierarchicalCluster {
  id: string;
  level: number;
  parent: string | null;
  label: string;
  takeaway: string;
}

export interface HierarchicalData {
  clusters: HierarchicalCluster[];
}
