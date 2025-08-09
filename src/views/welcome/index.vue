<template>
  <div class="p-4 space-y-4">
    <!-- 顶栏：角色切换 + 日期范围 + AI复盘 + 导出 -->
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="text-base font-semibold">首页 · 运营驾驶舱</div>
          <div class="flex items-center gap-3">
            <el-radio-group v-model="role" size="small">
              <el-radio-button label="director">运营总监视角</el-radio-button>
              <el-radio-button label="manager">店长视角</el-radio-button>
            </el-radio-group>

            <el-date-picker
              v-model="dateRange"
              type="daterange"
              unlink-panels
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              :shortcuts="dateShortcuts"
              @change="onDateRangeChange"
            />

            <el-tooltip
              content="基于当前时间范围和权限视角的自动复盘与建议"
              placement="top"
            >
              <el-button
                type="primary"
                :loading="loading.ai"
                @click="onAIAnalyze"
              >
                <i class="i-ep-magic-stick mr-1" /> AI复盘
              </el-button>
            </el-tooltip>

            <el-button :loading="exporting" @click="onExport">
              <i class="i-ep-download mr-1" /> 导出战报
            </el-button>
          </div>
        </div>
      </template>

      <!-- KPI 四卡 -->
      <el-skeleton :loading="loading.topKpis" animated :throttle="200">
        <template #template>
          <el-row :gutter="16">
            <el-col v-for="n in 4" :key="n" :xs="12" :sm="12" :md="6">
              <el-card shadow="never" class="h-full" style="height: 108px" />
            </el-col>
          </el-row>
        </template>
        <template #default>
          <el-row :gutter="16">
            <el-col
              v-for="card in kpiCardsView"
              :key="card.key"
              :xs="12"
              :sm="12"
              :md="6"
            >
              <el-card shadow="never" class="h-full">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-[var(--el-text-color-secondary)] text-sm">
                      {{ card.title }}
                    </div>
                    <div class="text-2xl font-semibold mt-1">
                      {{ formatNumber(card.value) }}
                    </div>
                    <div
                      class="text-xs text-[var(--el-text-color-secondary)] mt-1"
                    >
                      目标：{{ formatNumber(card.target) }}（完成
                      {{
                        ((card.value / Math.max(card.target, 1)) * 100).toFixed(
                          1
                        )
                      }}%）
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-[var(--el-text-color-secondary)]">
                      环比
                    </div>
                    <div
                      :class="[
                        'text-sm font-medium',
                        card.hb >= 0
                          ? 'text-[var(--el-color-success)]'
                          : 'text-[var(--el-color-danger)]'
                      ]"
                    >
                      {{ card.hb >= 0 ? "+" : ""
                      }}{{ (card.hb * 100).toFixed(1) }}%
                    </div>
                    <div class="text-xs text-[var(--el-text-color-secondary)]">
                      同比 {{ card.yb >= 0 ? "+" : ""
                      }}{{ (card.yb * 100).toFixed(1) }}%
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </template>
      </el-skeleton>

      <!-- 运营速报 -->
      <el-alert class="mt-3" :type="aiFlash.type" :closable="false" show-icon>
        <template #title>{{ aiFlash.title }}</template>
        <template #default>{{ aiFlash.brief }}</template>
      </el-alert>
    </el-card>

    <!-- 行2：当日分时 + 近7日 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="text-base font-semibold">当日分时（8:00–22:00）</div>
              <ReSegmented
                :modelValue="hourlyMetric"
                :options="[
                  { label: '销售额', value: 'amount' },
                  { label: '客流', value: 'traffic' },
                  { label: '毛利额', value: 'profit' }
                ]"
                size="small"
                @update:modelValue="
                  val => {
                    hourlyMetric = val as 'amount' | 'traffic' | 'profit';
                    renderDayChart();
                  }
                "
              />
            </div>
          </template>
          <div
            ref="dayChartRef"
            v-loading="loading.hourly"
            class="w-full h-[340px]"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="text-base font-semibold">近7日关键指标</div>
              <el-radio-group v-model="sevenDayMetric" size="small">
                <el-radio-button label="amount">销售额</el-radio-button>
                <el-radio-button label="profit">毛利额</el-radio-button>
                <el-radio-button label="traffic">客流</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div
            ref="sevenChartRef"
            v-loading="loading.seven"
            class="w-full h-[340px]"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 行3：KPI对比 + 龙虎榜 -->
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="text-base font-semibold">
                各门店 KPI 完成度 vs 时间进度
              </div>
              <div class="flex items-center gap-2">
                <el-radio-group v-model="kpiViewMode" size="small">
                  <el-radio-button label="daily">当日</el-radio-button>
                  <el-radio-button label="range">多日</el-radio-button>
                </el-radio-group>
                <el-date-picker
                  v-if="kpiViewMode === 'range'"
                  v-model="kpiRange"
                  type="daterange"
                  unlink-panels
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  @change="loadStores"
                />
              </div>
            </div>
          </template>
          <div
            ref="kpiChartRef"
            v-loading="loading.stores"
            class="w-full h-[400px]"
          />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="text-base font-semibold">任务龙虎榜</div>
              <el-select v-model="rankMetric" size="small" style="width: 140px">
                <el-option label="KPI完成率" value="kpi" />
                <el-option label="任务完成率" value="task" />
                <el-option label="人效(¥/人次)" value="pe" />
              </el-select>
            </div>
          </template>
          <el-table :data="rankList" size="small" height="360">
            <el-table-column prop="rank" label="#" width="52" />
            <el-table-column prop="store" label="门店" min-width="120" />
            <el-table-column
              prop="value"
              :label="rankMetricLabel"
              min-width="120"
            >
              <template #default="{ row }">
                <span v-if="rankMetric === 'kpi'"
                  >{{ (row.value * 100).toFixed(1) }}%</span
                >
                <span v-else-if="rankMetric === 'task'"
                  >{{ (row.value * 100).toFixed(1) }}%</span
                >
                <span v-else>¥{{ formatNumber(row.value) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="variance" label="与目标差" min-width="120">
              <template #default="{ row }">
                <el-tag
                  :type="row.variance >= 0 ? 'success' : 'danger'"
                  effect="plain"
                >
                  {{ row.variance >= 0 ? "+" : ""
                  }}{{
                    rankMetric === "pe"
                      ? "¥" + formatNumber(row.variance)
                      : (row.variance * 100).toFixed(1) + "%"
                  }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 行4：库存风险 / 会员增长 / 员工赋能 -->
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header
            ><div class="text-base font-semibold">库存风险雷达</div></template
          >
          <div ref="invChartRef" class="w-full h-[280px]" />
          <div class="text-xs text-[var(--el-text-color-secondary)] mt-2">
            提示：滞销/即将过期/缺货预警来自近30天销量与当前库存的交叉判断
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header
            ><div class="text-base font-semibold">会员增长与活跃</div></template
          >
          <div ref="vipChartRef" class="w-full h-[280px]" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="text-base font-semibold">员工赋能速览</div>
              <el-link type="primary" @click="onGoTraining">去培训库</el-link>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(t, idx) in staffHints"
              :key="idx"
              :type="t.type"
              >{{ t.text }}</el-timeline-item
            >
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- AI复盘抽屉 -->
    <el-drawer
      v-model="aiVisible"
      size="45%"
      :with-header="true"
      :destroy-on-close="true"
      title="AI复盘"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="text-lg font-semibold">
            AI复盘（{{ role === "director" ? "总监" : "店长" }}视角）
          </div>
          <el-tag v-if="aiResult" type="success">生成成功</el-tag>
        </div>
      </template>

      <div
        v-if="loading.ai"
        class="py-10 flex items-center justify-center text-[var(--el-text-color-secondary)]"
      >
        <el-icon class="is-loading mr-2"><i class="i-ep-loading" /></el-icon>
        正在分析当前时间范围的数据…
      </div>

      <div v-else-if="aiResult" class="space-y-4">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            概览：销售 {{ aiResult.summary.totalSales }}，峰值
            {{ aiResult.summary.peakHour }}，领先门店
            {{ aiResult.summary.bestStore }}。
          </template>
          <template #default>
            KPI平均完成度
            {{ (aiResult.summary.avgCompletion * 100).toFixed(1) }}%， 时间进度
            {{ (aiResult.summary.timeProgress * 100).toFixed(1) }}%。
          </template>
        </el-alert>
        <el-card shadow="never"
          ><template #header>亮点</template>
          <el-timeline
            ><el-timeline-item
              v-for="(h, idx) in aiResult.highlights"
              :key="idx"
              >{{ h }}</el-timeline-item
            ></el-timeline
          >
        </el-card>
        <el-card shadow="never"
          ><template #header>风险</template>
          <el-timeline
            ><el-timeline-item
              v-for="(r, idx) in aiResult.risks"
              :key="idx"
              type="warning"
              >{{ r }}</el-timeline-item
            ></el-timeline
          >
        </el-card>
        <el-card shadow="never"
          ><template #header>可执行建议</template>
          <el-timeline
            ><el-timeline-item
              v-for="(a, idx) in aiResult.actions"
              :key="idx"
              type="success"
              >{{ a }}</el-timeline-item
            ></el-timeline
          >
        </el-card>
      </div>

      <div v-else class="text-[var(--el-text-color-secondary)]">暂无数据</div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  defineOptions,
  reactive
} from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import ReSegmented from "@/components/ReSegmented";
import {
  getTodayKpis,
  getTodayHourly,
  getSevenDays,
  getStoreKpiProgress,
  postAiReview,
  type AiReviewResp,
  type MetricKey
} from "@/api/welcome";

defineOptions({ name: "WelcomeAdmin" });

// —— 类型定义修正 ——
// Element Plus Alert 类型
type AlertType = "success" | "warning" | "error" | "primary" | "info";
// Element Plus Timeline Item 类型
type TimelineType = "success" | "warning" | "primary" | "info" | "danger";
interface StaffHint {
  type: TimelineType;
  text: string;
}

// 角色
const role = ref<"director" | "manager">("director");

// 日期范围（默认近7日）
const today = new Date();
const start7 = new Date(today);
start7.setDate(today.getDate() - 6);
const dateRange = ref<[Date, Date]>([start7, today]);
const dateShortcuts = [
  {
    text: "今日",
    value: () => {
      const s = new Date();
      s.setHours(0, 0, 0, 0);
      const e = new Date();
      e.setHours(23, 59, 59, 999);
      return [s, e];
    }
  },
  {
    text: "近7日",
    value: () => {
      const e = new Date();
      const s = new Date(e);
      s.setDate(e.getDate() - 6);
      return [s, e];
    }
  },
  {
    text: "近30日",
    value: () => {
      const e = new Date();
      const s = new Date(e);
      s.setDate(e.getDate() - 29);
      return [s, e];
    }
  }
];

// ✅ loading 用 reactive，模板内类型为 boolean
const loading = reactive({
  topKpis: false,
  hourly: false,
  seven: false,
  stores: false,
  ai: false
});

// 顶部 KPI
type KpiCard = {
  key: string;
  title: string;
  value: number;
  target: number;
  hb: number;
  yb: number;
};
const kpiCards = ref<Record<string, KpiCard>>({
  amount: { key: "amount", title: "销售额", value: 0, target: 0, hb: 0, yb: 0 },
  profit: { key: "profit", title: "毛利额", value: 0, target: 0, hb: 0, yb: 0 },
  traffic: { key: "traffic", title: "客流", value: 0, target: 0, hb: 0, yb: 0 },
  member: {
    key: "member",
    title: "会员新增",
    value: 0,
    target: 0,
    hb: 0,
    yb: 0
  }
});
const kpiCardsView = computed(() => {
  if (role.value === "manager") {
    return [
      { ...kpiCards.value.amount, title: "本店销售额" },
      { ...kpiCards.value.profit, title: "本店毛利额" },
      { ...kpiCards.value.traffic, title: "本店客流" },
      { ...kpiCards.value.member, title: "本店会员新增" }
    ];
  }
  return Object.values(kpiCards.value);
});

// ✅ aiFlash 指定联合字面量类型，修正 :type 报错
const aiFlash = computed<{ type: AlertType; title: string; brief: string }>(
  () =>
    role.value === "director"
      ? {
          type: "success",
          title: "AI运营速报（总部视角）",
          brief:
            "华南片区领先，A类品类贡献高；建议将“OTC止咳”推广复制至华东片区本周末。"
        }
      : {
          type: "warning",
          title: "AI运营速报（本店视角）",
          brief:
            "晚高峰 18:00-19:00 客流旺，客单价低于片区均值；建议主推高毛利维生素搭售。"
        }
);

// 分时 & 7日
const hours = ref<string[]>([]);
const salesHourly = ref<number[]>([]);
const trafficHourly = ref<number[]>([]);
const profitHourly = ref<number[]>([]);
let hourlyMetric = ref<"amount" | "traffic" | "profit">("amount");

const sevenDays = ref<string[]>([]);
const sevenDayData = ref<{
  amount: number[];
  profit: number[];
  traffic: number[];
  avgTicket: number[];
}>({
  amount: [],
  profit: [],
  traffic: [],
  avgTicket: []
});
const sevenDayMetric = ref<MetricKey>("amount");

// KPI 对比
const kpiViewMode = ref<"daily" | "range">("daily");
const kpiRange = ref<[Date, Date] | null>(null);
const stores = ref<
  {
    store: string;
    target: number;
    current: number;
    type: "daily" | "range";
    start?: string;
    end?: string;
  }[]
>([]);

// 龙虎榜（依据 stores 推导）
const rankMetric = ref<"kpi" | "task" | "pe">("kpi");
const rankMetricLabel = computed(() =>
  rankMetric.value === "kpi"
    ? "KPI完成率"
    : rankMetric.value === "task"
      ? "任务完成率"
      : "人效"
);
const rankList = computed(() => {
  const base = stores.value.slice(0, 6).map(s => {
    const kpi = s.target ? s.current / s.target : 0;
    const task = Math.max(
      0.5,
      Math.min(0.95, kpi + (Math.random() - 0.5) * 0.1)
    );
    const pe = Math.floor(60 + Math.random() * 50);
    return {
      store: s.store,
      kpi,
      task,
      pe,
      target: { kpi: 0.75, task: 0.8, pe: 80 }
    };
  });
  const metric = rankMetric.value;
  const arr = base.map((x, i) => ({
    rank: i + 1,
    store: x.store,
    value: (x as any)[metric],
    variance: (x as any)[metric] - x.target[metric]
  }));
  arr.sort((a, b) => b.value - a.value);
  arr.forEach((x, i) => (x.rank = i + 1));
  return arr;
});

// 员工赋能（示例，含联合类型）
const staffHints = ref<StaffHint[]>([
  {
    type: "success",
    text: "导购A：保健品搭售率低于均值 12%，建议学习《高毛利补充品推荐脚本》"
  },
  {
    type: "warning",
    text: "药师B：抗敏类咨询转化率低，分配专题微课并设置三日复盘"
  },
  {
    type: "primary",
    text: "收银C：会员二次唤醒成功率 15%，建议引入“生日关怀+复购券”模板"
  }
]);

// 工具
function formatNumber(n: number) {
  return n.toLocaleString("zh-CN");
}
function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}
function dayStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function dayEnd(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function calcTimeProgressDaily(now = new Date()) {
  const s = new Date(now);
  s.setHours(8, 0, 0, 0);
  const e = new Date(now);
  e.setHours(22, 0, 0, 0);
  if (now <= s) return 0;
  if (now >= e) return 1;
  return clamp((now.getTime() - s.getTime()) / (e.getTime() - s.getTime()));
}
function calcTimeProgressRange(start: Date, end: Date, now = new Date()) {
  const s = dayStart(start),
    e = dayEnd(end);
  if (now <= s) return 0;
  if (now >= e) return 1;
  const totalDays =
    (dayStart(end).getTime() - dayStart(start).getTime()) / 86400000 + 1;
  const elapsedDays =
    (dayStart(now).getTime() - dayStart(start).getTime()) / 86400000 + 1;
  return clamp(elapsedDays / totalDays);
}

// 图表实例
const dayChartRef = ref<HTMLDivElement | null>(null);
const sevenChartRef = ref<HTMLDivElement | null>(null);
const kpiChartRef = ref<HTMLDivElement | null>(null);
const invChartRef = ref<HTMLDivElement | null>(null);
const vipChartRef = ref<HTMLDivElement | null>(null);
let dayChart: echarts.ECharts | null = null;
let sevenChart: echarts.ECharts | null = null;
let kpiChart: echarts.ECharts | null = null;
let invChart: echarts.ECharts | null = null;
let vipChart: echarts.ECharts | null = null;

// 渲染
function renderDayChart() {
  if (!dayChartRef.value) return;
  if (!dayChart) dayChart = echarts.init(dayChartRef.value);

  const now = new Date();
  const currentHour = now.getHours();
  const idx = Math.min(
    Math.max(currentHour - 8, 0),
    Math.max(hours.value.length - 1, 0)
  );

  const option: echarts.EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["销售额", "客流", "毛利额"] },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: "category", data: hours.value },
    yAxis: [
      {
        type: "value",
        name: hourlyMetric.value === "traffic" ? "人次" : "金额",
        splitLine: { show: true }
      },
      { type: "value", name: "人次", splitLine: { show: false } }
    ],
    series: [
      {
        name: "销售额",
        type: "bar",
        data: salesHourly.value,
        markLine: {
          symbol: "none",
          label: {
            show: true,
            formatter: "当前时刻",
            position: "insideEndTop"
          },
          data: idx >= 0 ? [{ xAxis: idx }] : []
        }
      },
      {
        name: "客流",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: trafficHourly.value
      },
      { name: "毛利额", type: "bar", data: profitHourly.value }
    ]
  };
  dayChart.setOption(option);
}

