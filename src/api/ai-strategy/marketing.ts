// --- src/api/ai-strategy/marketing.ts ---
import { http } from "@/utils/http";

/** ===== 类型 ===== */
export type campaign_goal =
  | "动销清库存"
  | "拉新促活"
  | "提升客单"
  | "冲高毛利"
  | "节日主题";

export type channel =
  | "到店（POP/端架）"
  | "社群/企微"
  | "小程序/APP"
  | "抖音/快手"
  | "本地团长"
  | "外卖平台";

export interface sku_item {
  id: string;
  name: string;
  spec: string;
  price: number;
  grossMargin: number; // 0~1
  role?: "引流" | "形象" | "利润" | "搭售";
  tags?: string[];
  band?: "高" | "中" | "低";
  category?: string;
}

export interface campaign_form {
  name?: string;
  goal: campaign_goal;
  daterange: [string, string];
  stores: string[];
  budget: number;
  categories: string[];
  targetUsers: string[];
  coupon: {
    type: "满减" | "折扣" | "券包" | "买赠";
    value: number;
    threshold?: number;
  };
  channels: channel[];
  notes?: string;
  pickedSkus?: sku_item[];
  channelRhythm?: Array<{
    name: channel;
    preheat: number;
    burst: number;
    rebound: number;
  }>;
}

export interface marketing_plan {
  theme: string;
  slogan: string;
  timeframe: {
    start: string;
    end: string;
    rhythm: Array<{ date: string; focus: string }>;
  };
  segments: Array<{ name: string; rule: string; estUsers: number }>;
  skus: sku_item[];
  bundleRules: Array<{ name: string; desc: string }>;
  couponPlan: string;
  channels: Array<{ name: channel; budget: number; desc: string }>;
  storeChecklist: string[];
  staffPlaybook: Array<{ role: "店长" | "店员"; tips: string[] }>;
  kpi: {
    baselineSales: number;
    expectedUpliftPct: number;
    expectedSales: number;
    expectedGrossProfit: number;
    guardrail: string[];
  };
  risks: Array<{ risk: string; mitigation: string }>;
  forecast7d: Array<{ date: string; sales: number; gross: number }>;
  riskScore?: {
    marginSafety: number;
    oosRisk: number;
    convertRisk: number;
    advice: string[];
  };
}

/** ===== mock & 工具 ===== */
const rnd = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1));

function mock_sku_pool(): sku_item[] {
  const cats = ["感冒咳嗽", "维矿", "皮肤用药", "肠胃用药", "血压计"];
  return Array.from({ length: 60 }, (_, i) => {
    const category = cats[i % cats.length];
    const price = rnd(9, 299);
    const gm = +(0.2 + Math.random() * 0.3).toFixed(2);
    const band: sku_item["band"] =
      price >= 150 ? "高" : price >= 50 ? "中" : "低";
    return {
      id: `P${1000 + i}`,
      name: `${category}·精选${i + 1}`,
      spec: `${rnd(10, 60)}片/盒`,
      price,
      grossMargin: gm,
      tags: Math.random() > 0.6 ? ["明星款"] : [],
      band,
      category
    };
  });
}

