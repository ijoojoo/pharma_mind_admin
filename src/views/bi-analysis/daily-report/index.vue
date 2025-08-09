<template>
  <div class="p-4 space-y-4">
    <!-- 当日战报（兼容 PureAdmin 6.1.0，无额外 hooks/components 依赖） -->
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="text-base font-semibold">当日战报</div>
          <el-tooltip
            content="基于今日实时数据的自动复盘与可执行建议"
            placement="top"
          >
            <el-button
              type="primary"
              :loading="isAnalyzing"
              @click="onAIAnalyze"
            >
              <i class="i-ep-magic-stick mr-1" /> AI复盘今日
            </el-button>
          </el-tooltip>
        </div>
      </template>

      <!-- KPI 四卡片 -->
      <el-row :gutter="16">
        <el-col
          v-for="card in kpiCards"
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
                  {{ card.hb >= 0 ? "+" : "" }}{{ (card.hb * 100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 当日分时趋势（8:00-22:00）：销售额柱 + 客流折线 + 当前时间标记线 -->
      <div ref="dayChartRef" class="mt-4 w-full h-[360px]" />
    </el-card>

    <!-- 近7日关键指标 -->
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="text-base font-semibold">近7日关键销售指标</div>
          <el-radio-group v-model="sevenDayMetric" size="small">
            <el-radio-button label="amount">销售额</el-radio-button>
            <el-radio-button label="profit">毛利额</el-radio-button>
            <el-radio-button label="traffic">客流</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div ref="sevenChartRef" class="w-full h-[360px]" />
    </el-card>

    <!-- 各门店KPI进度 vs 时间进度 -->
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="text-base font-semibold">
            各门店KPI任务进度（与时间进度对比）
          </div>
          <div class="flex items-center gap-2">
            <el-radio-group v-model="kpiViewMode" size="small">
              <el-radio-button label="daily"
                >当日（8:00-22:00）</el-radio-button
              >
              <el-radio-button label="range">多日</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-if="kpiViewMode === 'range'"
              v-model="rangePicker"
              type="daterange"
              unlink-panels
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              @change="onRangeChange"
            />
          </div>
        </div>
      </template>
      <div ref="kpiChartRef" class="w-full h-[420px]" />
    </el-card>

    <!-- AI复盘抽屉 -->
    <el-drawer
      v-model="aiVisible"
      size="45%"
      :with-header="true"
      :destroy-on-close="true"
      title="AI当日复盘"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="text-lg font-semibold">AI当日复盘</div>
          <el-tag v-if="aiResult" type="success">生成成功</el-tag>
        </div>
      </template>

      <div
        v-if="isAnalyzing"
        class="py-10 flex items-center justify-center text-[var(--el-text-color-secondary)]"
      >
        <el-icon class="is-loading mr-2"><i class="i-ep-loading" /></el-icon>
        正在分析今日数据…
      </div>

      <div v-else-if="aiResult" class="space-y-4">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            今日概览：{{ aiResult.summary.totalSales }} 销售额，峰值时段
            {{ aiResult.summary.peakHour }}，人效最佳门店
            {{ aiResult.summary.bestStore }}。
          </template>
          <template #default>
            KPI平均完成度
            {{ (aiResult.summary.avgCompletion * 100).toFixed(1) }}%，时间进度
            {{ (aiResult.summary.timeProgress * 100).toFixed(1) }}%。
          </template>
        </el-alert>

        <el-card shadow="never">
          <template #header>亮点</template>
          <el-timeline>
            <el-timeline-item
              v-for="(h, idx) in aiResult.highlights"
              :key="idx"
              >{{ h }}</el-timeline-item
            >
          </el-timeline>
        </el-card>

        <el-card shadow="never">
          <template #header>风险</template>
          <el-timeline>
            <el-timeline-item
              v-for="(r, idx) in aiResult.risks"
              :key="idx"
              type="warning"
              >{{ r }}</el-timeline-item
            >
          </el-timeline>
        </el-card>

        <el-card shadow="never">
          <template #header>明日可执行建议</template>
          <el-timeline>
            <el-timeline-item
              v-for="(a, idx) in aiResult.actions"
              :key="idx"
              type="success"
              >{{ a }}</el-timeline-item
            >
          </el-timeline>
        </el-card>
      </div>

      <div v-else class="text-[var(--el-text-color-secondary)]">暂无数据</div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
  nextTick,
  defineOptions
} from "vue";
import * as echarts from "echarts";

defineOptions({ name: "AdminDashboard" });

// ---------------------- 临时数据（可替换为API返回） ----------------------
const kpiCards = ref([
  { key: "amount", title: "今日销售额", value: 152340, hb: 0.12 },
  { key: "profit", title: "今日毛利额", value: 48320, hb: 0.06 },
  { key: "traffic", title: "今日客流", value: 932, hb: -0.03 },
  { key: "member", title: "今日会员新增", value: 47, hb: 0.18 }
]);

// 当日分时数据（8:00 - 22:00）
const hours = Array.from({ length: 15 }, (_, i) => `${8 + i}:00`);
const salesHourly = ref([
  3200, 4100, 3800, 4200, 4600, 5200, 6100, 7400, 6900, 6500, 7100, 7600, 7200,
  6800, 6400
]);
const trafficHourly = ref([
  60, 80, 75, 85, 90, 110, 140, 180, 170, 150, 160, 175, 165, 150, 130
]);

// 近7日数据（日期、销售额、毛利、客流）
const sevenDays = (() => {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return days;
})();

const sevenDayData = ref({
  amount: [21000, 24800, 23200, 30120, 28900, 31500, 33420],
  profit: [6400, 7200, 7000, 8800, 8400, 9020, 9480],
  traffic: [820, 910, 860, 980, 940, 1020, 1080],
  avgTicket: [25.6, 27.2, 26.9, 30.8, 30.7, 30.9, 31.0]
});

// 门店KPI临时数据
const storeKpiRaw = ref([
  { store: "门店A", target: 50000, current: 34000, type: "daily" },
  { store: "门店B", target: 42000, current: 29500, type: "daily" },
  { store: "门店C", target: 38000, current: 23000, type: "daily" },
  {
    store: "门店D",
    target: 45000,
    current: 41000,
    type: "range",
    start: addDays(new Date(), -5),
    end: addDays(new Date(), 1)
  },
  {
    store: "门店E",
    target: 360000,
    current: 210000,
    type: "range",
    start: addDays(new Date(), -10),
    end: addDays(new Date(), 0)
  }
]);

// ---------------------- refs & 实例 ----------------------
const sevenChartRef = ref<HTMLDivElement | null>(null);
const dayChartRef = ref<HTMLDivElement | null>(null);
const kpiChartRef = ref<HTMLDivElement | null>(null);
let sevenChart: echarts.ECharts | null = null;
let dayChart: echarts.ECharts | null = null;
let kpiChart: echarts.ECharts | null = null;

const sevenDayMetric = ref<"amount" | "profit" | "traffic">("amount");
const kpiViewMode = ref<"daily" | "range">("daily");
const rangePicker = ref<[Date, Date] | null>(null);

// AI 抽屉
const aiVisible = ref(false);
const isAnalyzing = ref(false);
const aiResult = ref<null | {
  summary: {
    totalSales: string;
    peakHour: string;
    bestStore: string;
    avgCompletion: number;
    timeProgress: number;
  };
  highlights: string[];
  risks: string[];
  actions: string[];
}>(null);

// ---------------------- 工具函数 ----------------------
function formatNumber(n: number) {
  return n.toLocaleString("zh-CN");
}
function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(d.getDate() + n);
  return x;
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
  const s = dayStart(start);
  const e = dayEnd(end);
  if (now <= s) return 0;
  if (now >= e) return 1;
  const totalDays =
    (dayStart(end).getTime() - dayStart(start).getTime()) / 86400000 + 1;
  const elapsedDays =
    (dayStart(now).getTime() - dayStart(start).getTime()) / 86400000 + 1;
  return clamp(elapsedDays / totalDays);
}

function getStoreTimeProgress(item: any): number {
  if (kpiViewMode.value === "daily" || item.type === "daily")
    return calcTimeProgressDaily();
  const start = rangePicker.value?.[0] ?? (item.start as Date);
  const end = rangePicker.value?.[1] ?? (item.end as Date);
  return calcTimeProgressRange(start, end);
}

function getStoreCompletion(item: any): number {
  return clamp(item.current / item.target);
}

const filteredStores = computed(() =>
  kpiViewMode.value === "daily"
    ? storeKpiRaw.value.filter(s => s.type === "daily")
    : storeKpiRaw.value.filter(s => s.type === "range")
);

function buildKpiSeriesData() {
  const stores = filteredStores.value;
  const names = stores.map(s => s.store);
  const completion = stores.map(s => +(getStoreCompletion(s) * 100).toFixed(1));
  const timeProg = stores.map(s => +(getStoreTimeProgress(s) * 100).toFixed(1));
  return { names, completion, timeProg };
}

// ---------------------- 图表渲染 ----------------------
function renderDayChart() {
  if (!dayChartRef.value) return;
  if (!dayChart) dayChart = echarts.init(dayChartRef.value);

  const now = new Date();
  const currentHour = now.getHours();
  const idx = Math.min(Math.max(currentHour - 8, 0), hours.length - 1);

  const option: echarts.EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["销售额", "客流"] },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: "category", data: hours },
    yAxis: [
      { type: "value", name: "销售额", splitLine: { show: true } },
      { type: "value", name: "客流", splitLine: { show: false } }
    ],
    series: [
      { name: "销售额", type: "bar", data: salesHourly.value },
      {
        name: "客流",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: trafficHourly.value
      }
    ],
    graphic:
      idx >= 0 && idx <= hours.length - 1
        ? [
            {
              type: "line",
              left:
                40 +
                (idx + 0.5) *
                  ((dayChartRef.value!.clientWidth - 60) / hours.length),
              top: 30,
              bottom: 30,
              shape: {},
              style: { stroke: "#999", lineWidth: 1, lineDash: [4, 4] }
            }
          ]
        : []
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
    xAxis: { type: "category", data: sevenDays },
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

  const { names, completion, timeProg } = buildKpiSeriesData();
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
    grid: { left: 100, right: 30, top: 20, bottom: 20 },
    legend: { data: ["KPI完成度", "时间进度"] },
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
      }
    ]
  };
  kpiChart.setOption(option);
}

