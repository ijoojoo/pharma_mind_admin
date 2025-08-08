/**
 * @description 通用的API响应类型
 */
export type Result<T = any> = {
  success: boolean;
  data: T;
  message?: string;
};

/**
 * @description Django REST Framework 分页响应类型
 */
export type PaginatedResult<T = any> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<T>;
};
