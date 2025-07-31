export interface HierarchicalCluster {
  id: string;
  level: number;
  parent: string | null;
  label: string;
  takeaway: string;
  value?: number;
  count?: number;
}

export interface HierarchicalData {
  clusters: HierarchicalCluster[];
  metadata?: {
    totalItems: number;
    extractedAt: string;
  };
}