// ---------------------- AI 复盘（本地模拟逻辑，可替换为后端API） ----------------------
function onAIAnalyze() {
  aiVisible.value = true;
  isAnalyzing.value = true;
  aiResult.value = null;

  setTimeout(() => {
    const total = salesHourly.value.reduce((a, b) => a + b, 0);
    const peakIdx = salesHourly.value.indexOf(Math.max(...salesHourly.value));
    const peakHour = hours[peakIdx];

    const avgCompletion =
      filteredStores.value.reduce((a, s) => a + getStoreCompletion(s), 0) /
      Math.max(filteredStores.value.length, 1);
    const timeProgress =
      kpiViewMode.value === "daily" ? calcTimeProgressDaily() : 0.5;

    const bestStore = ["门店A", "门店B", "门店C"][
      Math.floor(Math.random() * 3)
    ];

    const highlights: string[] = [
      `峰值出现在 ${peakHour}，建议排班加强陈列与引导。`,
      `平均KPI完成度 ${(avgCompletion * 100).toFixed(1)}%，与时间进度 ${(timeProgress * 100).toFixed(1)}% 对比${avgCompletion >= timeProgress ? "领先" : "落后"}。`,
      `客单价近7日平稳，今日客流在 ${hours[Math.max(peakIdx - 1, 0)]} — ${hours[Math.min(peakIdx + 1, hours.length - 1)]} 区间较活跃。`
    ];

    const risks: string[] = [];
    if (avgCompletion < timeProgress)
      risks.push("整体KPI推进落后于时间进度，需在晚高峰前触发加速策略。");
    if (trafficHourly.value[0] < 70)
      risks.push("开店前2小时客流偏弱，建议早时段做低门槛促活。");

    const actions: string[] = [
      "晚高峰（18:00-20:00）执行“关联销售清单”，聚焦高毛利补充品。",
      "对滞后门店推送3条即时任务：端架陈列检查、会员二次唤醒、加购话术演练。",
      "对客单价低的时段设置限时满减/加价购，提升转化。"
    ];

    aiResult.value = {
      summary: {
        totalSales: `¥${formatNumber(total)}`,
        peakHour,
        bestStore,
        avgCompletion,
        timeProgress
      },
      highlights,
      risks,
      actions
    };
    isAnalyzing.value = false;
  }, 800);
}

// ---------------------- 生命周期 & 监听 ----------------------
function redrawAll() {
  renderDayChart();
  renderSevenChart();
  renderKpiChart();
}

onMounted(async () => {
  await nextTick();
  redrawAll();

  const onResize = () => {
    dayChart?.resize();
    sevenChart?.resize();
    kpiChart?.resize();
  };
  window.addEventListener("resize", onResize);

  const interval = setInterval(() => {
    renderDayChart();
    if (kpiViewMode.value === "daily") renderKpiChart();
  }, 60000);

  onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
    clearInterval(interval);
    dayChart?.dispose();
    dayChart = null;
    sevenChart?.dispose();
    sevenChart = null;
    kpiChart?.dispose();
    kpiChart = null;
  });
});

watch(sevenDayMetric, () => renderSevenChart());
watch(kpiViewMode, () => renderKpiChart());
function onRangeChange() {
  renderKpiChart();
}
</script>

<style scoped>
/* 保持与 PureAdmin 6.1.0 的 Element Plus + Tailwind 组合风格一致 */
</style>
