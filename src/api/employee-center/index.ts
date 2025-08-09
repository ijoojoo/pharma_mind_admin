// src/api/employee-center/index.ts
import { http } from "@/utils/http";

/** ==== 类型 ==== */
export type EmpStatus = "在岗" | "休假" | "停用";
export type EmpRole = "店员" | "店长" | "药师" | "导购" | "运营" | "商品";
export type CertType = "执业药师" | "中药师" | "GSP" | "急救证";
export type TrainStatus =
  | "未安排"
  | "已安排"
  | "学习中"
  | "待考试"
  | "已通过"
  | "未通过";

export interface EmployeeItem {
  id: string;
  name: string;
  gender: "男" | "女";
  phone: string;
  storeId: string;
  storeName: string;
  role: EmpRole;
  status: EmpStatus;
  hiredAt: string; // yyyy-mm-dd
  edu?: string;
  major?: string;
  expYears?: number;

  // 绩效相关（近30天）
  sales30d: number;
  orders30d: number;
  gp30d: number; // 毛利额
  attachRate: number; // 关联销售率
  highMarginRate: number; // 高毛利推荐占比
  kpiTarget?: number; // 目标销售
  kpiProgress?: number; // 已完成
  kpiCompletion?: number; // 完成度 0~1

  // 培训与证书
  certs?: { type: CertType; validUntil: string }[];
  train?: { course: string; status: TrainStatus; score?: number }[];

  tags: string[]; // AI 标签：强项/短板
}

export interface EmpQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  storeIds?: string[];
  role?: EmpRole | "全部";
  status?: EmpStatus | "全部";
  hiredRange?: [string, string]; // yyyy-mm-dd
}

export interface PageResp<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** ==== 模拟数据 ==== */
function rand(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}
function pick<T>(arr: T[]) {
  return arr[rand(0, arr.length - 1)];
}

const stores = [
  { id: "A", name: "门店A" },
  { id: "B", name: "门店B" },
  { id: "C", name: "门店C" },
  { id: "D", name: "门店D" }
];
const roles: EmpRole[] = ["店员", "店长", "药师", "导购", "运营", "商品"];
const statuses: EmpStatus[] = ["在岗", "休假", "停用"];
const certsAll: CertType[] = ["执业药师", "中药师", "GSP", "急救证"];
const trainPool = [
  "高毛利品类推荐话术",
  "感冒止咳用药推荐规范",
  "老慢病复购关怀 SOP",
  "处方调配与GSP要点",
  "门店陈列与端架转化"
];

function mockOneEmployee(i: number): EmployeeItem {
  const s = stores[i % stores.length];
  const role = roles[i % roles.length];
  const status = pick(statuses);
  const sales = rand(20000, 120000);
  const orders = rand(120, 900);
  const gp = Math.floor(sales * (0.23 + Math.random() * 0.15));
  const target = Math.floor(sales * (0.95 + Math.random() * 0.2));
  const progress = Math.floor(sales * (0.7 + Math.random() * 0.6));
  const completion = Math.max(0, Math.min(1, progress / Math.max(target, 1)));

  const certNum = role === "药师" ? 1 + rand(0, 1) : rand(0, 1);
  const certs = Array.from({ length: certNum }, () => ({
    type: pick(certsAll),
    validUntil: `202${rand(5, 7)}-${String(rand(1, 12)).padStart(2, "0")}-${String(rand(1, 28)).padStart(2, "0")}`
  }));

  const trainNum = rand(0, 2);
  const train = Array.from({ length: trainNum }, () => ({
    course: pick(trainPool),
    status: pick<TrainStatus>(["已安排", "学习中", "待考试", "已通过"])
  }));

  const tagsPick = [
    ["高毛利推荐强"],
    ["关联销售弱"],
    ["慢病随访优"],
    ["客诉处理好评"],
    ["医保流程熟练"]
  ];
  const tags = pick(tagsPick);

  return {
    id: `E${10000 + i}`,
    name: `员工${i}`,
    gender: i % 2 === 0 ? "男" : "女",
    phone: `13${rand(0, 999999999).toString().padStart(9, "0")}`,
    storeId: s.id,
    storeName: s.name,
    role,
    status,
    hiredAt: `202${rand(0, 4)}-${String(rand(1, 12)).padStart(2, "0")}-${String(rand(1, 28)).padStart(2, "0")}`,
    edu: pick(["大专", "本科", "中专"]),
    major: pick(["药学", "中药学", "护理", "市场营销"]),
    expYears: rand(1, 10),

    sales30d: sales,
    orders30d: orders,
    gp30d: gp,
    attachRate: +(0.05 + Math.random() * 0.35).toFixed(2),
    highMarginRate: +(0.08 + Math.random() * 0.4).toFixed(2),
    kpiTarget: target,
    kpiProgress: progress,
    kpiCompletion: +completion.toFixed(2),

    certs,
    train,
    tags
  };
}

function mockPage(query: EmpQuery): PageResp<EmployeeItem> {
  const total = 88;
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const list = Array.from({ length: end - start }, (_, idx) =>
    mockOneEmployee(start + idx + 1)
  );
  return { list, page, pageSize, total };
}

/** ==== API 占位（失败回退 mock） ==== */
export async function fetchEmployeePage(params: EmpQuery) {
  try {
    return await http.request<PageResp<EmployeeItem>>(
      "get",
      "/api/employee-center/list/",
      { params }
    );
  } catch {
    return mockPage(params);
  }
}

export async function postAssignTraining(ids: string[], course: string) {
  try {
    return await http.request<{ ok: boolean }>(
      "post",
      "/api/employee-center/training/assign/",
      { data: { ids, course } }
    );
  } catch {
    return { ok: true };
  }
}

export async function postSetKpi(payload: { id: string; kpiTarget: number }) {
  try {
    return await http.request<{ ok: boolean }>(
      "post",
      "/api/employee-center/kpi/set/",
      { data: payload }
    );
  } catch {
    return { ok: true };
  }
}

export async function postAICoach(ids: string[]) {
  try {
    return await http.request<{ ok: boolean; tips: string[] }>(
      "post",
      "/api/employee-center/ai/coach/",
      { data: { ids } }
    );
  } catch {
    return {
      ok: true,
      tips: [
        "晚高峰 18:00-19:00 的客流转化偏低，建议演练快速问诊开场白。",
        "维生素品类高毛利套装搭售成功率可提升，建议使用三明治推荐法。"
      ]
    };
  }
}

export async function postStatus(ids: string[], status: EmpStatus) {
  try {
    return await http.request<{ ok: boolean }>(
      "post",
      "/api/employee-center/status/",
      { data: { ids, status } }
    );
  } catch {
    return { ok: true };
  }
}