function renderSevenChart() {
  if (!sevenChartRef.value) return;
  if (!sevenChart) sevenChart = echarts.init(sevenChartRef.value);

  const metric = sevenDayMetric.value;
  const option: echarts.EChartsOption = {
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    legend: { data: ["数值", "平均客单价"] },
    xAxis: { type: "category", data: sevenDays.value },
    yAxis: [
      {
        type: "value",
        name: metric === "traffic" ? "人次" : "金额",
        splitLine: { show: true }
      },
      { type: "value", name: "客单价", splitLine: { show: false } }
    ],
    series: [
      {
        name: "数值",
        type: metric === "traffic" ? "bar" : "line",
        smooth: metric !== "traffic",
        data: sevenDayData.value[metric]
      },
      {
        name: "平均客单价",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: sevenDayData.value.avgTicket
      }
    ]
  };
  sevenChart.setOption(option);
}

function renderKpiChart() {
  if (!kpiChartRef.value) return;
  if (!kpiChart) kpiChart = echarts.init(kpiChartRef.value);

  const names = stores.value.map(s => s.store);
  const completion = stores.value.map(
    s => +(clamp(s.current / Math.max(s.target, 1)) * 100).toFixed(1)
  );
  const timeProg = stores.value.map(s => {
    if (kpiViewMode.value === "daily" || s.type === "daily")
      return +(calcTimeProgressDaily() * 100).toFixed(1);
    const sd =
      kpiRange.value?.[0] ?? (s.start ? new Date(s.start) : new Date());
    const ed = kpiRange.value?.[1] ?? (s.end ? new Date(s.end) : new Date());
    return +(calcTimeProgressRange(sd, ed) * 100).toFixed(1);
  });
  const delta = completion.map((v, i) => +(v - timeProg[i]).toFixed(1));

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (p: any) => {
        const lines = [p[0].axisValue];
        p.forEach((x: any) =>
          lines.push(`${x.marker} ${x.seriesName}: ${x.data}%`)
        );
        return lines.join("<br/>");
      }
    },
    grid: { left: 120, right: 30, top: 20, bottom: 20 },
    legend: { data: ["KPI完成度", "时间进度", "差值(完成-时间)"] },
    xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
    yAxis: { type: "category", data: names },
    series: [
      {
        name: "KPI完成度",
        type: "bar",
        data: completion,
        label: { show: true, position: "right", formatter: "{c}%" }
      },
      {
        name: "时间进度",
        type: "bar",
        data: timeProg,
        label: { show: true, position: "right", formatter: "{c}%" }
      },
      { name: "差值(完成-时间)", type: "line", data: delta }
    ]
  };
  kpiChart.setOption(option);
}

