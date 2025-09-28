// Export all types from a single entry point
export * from "./auth";
export * from "./course";
export * from "./chat";
export * from "./order";
export * from "./schedule";
export * from "./news";

// Common types
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  statusCode: number;
  meta_data?: {
    count: number;
    skip: number;
    limit: number;
  };
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}
