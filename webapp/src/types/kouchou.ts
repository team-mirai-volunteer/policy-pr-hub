export type Meta = {
  isDefault: boolean;
  reporter: string;
  message: string;
  webLink?: string;
  privacyLink?: string;
  termsLink?: string;
  brandColor?: string;
};

export enum ReportVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
  UNLISTED = "unlisted",
}

export type Report = {
  slug: string;
  status: string;
  title: string;
  description: string;
  isPubcom: boolean;
  visibility: ReportVisibility;
  createdAt?: string;
};

export type Result = {
  arguments: Argument[];
  clusters: Cluster[];
  comments: Comments;
  propertyMap: Record<string, unknown>;
  translations: Record<string, unknown>;
  overview: string;
  config: Config;
  comment_num: number;
  filteredArgumentIds?: string[];
  visibility?: ReportVisibility;
};

export type Argument = {
  arg_id: string;
  argument: string;
  comment_id: number;
  x: number;
  y: number;
  p: number;
  cluster_ids: string[];
  attributes?: Record<string, string | number>;
  url?: string;
};

export type Cluster = {
  level: number;
  id: string;
  label: string;
  takeaway: string;
  value: number;
  parent: string;
  density_rank_percentile: number;
  allFiltered?: boolean;
  filtered?: boolean;
};

export type Comments = Record<string, { comment: string }>;

export type Config = {
  name: string;
  question: string;
  input: string;
  model: string;
  intro: string;
  output_dir: string;
  previous?: Config;
  is_embedded_at_local: boolean;
  enable_source_link?: boolean;
  extraction: {
    workers: number;
    limit: number;
    properties: string[] | string;
    categories: Record<string, Record<string, string>>;
    category_batch_size: number;
    source_code: string;
    prompt: string;
    model: string;
  };
  hierarchical_clustering: {
    cluster_nums: number[];
    source_code: string;
  };
  embedding: {
    model: string;
    source_code: string;
  };
  hierarchical_initial_labelling: {
    workers: number;
    source_code: string;
    prompt: string;
    model: string;
  };
  hierarchical_merge_labelling: {
    workers: number;
    source_code: string;
    prompt: string;
    model: string;
  };
  hierarchical_overview: {
    source_code: string;
    prompt: string;
    model: string;
  };
  hierarchical_aggregation: {
    hidden_properties: Record<string, string[]>;
    source_code: string;
  };
  hierarchical_visualization: {
    replacements: Record<string, string[]>;
    source_code: string;
  };
  plan: {
    step: string;
    run: boolean | string;
    reason: string;
  }[];
  status:
    | string
    | {
        status: string;
        start_time: string;
        completed_jobs: {
          step: string;
          completed: string;
          duration: number | string;
          params: {
            workers: number;
            limit?: number | string;
            properties?: string[] | string;
            categories?: Record<string, Record<string, string>>;
            category_batch_size: number;
            source_code: string;
            prompt: string;
            model: string;
          };
        }[];
        lock_until: string;
        current_job: string;
        current_job_started: string;
      };
};
