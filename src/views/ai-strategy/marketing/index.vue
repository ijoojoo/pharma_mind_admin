<!-- --- src/views/ai-strategy/marketing/index.vue --- -->
<template>
  <div class="p-4 grid grid-cols-12 gap-4">
    <!-- 左：配置与AI互动 -->
    <el-card class="col-span-12 lg:col-span-5" shadow="hover">
      <template #header>AI 营销策划（引导式）</template>
      <el-form :model="form" label-width="92px">
        <el-form-item label="活动名称">
          <el-input
            v-model="form.name"
            placeholder="如：金秋健康节 · OTC专场"
          />
        </el-form-item>
        <el-form-item label="目标">
          <el-select v-model="form.goal">
            <el-option
              v-for="g in goal_options"
              :key="g"
              :label="g"
              :value="g"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动周期">
          <el-date-picker
            v-model="date_range"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="适用门店">
          <el-select v-model="form.stores" multiple collapse-tags>
            <el-option
              v-for="s in store_options"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算（¥）">
          <el-input-number
            v-model="form.budget"
            :min="0"
            :step="1000"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="目标品类">
          <el-select
            v-model="form.categories"
            multiple
            collapse-tags
            filterable
          >
            <el-option
              v-for="c in category_options"
              :key="c"
              :label="c"
              :value="c"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标人群">
          <el-select
            v-model="form.targetUsers"
            multiple
            collapse-tags
            filterable
          >
            <el-option
              v-for="t in target_options"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优惠方式">
          <div class="flex items-center gap-2">
            <el-select v-model="form.coupon.type" style="width: 120px">
              <el-option label="满减" value="满减" />
              <el-option label="折扣" value="折扣" />
              <el-option label="券包" value="券包" />
              <el-option label="买赠" value="买赠" />
            </el-select>
            <span class="text-xs text-[var(--el-text-color-secondary)]"
              >数值</span
            >
            <el-input-number
              v-model="form.coupon.value"
              :min="0"
              :step="1"
              style="width: 120px"
            />
            <span class="text-xs text-[var(--el-text-color-secondary)]"
              >门槛</span
            >
            <el-input-number
              v-model="form.coupon.threshold"
              :min="0"
              :step="10"
              style="width: 120px"
            />
          </div>
        </el-form-item>

        <el-form-item label="投放渠道">
          <el-select v-model="form.channels" multiple collapse-tags>
            <el-option
              v-for="ch in channel_options"
              :key="ch"
              :label="ch"
              :value="ch"
            />
          </el-select>
        </el-form-item>

        <!-- 渠道节奏 -->
        <el-form-item label="渠道节奏">
          <div class="space-y-2 w-full">
            <div
              v-for="(rh, idx) in channel_rhythm"
              :key="idx"
              class="flex items-center gap-2"
            >
              <span class="w-28">{{ rh.name }}</span>
              <el-input-number
                v-model="rh.preheat"
                :min="0"
                :max="100"
                size="small"
              />
              <span>% 预热</span>
              <el-input-number
                v-model="rh.burst"
                :min="0"
                :max="100"
                size="small"
              />
              <span>% 爆发</span>
              <el-input-number
                v-model="rh.rebound"
                :min="0"
                :max="100"
                size="small"
              />
              <span>% 回补</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="补充说明">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="如：强调高毛利优先曝光；线下端架必须到位…"
          />
        </el-form-item>

        <div class="flex gap-2">
          <el-button
            type="primary"
            :loading="loading"
            @click="() => on_generate()"
            >一键生成</el-button
          >
          <el-button @click="() => on_reset()">重置</el-button>
        </div>

        <el-divider />

        <div>
          <div class="text-sm mb-2 text-[var(--el-text-color-secondary)]">
            和 AI 继续沟通（增量调整）
          </div>
          <el-input
            v-model="refine_prompt"
            type="textarea"
            :rows="2"
            placeholder="如：增加抖音预算；止咳套装加入维C…"
          />
          <div class="mt-2">
            <el-button
              :disabled="!plan"
              :loading="refining"
              @click="() => on_refine()"
              >按上述建议优化方案</el-button
            >
          </div>
        </div>
      </el-form>
    </el-card>

    <!-- 右：商品池 / 方案 / 图表 / 导出 -->
    <div class="col-span-12 lg:col-span-7 space-y-4">
      <!-- 商品池 -->
      <el-card shadow="hover">
        <template #header>商品池筛选与挑选</template>
        <div class="mb-2 flex gap-2 items-end">
          <el-select
            v-model="sku_filter.category"
            placeholder="品类"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="c in category_options"
              :key="c"
              :label="c"
              :value="c"
            />
          </el-select>
          <el-select
            v-model="sku_filter.band"
            placeholder="价格带"
            clearable
            style="width: 120px"
          >
            <el-option label="高" value="高" /><el-option
              label="中"
              value="中"
            /><el-option label="低" value="低" />
          </el-select>
          <el-input-number
            v-model="sku_filter.gmMin"
            :min="0"
            :max="1"
            :step="0.05"
            style="width: 140px"
            placeholder="毛利下限(0~1)"
          />
          <el-input
            v-model="sku_filter.keyword"
            placeholder="关键字"
            style="width: 180px"
            clearable
          />
          <el-button @click="() => refresh_sku_pool()">刷新</el-button>
          <el-button type="primary" @click="() => add_picked()"
            >加入活动包</el-button
          >
          <span class="text-xs text-[var(--el-text-color-secondary)]"
            >已选：{{ picked_skus.length }} 个</span
          >
        </div>
        <el-table
          :data="sku_view"
          border
          size="small"
          height="220"
          @selection-change="(v: any) => (temp_pick = v)"
        >
          <el-table-column type="selection" width="44" />
          <el-table-column prop="name" label="商品" min-width="180" />
          <el-table-column prop="category" label="品类" width="100" />
          <el-table-column prop="price" label="价格" width="90" />
          <el-table-column label="毛利率" width="90">
            <template #default="{ row }"
              >{{ (row.grossMargin * 100).toFixed(0) }}%</template
            >
          </el-table-column>
          <el-table-column prop="band" label="价格带" width="80" />
          <el-table-column
            prop="tags"
            label="标签"
            min-width="120"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <el-tag
                v-for="t in row.tags || []"
                :key="t"
                type="info"
                size="small"
                effect="plain"
                >{{ t }}</el-tag
              >
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 方案概览 -->
      <el-card shadow="hover">
        <template #header>方案概览</template>
        <div v-if="!plan" class="text-[var(--el-text-color-secondary)]">
          生成后在此展示完整方案。
        </div>
        <template v-else>
          <div class="text-xl font-semibold">{{ plan.theme }}</div>
          <div class="text-[var(--el-text-color-secondary)] mt-1">
            {{ plan.slogan }}
          </div>
          <div class="mt-2 text-sm">
            周期：{{ plan.timeframe.start }} 至 {{ plan.timeframe.end }}
          </div>

          <el-alert type="success" :closable="false" show-icon class="mt-3">
            <template #default>
              预期提升
              <b>{{ Math.round(plan.kpi.expectedUpliftPct * 100) }}%</b>；
              目标销售 <b>¥{{ fmt(plan.kpi.expectedSales) }}</b
              >， 目标毛利 <b>¥{{ fmt(plan.kpi.expectedGrossProfit) }}</b
              >； 底线：{{ plan.kpi.guardrail.join("、") }}
            </template>
          </el-alert>

          <!-- 风控评分 -->
          <div class="mt-3 grid grid-cols-3 gap-3">
            <el-card shadow="never"
              ><div class="text-sm">毛利安全度</div>
              <div class="text-2xl font-semibold mt-1">
                {{ plan.riskScore?.marginSafety ?? 80 }}
              </div></el-card
            >
            <el-card shadow="never"
              ><div class="text-sm">断货风险</div>
              <div class="text-2xl font-semibold mt-1">
                {{ plan.riskScore?.oosRisk ?? 30 }}
              </div></el-card
            >
            <el-card shadow="never"
              ><div class="text-sm">转化风险</div>
              <div class="text-2xl font-semibold mt-1">
                {{ plan.riskScore?.convertRisk ?? 28 }}
              </div></el-card
            >
          </div>
          <el-alert
            v-if="plan.riskScore?.advice?.length"
            type="warning"
            :closable="false"
            show-icon
            class="mt-2"
          >
            <template #default
              ><div v-for="(a, idx) in plan.riskScore!.advice" :key="idx">
                • {{ a }}
              </div></template
            >
          </el-alert>
        </template>
      </el-card>

      <!-- SKU 与促销 -->
      <el-card v-if="plan" shadow="hover">
        <template #header>活动商品包（{{ plan.skus.length }}）与促销</template>
        <el-table :data="plan.skus" border size="small">
          <el-table-column prop="name" label="商品" min-width="180" />
          <el-table-column prop="spec" label="规格" width="100" />
          <el-table-column prop="role" label="角色" width="90">
            <template #default="{ row }">
              <el-tag :type="role_type(row.role)" size="small" effect="plain">{{
                row.role
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="价格(¥)" width="100" />
          <el-table-column label="毛利率" width="90">
            <template #default="{ row }"
              >{{ (row.grossMargin * 100).toFixed(0) }}%</template
            >
          </el-table-column>
        </el-table>
        <div class="mt-3">
          <div class="font-medium">促销与搭售</div>
          <ul class="list-disc pl-5 text-sm">
            <li v-for="b in plan.bundleRules" :key="b.name">
              {{ b.name }}：{{ b.desc }}
            </li>
          </ul>
          <div class="mt-2 text-sm">优惠方案：{{ plan.couponPlan }}</div>
        </div>
      </el-card>

      <!-- 渠道预算 + 饼图 -->
      <el-card v-if="plan" shadow="hover">
        <template #header>渠道与预算</template>
        <div class="grid grid-cols-2 gap-4">
          <el-table :data="plan.channels" size="small" border>
            <el-table-column prop="name" label="渠道" width="150" />
            <el-table-column prop="budget" label="预算(¥)" width="120" />
            <el-table-column prop="desc" label="策略" />
          </el-table>
          <div ref="pie_ref" style="width: 100%; height: 240px" />
        </div>
      </el-card>

      <!-- 7日预测 -->
      <el-card v-if="plan" shadow="hover">
        <template #header>7日预测（销量/毛利）</template>
        <div ref="line_ref" style="width: 100%; height: 280px" />
      </el-card>

      <!-- 物料导出 -->
      <el-card v-if="plan" shadow="hover">
        <template #header>物料快速输出（海报/价签PNG）</template>
        <PosterLite
          :title="plan.theme"
          :period="`${plan.timeframe.start} 至 ${plan.timeframe.end}`"
          :coupon="plan.couponPlan"
          :skus="
            plan.skus.slice(0, 6).map(s => ({ name: s.name, price: s.price }))
          "
        />
      </el-card>

      <!-- 导出与复制 -->
      <div v-if="plan" class="flex items-center gap-2">
        <el-button @click="() => on_export_markdown()">导出 Markdown</el-button>
        <el-button type="primary" plain @click="() => on_copy_summary()"
          >复制摘要</el-button
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick, computed } from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import PosterLite from "@/components/PosterLite/index.vue";
import type {
  campaign_form,
  marketing_plan,
  campaign_goal,
  channel,
  sku_item
} from "@/api/ai-strategy/marketing";
import {
  gen_marketing_plan,
  refine_marketing_plan,
  fetch_sku_pool
} from "@/api/ai-strategy/marketing";

/** 选项 */
const goal_options: campaign_goal[] = [
  "动销清库存",
  "拉新促活",
  "提升客单",
  "冲高毛利",
  "节日主题"
];
const store_options = [
  { label: "门店A", value: "A" },
  { label: "门店B", value: "B" },
  { label: "门店C", value: "C" },
  { label: "门店D", value: "D" }
];
const category_options = [
  "感冒咳嗽",
  "维矿",
  "血压计",
  "血糖仪",
  "皮肤用药",
  "肠胃用药"
];
const target_options = [
  "复购客",
  "新客",
  "高血压",
  "糖尿病",
  "母婴人群",
  "高客单偏好"
];
const channel_options: channel[] = [
  "到店（POP/端架）",
  "社群/企微",
  "小程序/APP",
  "抖音/快手",
  "本地团长",
  "外卖平台"
];

/** 表单 */
const form = reactive<campaign_form>({
  name: "",
  goal: "提升客单",
  daterange: ["2025-08-10", "2025-08-16"],
  stores: ["A", "B"],
  budget: 20000,
  categories: ["感冒咳嗽", "维矿"],
  targetUsers: ["复购客", "高血压"],
  coupon: { type: "满减", value: 20, threshold: 99 },
  channels: ["到店（POP/端架）", "社群/企微"],
  notes: ""
});
const date_range = ref<[Date, Date]>([
  new Date(form.daterange[0]),
  new Date(form.daterange[1])
]);
watch(date_range, v => {
  if (v?.length === 2)
    form.daterange = [
      v[0].toISOString().slice(0, 10),
      v[1].toISOString().slice(0, 10)
    ];
});

/** 渠道节奏 */
const channel_rhythm = reactive<
  Array<{ name: channel; preheat: number; burst: number; rebound: number }>
>(form.channels.map(ch => ({ name: ch, preheat: 20, burst: 60, rebound: 20 })));
watch(
  () => form.channels.slice(),
  chs => {
    (channel_rhythm as any).length = 0;
    chs.forEach(ch =>
      channel_rhythm.push({ name: ch, preheat: 20, burst: 60, rebound: 20 })
    );
  }
);

/** 商品池 */
const sku_pool = ref<sku_item[]>([]);
const sku_filter = reactive<{
  category?: string;
  band?: "高" | "中" | "低";
  gmMin?: number;
  keyword?: string;
}>({});
const sku_view = computed(() => {
  return sku_pool.value.filter(s => {
    if (sku_filter.category && s.category !== sku_filter.category) return false;
    if (sku_filter.band && s.band !== sku_filter.band) return false;
    if (sku_filter.gmMin && s.grossMargin < sku_filter.gmMin) return false;
    if (
      sku_filter.keyword &&
      !`${s.name}${s.spec}`.includes(sku_filter.keyword)
    )
      return false;
    return true;
  });
});
const temp_pick = ref<sku_item[]>([]);
const picked_skus = ref<sku_item[]>([]);
function add_picked() {
  const map = new Map<string, sku_item>();
  picked_skus.value.forEach(x => map.set(x.id, x));
  temp_pick.value.forEach(x => map.set(x.id, x));
  picked_skus.value = Array.from(map.values());
  ElMessage.success(`已加入 ${temp_pick.value.length} 个SKU到活动包`);
}

/** 生成/优化 */
const loading = ref(false);
const refining = ref(false);
const refine_prompt = ref("");
const plan = ref<marketing_plan | null>(null);
const fmt = (n: number) => Number(n).toLocaleString("zh-CN");
function role_type(r: any) {
  return r === "利润"
    ? "success"
    : r === "引流"
      ? "primary"
      : r === "搭售"
        ? "warning"
        : "info";
}

async function on_generate() {
  loading.value = true;
  try {
    form.pickedSkus = picked_skus.value;
    form.channelRhythm = channel_rhythm;
    const p = await gen_marketing_plan(form);
    plan.value = p;
    await nextTick();
    render_charts();
    ElMessage.success("方案已生成");
  } finally {
    loading.value = false;
  }
}

async function on_refine() {
  if (!plan.value || !refine_prompt.value)
    return ElMessage.warning("请先生成方案并输入优化建议");
  refining.value = true;
  try {
    const p = await refine_marketing_plan(plan.value, refine_prompt.value);
    plan.value = p;
    await nextTick();
    render_charts();
    ElMessage.success("方案已优化");
  } finally {
    refining.value = false;
  }
}

function on_reset() {
  plan.value = null;
  refine_prompt.value = "";
  picked_skus.value = [];
}

/** 图表 */
const line_ref = ref<HTMLDivElement | null>(null);
const pie_ref = ref<HTMLDivElement | null>(null);
let line_chart: echarts.ECharts | null = null;
let pie_chart: echarts.ECharts | null = null;

function render_charts() {
  if (!plan.value) return;
  if (line_ref.value) {
    line_chart?.dispose();
    line_chart = echarts.init(line_ref.value);
    line_chart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: ["销售额", "毛利"] },
      grid: { left: 30, right: 20, top: 30, bottom: 30 },
      xAxis: { type: "category", data: plan.value.forecast7d.map(x => x.date) },
      yAxis: { type: "value" },
      series: [
        {
          name: "销售额",
          type: "line",
          smooth: true,
          data: plan.value.forecast7d.map(x => x.sales)
        },
        {
          name: "毛利",
          type: "bar",
          data: plan.value.forecast7d.map(x => x.gross)
        }
      ]
    });
  }
  if (pie_ref.value) {
    pie_chart?.dispose();
    pie_chart = echarts.init(pie_ref.value);
    pie_chart.setOption({
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          data: plan.value.channels.map(c => ({
            name: c.name,
            value: c.budget
          })),
          label: { formatter: "{b}\n{d}%" }
        }
      ]
    });
  }
}