function renderInvChart() {
  if (!invChartRef.value) return;
  if (!invChart) invChart = echarts.init(invChartRef.value);
  invChart.setOption({
    tooltip: {},
    radar: {
      indicator: [
        { name: "滞销", max: 100 },
        { name: "近效期", max: 100 },
        { name: "缺货", max: 100 },
        { name: "高库存", max: 100 },
        { name: "断层价带", max: 100 }
      ]
    },
    series: [
      {
        type: "radar",
        data: [{ value: [62, 34, 48, 70, 28], name: "风险指数" }]
      }
    ]
  });
}

function renderVipChart() {
  if (!vipChartRef.value) return;
  if (!vipChart) vipChart = echarts.init(vipChartRef.value);
  const x = sevenDays.value.length
    ? sevenDays.value
    : ["1", "2", "3", "4", "5", "6", "7"];
  vipChart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    legend: { data: ["新增会员", "活跃会员"] },
    xAxis: { type: "category", data: x },
    yAxis: { type: "value" },
    series: [
      { name: "新增会员", type: "bar", data: [32, 28, 40, 36, 42, 38, 45] },
      {
        name: "活跃会员",
        type: "line",
        smooth: true,
        data: [210, 198, 220, 235, 242, 251, 263]
      }
    ]
  });
}

