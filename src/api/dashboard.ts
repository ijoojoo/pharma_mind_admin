import { http } from "@/utils/http";

// --- 新增：定义一个通用的分页结果类型 ---
export type PaginatedResult<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// --- 类型定义 ---
export type DailySale = { date: string; total_sales: number };

export type TopProduct = { product__name: string; total_revenue: number };

export type Insight = {
  id: number;
  content: string;
  insight_type: string;
  is_resolved: boolean;
  created_at: string;
};

export type InventoryAnalysis = {
  total_inventory_value: number;
  value_by_supplier: {
    supplier: string;
    total_value: number;
  }[];
};

export type AIReport = { report_content: string };

export type SummaryData = {
  total_revenue: number;
  total_profit: number;
  total_orders: number;
  average_order_value: number;
};

// --- API 函数 ---

/** 获取每日销售数据 */
export const getDailySales = (params?: object) => {
  return http.request<DailySale[]>("get", "/api/analysis/daily-sales/", {
    params
  });
};

/** 获取畅销商品数据 */
export const getTopProducts = (params?: object) => {
  return http.request<TopProduct[]>("get", "/api/analysis/top-products/", {
    params
  });
};

/** 获取运营洞察 */
export const getInsights = () => {
  // --- 核心修改：使用我们新定义的 PaginatedResult 类型 ---
  return http.request<PaginatedResult<Insight>>("get", "/api/insights/");
};

/** 获取库存分析数据 */
export const getInventoryAnalysis = () => {
  return http.request<InventoryAnalysis>("get", "/api/analysis/inventory/");
};

/** 获取AI运营周报 */
export const getAIWeeklyReport = () => {
  return http.request<AIReport>("get", "/api/analysis/ai-weekly-report/", {
    timeout: 30000
  });
};

/** 获取数据概览 */
export const getSummaryData = (params?: object) => {
  return http.request<SummaryData>("get", "/api/analysis/summary/", {
    params
  });
};