/** 导出与复制 */
function to_markdown(p: marketing_plan) {
  const sku_lines = p.skus
    .map(
      s =>
        `- ${s.name}（${s.spec}）｜角色：${s.role}｜价：¥${s.price}｜毛利：${(s.grossMargin * 100).toFixed(0)}%`
    )
    .join("\n");
  const bundle = p.bundleRules.map(b => `- ${b.name}：${b.desc}`).join("\n");
  const channels = p.channels
    .map(c => `- ${c.name}：预算 ¥${fmt(c.budget)}｜策略：${c.desc}`)
    .join("\n");
  const segments = p.segments
    .map(s => `- ${s.name}（约${s.estUsers}人）：${s.rule}`)
    .join("\n");
  const risks = p.risks
    .map(r => `- ${r.risk}｜兜底：${r.mitigation}`)
    .join("\n");
  return `# ${p.theme}
> ${p.slogan}

**周期**：${p.timeframe.start} ～ ${p.timeframe.end}

## KPI 目标
- 预期提升：${Math.round(p.kpi.expectedUpliftPct * 100)}%
- 目标销售：¥${fmt(p.kpi.expectedSales)}
- 目标毛利：¥${fmt(p.kpi.expectedGrossProfit)}
- 底线：${p.kpi.guardrail.join("、")}

## 人群细分
${segments}

## 核心SKU与促销
${sku_lines}

**促销与搭售**
${bundle}

**优惠方案**：${p.couponPlan}

## 渠道与预算
${channels}

## 门店执行清单
${p.storeChecklist.map(x => `- ${x}`).join("\n")}

## 员工作战手册
- 店长：${p.staffPlaybook.find(x => x.role === "店长")?.tips.join("、")}
- 店员：${p.staffPlaybook.find(x => x.role === "店员")?.tips.join("、")}

## 风险与兜底
${risks}
`;
}
function on_export_markdown() {
  if (!plan.value) return;
  const md = to_markdown(plan.value);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plan.value.theme}.md`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("已导出 Markdown");
}
async function on_copy_summary() {
  if (!plan.value) return;
  const p = plan.value;
  const text = `【${p.theme}】${p.timeframe.start}～${p.timeframe.end}；提升≈${Math.round(p.kpi.expectedUpliftPct * 100)}%，目标销售¥${fmt(p.kpi.expectedSales)}，毛利¥${fmt(p.kpi.expectedGrossProfit)}；渠道：${p.channels.map(x => x.name).join("、")}；优惠：${p.couponPlan}`;
  await navigator.clipboard.writeText(text);
  ElMessage.success("摘要已复制");
}

/** 初始化 */
async function refresh_sku_pool() {
  sku_pool.value = await fetch_sku_pool();
}
onMounted(async () => {
  await refresh_sku_pool();
  await on_generate();
});
</script>
