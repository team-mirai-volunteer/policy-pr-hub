export interface HierarchicalArgument {
  arg_id: string;
  argument: string;
  x: number;
  y: number;
  p: number;
  cluster_ids: string[];
}

export interface HierarchicalCluster {
  id: string;
  level: number;
  parent: string | null;
  label: string;
  takeaway: string;
  value?: number;
  count?: number;
  arguments?: HierarchicalArgument[];
}

export interface HierarchicalData {
  clusters: HierarchicalCluster[];
  arguments: HierarchicalArgument[];
  metadata?: {
    totalItems: number;
    extractedAt: string;
  };
}
