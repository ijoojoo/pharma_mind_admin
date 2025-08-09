// src/api/product-center/index.ts
import { http } from "@/utils/http";

/** ==== 类型定义 ==== */
export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  spec: string;
  vendor: string;
  categoryL1?: string;
  categoryL2?: string;
  categoryL3?: string;
  priceMsrp: number;
  priceCurrent: number;
  grossMargin: number; // 0~1
  sales30d: number;
  stock: number;
  turnoverDays: number;
  priceBand?: "高" | "中" | "低";
  tags: string[]; // AI 标签：疾病、习惯、风险等
  flags?: Array<"重点" | "潜力" | "滞销">;
  status: "上架" | "下架" | "冻结";
  storeName?: string;
}

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: "上架" | "下架" | "冻结" | "全部";
  storeIds?: string[];
  category?: string[]; // [L1,L2,L3]
  priceMin?: number;
  priceMax?: number;
  stockStatus?: "缺货" | "低库存" | "正常" | "高库存" | "全部";
  dateRange?: [string, string]; // yyyy-mm-dd
}

export interface PageResp<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** ==== 模拟数据生成 ==== */
function rand(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}
function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}
const L1 = ["OTC", "处方药", "保健品", "医疗器械"];
const L2 = {
  OTC: ["感冒咳嗽", "消化系统", "皮肤用药"],
  处方药: ["心脑血管", "糖尿病", "高血压"],
  保健品: ["维矿", "肝胆养护", "免疫调节"],
  医疗器械: ["血压计", "血糖仪", "理疗保健"]
} as Record<string, string[]>;
const L3 = {
  感冒咳嗽: ["止咳", "感冒灵", "清热解毒"],
  消化系统: ["止泻", "助消化", "护胃"],
  皮肤用药: ["湿疹", "皮炎", "止痒"],
  心脑血管: ["阿司匹林", "他汀", "降脂"],
  糖尿病: ["二甲双胍", "胰岛素", "控糖套装"],
  高血压: ["缬沙坦", "氨氯地平", "复方制剂"],
  维矿: ["复合维生素", "钙片", "维生素C"],
  肝胆养护: ["护肝片", "胆汁分泌", "排毒养颜"],
  免疫调节: ["蛋白粉", "灵芝孢子", "益生菌"],
  血压计: ["上臂式", "腕式"],
  血糖仪: ["便携式", "云互联"],
  理疗保健: ["艾灸", "护腰", "理疗贴"]
} as Record<string, string[]>;

function mockOneProduct(i: number): ProductItem {
  const l1 = pick(L1);
  const l2 = pick(L2[l1]);
  const l3 = pick(L3[l2]);
  const base = 30 + (i % 50);
  const msrp = base + rand(5, 30);
  const cur = msrp - rand(0, 8);
  const gm = Math.max(
    0.18,
    Math.min(0.65, (msrp - cur * 0.7) / Math.max(msrp, 1))
  );
  const stock = rand(0, 800);
  const sales = rand(0, 1200);
  const flags: ProductItem["flags"] = [];
  if (sales > 800) flags.push("重点");
  if (sales > 300 && sales < 600) flags.push("潜力");
  if (sales < 50) flags.push("滞销");
  const band: ProductItem["priceBand"] =
    cur >= 80 ? "高" : cur >= 40 ? "中" : "低";

  return {
    id: `P${100000 + i}`,
    sku: `SKU-${1000 + i}`,
    barcode: `690${rand(100000000, 999999999)}`,
    name: `${l3}${i}号`,
    spec: `${rand(10, 60)}片/盒`,
    vendor: ["哈药", "修正", "以岭", "扬子江", "国药"][i % 5],
    categoryL1: l1,
    categoryL2: l2,
    categoryL3: l3,
    priceMsrp: msrp,
    priceCurrent: cur,
    grossMargin: +gm.toFixed(2),
    sales30d: sales,
    stock,
    turnoverDays: Math.max(1, Math.round(stock / Math.max(sales / 30, 0.5))),
    priceBand: band,
    tags: pick([["高毛利"], ["止咳"], ["糖尿病"], ["高客单"], ["保健偏好"]]),
    flags,
    status: pick(["上架", "下架", "冻结"]),
    storeName: ["门店A", "门店B", "门店C", "门店D"][i % 4]
  };
}

function mockPage(query: ProductQuery): PageResp<ProductItem> {
  const total = 137;
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const list = Array.from({ length: end - start }, (_, idx) =>
    mockOneProduct(start + idx + 1)
  );
  return { list, page, pageSize, total };
}

/** ==== API 占位（失败即回退 mock） ==== */
export async function fetchProductPage(params: ProductQuery) {
  try {
    return await http.request<PageResp<ProductItem>>(
      "get",
      "/api/product-center/list/",
      { params }
    );
  } catch {
    return mockPage(params);
  }
}

export async function aiClassifyCategory(ids: string[]) {
  try {
    return await http.request<{ ok: boolean }>(
      "post",
      "/api/product-center/ai/category/",
      { data: { ids } }
    );
  } catch {
    return { ok: true };
  }
}

export async function aiPriceBand(ids: string[]) {
  try {
    return await http.request<{ ok: boolean }>(
      "post",
      "/api/product-center/ai/price-band/",
      { data: { ids } }
    );
  } catch {
    return { ok: true };
  }
}

export async function aiMiningFocus(ids: string[]) {
  try {
    return await http.request<{ ok: boolean }>(
      "post",
      "/api/product-center/ai/focus-mining/",
      { data: { ids } }
    );
  } catch {
    return { ok: true };
  }
}

export async function saveProduct(
  partial: Partial<ProductItem> & { id: string }
) {
  try {
    return await http.request<{ ok: boolean }>(
      "post",
      "/api/product-center/save/",
      { data: partial }
    );
  } catch {
    return { ok: true };
  }
}