function mock_plan(form: campaign_form): marketing_plan {
  const [start, end] = form.daterange;
  const base = 320000 + rnd(0, 180000);
  const uplift =
    form.goal === "冲高毛利" ? 0.22 : form.goal === "提升客单" ? 0.18 : 0.15;
  const expected_sales = Math.round(base * (1 + uplift));
  const gp_rate = form.goal === "冲高毛利" ? 0.38 : 0.32;

  const days = 7;
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const forecast7d = dates.map((d, i) => {
    const sales = Math.round(
      (expected_sales / days) * (0.9 + Math.sin(i) * 0.1 + Math.random() * 0.05)
    );
    return { date: d, sales, gross: Math.round(sales * gp_rate) };
  });

  const ch_list = form.channels.length
    ? form.channels
    : (["到店（POP/端架）", "社群/企微", "小程序/APP"] as channel[]);
  const base_per = Math.round(form.budget / Math.max(1, ch_list.length));
  const channels = ch_list.map(ch => ({
    name: ch,
    budget: base_per,
    desc:
      ch === "社群/企微"
        ? "社群日更种草，券包裂变"
        : ch === "到店（POP/端架）"
          ? "端架+动线陈列，主题海报"
          : "小程序闪促，限时秒杀+券核销激励"
  }));

  const skus: sku_item[] = form.pickedSkus?.length
    ? form.pickedSkus.map((x, i) => ({
        ...x,
        role: (["引流", "形象", "利润", "搭售"] as const)[i % 4]
      }))
    : Array.from({ length: 10 }, (_, i) => ({
        id: `S${1000 + i}`,
        name: `${form.categories[0] || "核心品类"}·优选${i + 1}`,
        spec: `${rnd(10, 60)}片/盒`,
        price: 19 + i * 5,
        grossMargin: +(0.25 + Math.random() * 0.25).toFixed(2),
        role: (["引流", "形象", "利润", "搭售"] as const)[i % 4]
      }));

  const avg_gm =
    skus.reduce((a, b) => a + b.grossMargin, 0) / Math.max(1, skus.length);
  const risk_score = {
    marginSafety: Math.round(avg_gm >= 0.32 ? 90 : avg_gm >= 0.28 ? 75 : 60),
    oosRisk: Math.round(
      (form.categories.includes("感冒咳嗽") ? 35 : 25) +
        (skus.length > 12 ? 10 : 0)
    ),
    convertRisk: Math.round(
      form.coupon.threshold && form.coupon.threshold > 199 ? 40 : 25
    ),
    advice: [
      ...(avg_gm < 0.28
        ? ["提升利润 SKU 占比：增加毛利≥35%的商品到活动包"]
        : []),
      ...((form.coupon.threshold || 0) > 199
        ? ["降低券门槛至 99/129，提高核销转化"]
        : []),
      ...(form.channels.includes("抖音/快手") &&
      !form.channels.includes("到店（POP/端架）")
        ? ["引流需承接：线下端架与陈列必须到位"]
        : [])
    ]
  };

  return {
    theme: form.name || `${form.goal}·${form.categories[0] || "核心品类"}专场`,
    slogan: "健康到家，省心更省钱",
    timeframe: {
      start,
      end,
      rhythm: dates.map((d, i) => ({
        date: d,
        focus: i === 0 ? "预热上新" : i < 5 ? "主推转化" : "复购唤醒"
      }))
    },
    segments: [
      {
        name: "高频复购（近90天≥3单）",
        rule: "复购人群，推新品券包",
        estUsers: 1800
      },
      {
        name: "慢病老客（高血压/糖尿病）",
        rule: "用药关怀+处方合规提醒",
        estUsers: 1200
      },
      { name: "新客拉新", rule: "首单立减+社群裂变", estUsers: 2600 }
    ],
    skus,
    bundleRules: [
      { name: "止咳+维矿 搭售套装", desc: "提升客单；建议价 ¥39.9" },
      { name: "血压计+试纸 组合包", desc: "利润组合；建议价 ¥199" }
    ],
    couponPlan: `${form.coupon.type}：满${form.coupon.threshold || 99}减${
      form.coupon.value
    }（线上线下同享）`,
    channels,
    storeChecklist: [
      "端架与动线陈列完成（含价签、海报、爆款卡）",
      "晚高峰排班充足，设置引导话术卡片",
      "老客回访清单打印，逐一邀约到店/下单",
      "小票拉新话术：关注企微送券包"
    ],
    staffPlaybook: [
      { role: "店长", tips: ["班前复盘KPI", "检查陈列物料", "跟进社群任务"] },
      {
        role: "店员",
        tips: [
          "三明治推荐：主推-备选-价值",
          "优先推荐高毛利品",
          "复购提醒+搭售"
        ]
      }
    ],
    kpi: {
      baselineSales: base,
      expectedUpliftPct: uplift,
      expectedSales: expected_sales,
      expectedGrossProfit: Math.round(expected_sales * gp_rate),
      guardrail: ["毛利率不低于28%", "券核销率8%-18%", "到店转化≥22%"]
    },
    risks: [
      { risk: "单SKU断货", mitigation: "设置2个等效替代品；每日10:00补货检查" },
      { risk: "低毛利跑量", mitigation: "利润SKU绑定搭售；检查员工推荐话术" },
      { risk: "线上引流不到店", mitigation: "到店专享券+赠品提升吸引" }
    ],
    forecast7d,
    riskScore: risk_score
  };
}

/** ===== API（失败回退） ===== */
export async function fetch_sku_pool() {
  try {
    return await http.request<sku_item[]>(
      "get",
      "/api/ai-strategy/marketing/sku-pool/"
    );
  } catch {
    return mock_sku_pool();
  }
}

export async function gen_marketing_plan(form: campaign_form) {
  try {
    return await http.request<marketing_plan>(
      "post",
      "/api/ai-strategy/marketing/plan/",
      { data: form }
    );
  } catch {
    return mock_plan(form);
  }
}

export async function refine_marketing_plan(
  plan: marketing_plan,
  prompt: string
) {
  try {
    return await http.request<marketing_plan>(
      "post",
      "/api/ai-strategy/marketing/refine/",
      { data: { plan, prompt } }
    );
  } catch {
    const uplift = Math.min(0.35, plan.kpi.expectedUpliftPct + 0.02);
    return {
      ...plan,
      slogan: plan.slogan + " · 升级版",
      kpi: {
        ...plan.kpi,
        expectedUpliftPct: uplift,
        expectedSales: Math.round(plan.kpi.baselineSales * (1 + uplift))
      }
    };
  }
}