// ---- 模拟数据（接口失败时回退） ----
function mockKpis() {
  return {
    amount: { value: 812340, target: 900000, hb: 0.08, yb: 0.12 },
    profit: { value: 263420, target: 300000, hb: 0.05, yb: 0.1 },
    traffic: { value: 12632, target: 14000, hb: -0.02, yb: 0.04 },
    member: { value: 612, target: 800, hb: 0.18, yb: 0.22 }
  };
}
function mockHourly() {
  const hs = Array.from({ length: 15 }, (_, i) => `${8 + i}:00`);
  const rnd = () => Math.floor(3000 + Math.random() * 2000);
  return {
    hours: hs,
    sales: hs.map(rnd),
    traffic: hs.map(() => Math.floor(60 + Math.random() * 50)),
    profit: hs.map(() => Math.floor(900 + Math.random() * 600))
  };
}
function mockSeven(metric: "amount" | "profit" | "traffic") {
  const ds = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  });
  const base = metric === "traffic" ? 20000 : 200000;
  return {
    dates: ds,
    values: ds.map(() => Math.floor(base * (0.8 + Math.random() * 0.4))),
    avgTicket: ds.map(() => +(20 + Math.random() * 15).toFixed(1))
  };
}
function mockStores(mode: "daily" | "range") {
  const names = ["门店A", "门店B", "门店C", "门店D", "门店E", "门店F", "门店G"];
  return names.map(n => {
    const t = Math.floor(40000 + Math.random() * 20000);
    const c = Math.floor(t * (0.5 + Math.random() * 0.4));
    return { store: n, target: t, current: c, type: mode };
  });
}
function mockAI(): AiReviewResp {
  return {
    summary: {
      totalSales: "¥812,340",
      peakHour: "18:00",
      bestStore: "门店D",
      avgCompletion: 0.76,
      timeProgress: 0.71
    },
    highlights: [
      "华南片区环比+8%，主因感冒类走强",
      "OTC维生素毛利率高于全品类均值 5.4%",
      "高客单用户占比提升 1.2pct"
    ],
    risks: ["近效期SKU占比上升，需加快促销", "两家门店晚高峰排队超3分钟"],
    actions: [
      "周末促销叠加会员券，引导维生素搭售",
      "门店B增加晚班人手，缩短收银等待",
      "对近效期SKU做临期价签与端架陈列"
    ]
  };
}

