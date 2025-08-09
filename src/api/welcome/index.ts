// src/api/welcome/index.ts
// PureAdmin 项目里的 http 是命名导出
import { http } from "@/utils/http";

export type Role = "director" | "manager";
export type MetricKey = "amount" | "profit" | "traffic";

export interface TodayKpiRespItem {
  value: number;
  target: number;
  hb: number; // 环比
  yb: number; // 同比
}
export interface TodayKpisResp {
  amount: TodayKpiRespItem;
  profit: TodayKpiRespItem;
  traffic: TodayKpiRespItem;
  member: TodayKpiRespItem;
}

export interface TodayHourlyResp {
  hours: string[]; // 例如 ["8:00",...,"22:00"]
  sales: number[]; // 销售额
  traffic: number[]; // 客流
  profit: number[]; // 毛利额
}

export interface SevenDaysResp {
  dates: string[]; // 近7日 ["08/03",...]
  values: number[]; // 指标值
  avgTicket: number[]; // 平均客单价
}

export interface StoreKpiItem {
  store: string;
  target: number;
  current: number;
  type: "daily" | "range";
  start?: string;
  end?: string;
}

export interface AiReviewReq {
  role: Role;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  store_ids?: string[];
}
export interface AiReviewResp {
  summary: {
    totalSales: string;
    peakHour: string;
    bestStore: string;
    avgCompletion: number; // 0~1
    timeProgress: number; // 0~1
  };
  highlights: string[];
  risks: string[];
  actions: string[];
}

// ---- 统一使用 http.request ----

export function getTodayKpis(params?: { store_ids?: string[] }) {
  return http.request<TodayKpisResp>("get", "/api/welcome/today-kpis/", {
    params
  });
}

export function getTodayHourly(params?: { store_ids?: string[] }) {
  return http.request<TodayHourlyResp>("get", "/api/welcome/today-hourly/", {
    params
  });
}

export function getSevenDays(params: {
  metric: MetricKey;
  store_ids?: string[];
}) {
  return http.request<SevenDaysResp>("get", "/api/welcome/seven-days/", {
    params
  });
}

export function getStoreKpiProgress(params: {
  mode: "daily" | "range";
  start?: string;
  end?: string;
  store_ids?: string[];
}) {
  return http.request<StoreKpiItem[]>(
    "get",
    "/api/welcome/store-kpi-progress/",
    { params }
  );
}

export function postAiReview(data: AiReviewReq) {
  return http.request<AiReviewResp>("post", "/api/welcome/ai-review/", {
    data
  });
}
