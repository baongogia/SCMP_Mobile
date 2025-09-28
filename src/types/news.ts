export interface NewsItem {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  image?: string;
  cover?: Array<{
    _id: string;
    path: string;
    title: string;
    alt?: string;
    filename: string;
    mime: string;
    size: number;
    created_at: string;
    updated_at: string;
  }>;
  author?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  view_count?: number;
  like_count?: number;
}

export interface NewsResponse {
  data: NewsItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  message: string;
  statusCode: number;
}

export interface NewsParams {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  search?: string;
}