// ---- API 调用（带 mock 回退） ----
async function loadTopKpis() {
  loading.topKpis = true;
  try {
    const data = await getTodayKpis();
    kpiCards.value.amount = { key: "amount", title: "销售额", ...data.amount };
    kpiCards.value.profit = { key: "profit", title: "毛利额", ...data.profit };
    kpiCards.value.traffic = { key: "traffic", title: "客流", ...data.traffic };
    kpiCards.value.member = {
      key: "member",
      title: "会员新增",
      ...data.member
    };
  } catch {
    const data = mockKpis();
    kpiCards.value.amount = { key: "amount", title: "销售额", ...data.amount };
    kpiCards.value.profit = { key: "profit", title: "毛利额", ...data.profit };
    kpiCards.value.traffic = { key: "traffic", title: "客流", ...data.traffic };
    kpiCards.value.member = {
      key: "member",
      title: "会员新增",
      ...data.member
    };
  } finally {
    loading.topKpis = false;
  }
}

async function loadHourly() {
  loading.hourly = true;
  try {
    const data = await getTodayHourly();
    hours.value = data.hours;
    salesHourly.value = data.sales;
    trafficHourly.value = data.traffic;
    profitHourly.value = data.profit;
  } catch {
    const data = mockHourly();
    hours.value = data.hours;
    salesHourly.value = data.sales;
    trafficHourly.value = data.traffic;
    profitHourly.value = data.profit;
  } finally {
    renderDayChart();
    loading.hourly = false;
  }
}

