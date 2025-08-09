// api/dashboard.ts

import { http } from "@/utils/http";

// 获取核心指标数据
export const getCoreMetrics = (dateRange: string) => {
  return http.request("get", `/api/metrics/core?range=${dateRange}`);
};

// 获取AI运营速报
export const getAIOperationReport = () => {
  return http.request("get", "/api/ai/operation-report");
};

// 获取AI风险预警
export const getAIRiskAlert = () => {
  return http.request("get", "/api/ai/risk-alert");
};

// 获取关键指标趋势图数据
export const getMetricsTrend = (dateRange: string) => {
  return http.request("get", `/api/metrics/trend?range=${dateRange}`);
};

// 获取KPI任务完成进度
export const getKPITaskProgress = () => {
  return http.request("get", "/api/kpi/task-progress");
};

// 获取龙虎榜数据（门店、人员、产品）
export const getLeaderboard = (category: string) => {
  return http.request("get", `/api/leaderboard/${category}`);
};

// 获取库存风险雷达数据
export const getInventoryRiskRadar = () => {
  return http.request("get", "/api/inventory/risk-radar");
};

// 获取会员增长与活跃情况
export const getMemberGrowth = () => {
  return http.request("get", "/api/member/growth");
};

// 获取员工赋能情况
export const getEmployeeEmpowerment = () => {
  return http.request("get", "/api/employee/empowerment");
};
