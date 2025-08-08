import { http } from "@/utils/http";
import type { Result, PaginatedResult } from "./types";

// --- “当日战报” 相关类型和接口 ---

export type DailySummaryMetrics = {
  totalSales: number;
  totalProfit: number;
  customerCount: number;
  avgOrderValue: number;
  kpiProgress: number;
};

export type HourlySalesTrend = {
  hours: string[];
  sales: number[];
};

export type StoreSalesRanking = {
  storeNames: string[];
  sales: number[];
};

export const getDailySummary = () => {
  return http.request<Result<DailySummaryMetrics>>(
    "get",
    "/api/analysis/daily-summary/"
  );
};

export const getHourlySalesTrend = () => {
  return http.request<Result<HourlySalesTrend>>(
    "get",
    "/api/analysis/hourly-sales/"
  );
};

export const getStoreSalesRanking = () => {
  return http.request<Result<StoreSalesRanking>>(
    "get",
    "/api/analysis/store-ranking/"
  );
};

export const requestAIDailyAnalysis = () => {
  return http.request<Result<{ report: string }>>(
    "post",
    "/api/analysis/ai-daily-report/"
  );
};

// --- ↓↓↓ 新增内容：“综合数据查询” 相关类型和接口 ↓↓↓ ---

/**
 * @description 定义综合查询返回的数据行类型
 */
export type ComprehensiveDataRow = {
  date: string; // 日期
  storeName: string; // 门店名称
  sales: number; // 销售额
  profit: number; // 毛利额
  profitMargin: number; // 毛利率 (%)
  customerCount: number; // 客流
  avgOrderValue: number; // 客单价
};

/**
 * @description 获取综合查询数据
 */
export const getComprehensiveData = (params?: object) => {
  // 注意：返回类型是分页的
  return http.request<{ data: PaginatedResult<ComprehensiveDataRow> }>(
    "get",
    "/api/analysis/comprehensive-query/",
    { params }
  );
};
// --- ↑↑↑ 新增内容结束 ↑↑↑ ---