async function loadSeven(metric: MetricKey) {
  loading.seven = true;
  try {
    const data = await getSevenDays({ metric });
    sevenDays.value = data.dates;
    sevenDayData.value[metric] = data.values;
    sevenDayData.value.avgTicket = data.avgTicket;
  } catch {
    const data = mockSeven(metric);
    sevenDays.value = data.dates;
    sevenDayData.value[metric] = data.values;
    sevenDayData.value.avgTicket = data.avgTicket;
  } finally {
    renderSevenChart();
    loading.seven = false;
  }
}

async function loadStores() {
  loading.stores = true;
  try {
    const params: any = { mode: kpiViewMode.value };
    if (kpiViewMode.value === "range" && kpiRange.value) {
      params.start = kpiRange.value[0].toISOString().slice(0, 10);
      params.end = kpiRange.value[1].toISOString().slice(0, 10);
    }
    stores.value = await getStoreKpiProgress(params);
  } catch {
    stores.value = mockStores(kpiViewMode.value);
  } finally {
    renderKpiChart();
    loading.stores = false;
  }
}

const aiVisible = ref(false);
const aiResult = ref<AiReviewResp | null>(null);

async function onAIAnalyze() {
  aiVisible.value = true;
  loading.ai = true;
  aiResult.value = null;
  try {
    const [s, e] = dateRange.value;
    aiResult.value = await postAiReview({
      role: role.value,
      start: s.toISOString().slice(0, 10),
      end: e.toISOString().slice(0, 10)
    });
  } catch {
    aiResult.value = mockAI();
  } finally {
    loading.ai = false;
  }
}

// 导出（导出三张主图 PNG）
const exporting = ref(false);
function onExport() {
  exporting.value = true;
  try {
    const charts = [dayChart, sevenChart, kpiChart].filter(
      Boolean
    ) as echarts.ECharts[];
    charts.forEach((c, idx) => {
      const url = c.getDataURL({ pixelRatio: 2, backgroundColor: "#fff" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard_${idx + 1}.png`;
      a.click();
    });
  } finally {
    exporting.value = false;
  }
}

function onGoTraining() {
  // TODO: 跳转你的培训库路由/外链
}

function onDateRangeChange() {
  loadSeven(sevenDayMetric.value);
  if (kpiViewMode.value === "range") loadStores();
}

// 生命周期
function redrawAll() {
  renderDayChart();
  renderSevenChart();
  renderKpiChart();
  renderInvChart();
  renderVipChart();
}

onMounted(async () => {
  await nextTick();
  await Promise.all([
    loadTopKpis(),
    loadHourly(),
    loadSeven("amount"),
    loadStores()
  ]);
  redrawAll();

  const onResize = () => {
    dayChart?.resize();
    sevenChart?.resize();
    kpiChart?.resize();
    invChart?.resize();
    vipChart?.resize();
  };
  window.addEventListener("resize", onResize);

  const interval = setInterval(() => {
    renderDayChart();
    if (kpiViewMode.value === "daily") renderKpiChart();
  }, 60000);

  onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
    clearInterval(interval);
    [dayChart, sevenChart, kpiChart, invChart, vipChart].forEach(c =>
      c?.dispose()
    );
  });
});

watch([sevenDayMetric, role], () => redrawAll());
watch(kpiViewMode, () => loadStores());
</script>

<style scoped>
/* 轻量样式，交给 Element Plus 与主题变量处理 */
</style>
