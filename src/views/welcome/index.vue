<template>
  <div class="p-4 grid grid-cols-12 gap-4">
    <!-- 视角切换 -->
    <el-row class="col-span-12">
      <el-col :span="24">
        <el-radio-group v-model="view" size="small">
          <el-radio-button label="operation">运营视角</el-radio-button>
          <el-radio-button label="store">店长视角</el-radio-button>
        </el-radio-group>
      </el-col>
    </el-row>

    <!-- KPI 数据统计 -->
    <el-row :gutter="12" class="col-span-12">
      <el-col v-for="c in cards" :key="c.key" :xs="12" :sm="8" :md="6" :lg="4">
        <el-card shadow="hover" class="mb-3">
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            {{ c.label }}
          </div>
          <div class="text-2xl font-semibold mt-1">
            <span v-if="c.unit === '¥'">¥</span>{{ format_num(c.value) }}
          </div>
          <div class="mt-1">
            <el-tag
              size="small"
              :type="c.diffPct && c.diffPct >= 0 ? 'success' : 'danger'"
              effect="plain"
            >
              {{
                (c.diffPct! >= 0 ? "↑" : "↓") +
                Math.abs(Math.round(c.diffPct! * 100))
              }}%
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- AI 运营速报 -->
    <el-card class="col-span-12" shadow="hover">
      <template #header>AI 运营速报</template>
      <el-alert :type="ai_flash.type" :closable="false" show-icon>
        <template #default>{{ ai_flash.text }}</template>
      </el-alert>
    </el-card>

    <!-- 7日/当月关键指标趋势 -->
    <el-card class="col-span-12 lg:col-span-7" shadow="hover">
      <template #header>7日/当月关键指标趋势</template>
      <div ref="chart_ref" style="width: 100%; height: 320px" />
    </el-card>

    <!-- KPI 完成进度 vs 时间进度 -->
    <el-card class="col-span-12 lg:col-span-5" shadow="hover">
      <template #header>各门店 KPI 进度（对比时间进度）</template>
      <el-table :data="store_progress" size="small" border height="320">
        <el-table-column prop="store_name" label="门店" width="120" />
        <el-table-column prop="kpi_name" label="KPI" width="100" />
        <el-table-column label="目标/已完成" width="150">
          <template #default="{ row }"
            >¥{{ format_num(row.actual_value) }} / ¥{{
              format_num(row.target_value)
            }}</template
          >
        </el-table-column>
        <el-table-column label="完成进度">
          <template #default="{ row }">
            <el-progress :percentage="row.progress_pct" :stroke-width="12" />
          </template>
        </el-table-column>
        <el-table-column label="时间进度" width="140">
          <template #default="{ row }">
            <el-progress
              :percentage="time_progress_pct(row)"
              :stroke-width="12"
              status="success"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 任务龙虎榜 -->
    <el-card class="col-span-12" shadow="hover">
      <template #header>任务龙虎榜</template>
      <el-table :data="task_ranking" size="small" border height="320">
        <el-table-column prop="store_name" label="门店" width="120" />
        <el-table-column prop="task_name" label="任务" width="120" />
        <el-table-column label="完成率" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.complete_pct" :stroke-width="12" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 库存风险雷达 -->
    <el-card class="col-span-12" shadow="hover">
      <template #header>库存风险雷达</template>
      <div ref="inventory_radar_ref" style="width: 100%; height: 300px" />
    </el-card>

    <!-- 会员增长与活跃情况 -->
    <el-card class="col-span-12" shadow="hover">
      <template #header>会员增长与活跃</template>
      <div ref="membership_ref" style="width: 100%; height: 300px" />
    </el-card>

    <!-- 员工赋能速览 -->
    <el-card class="col-span-12" shadow="hover">
      <template #header>员工赋能速览</template>
      <el-alert :type="employee_flash.type" :closable="false" show-icon>
        <template #default>{{ employee_flash.text }}</template>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";

// 模拟数据
const cards = ref([
  { key: "sales", label: "销售额", value: 123456, unit: "¥", diffPct: 0.05 },
  { key: "gross", label: "毛利额", value: 65432, unit: "¥", diffPct: -0.03 },
  { key: "traffic", label: "客流量", value: 7890, diffPct: 0.08 },
  { key: "orders", label: "订单数", value: 2345, diffPct: 0.02 }
]);

const ai_flash = ref({
  type: "info",
  text: "加载中…"
});

const store_progress = ref([
  {
    store_name: "门店A",
    kpi_name: "销售额",
    target_value: 150000,
    actual_value: 120000,
    progress_pct: 80,
    period: "day",
    start: "2023-01-01",
    end: "2023-01-01"
  },
  {
    store_name: "门店B",
    kpi_name: "客流量",
    target_value: 5000,
    actual_value: 4500,
    progress_pct: 90,
    period: "day",
    start: "2023-01-01",
    end: "2023-01-01"
  }
]);

const task_ranking = ref([
  { store_name: "门店A", task_name: "任务1", complete_pct: 80, diff: 5 },
  { store_name: "门店B", task_name: "任务2", complete_pct: 95, diff: -3 }
]);

const inventory_radar_data = ref([70, 50, 30, 80, 60]);

const membership_data = ref([
  { date: "2023-01-01", new_members: 100, active_members: 50 },
  { date: "2023-01-02", new_members: 120, active_members: 60 }
]);

const employee_flash = ref({
  type: "info",
  text: "员工提升建议：增加关联销售。"
});

const chart_ref = ref<HTMLDivElement | null>(null);
const inventory_radar_ref = ref<HTMLDivElement | null>(null);
const membership_ref = ref<HTMLDivElement | null>(null);

let chart: echarts.ECharts | null = null;
let inventory_radar: echarts.ECharts | null = null;
let membership_chart: echarts.ECharts | null = null;

const format_num = (n: number) => Number(n).toLocaleString("zh-CN");

function time_progress_pct(row: any) {
  const now = new Date();
  const start = new Date(row.start);
  const end = new Date(row.end);
  const day_start = new Date(now);
  day_start.setHours(8, 0, 0, 0);
  const day_end = new Date(now);
  day_end.setHours(22, 0, 0, 0);
  const num = Math.max(
    0,
    Math.min(
      1,
      (now.getTime() - day_start.getTime()) /
        Math.max(1, day_end.getTime() - day_start.getTime())
    )
  );
  return Math.round(num * 100);
}

function render_chart() {
  if (!chart_ref.value) return;
  chart?.dispose();
  chart = echarts.init(chart_ref.value);
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["销售额", "毛利", "客流", "订单"] },
    grid: { left: 30, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: "category",
      data: ["2023-01-01", "2023-01-02", "2023-01-03"]
    },
    yAxis: [
      { type: "value", name: "金额" },
      { type: "value", name: "人次" }
    ],
    series: [
      {
        name: "销售额",
        type: "line",
        smooth: true,
        data: [100000, 120000, 130000]
      },
      { name: "毛利", type: "bar", yAxisIndex: 0, data: [50000, 60000, 70000] },
      { name: "客流", type: "line", yAxisIndex: 1, data: [4000, 4500, 5000] },
      { name: "订单", type: "line", yAxisIndex: 1, data: [1000, 1200, 1400] }
    ]
  });
}

function render_inventory_radar() {
  if (!inventory_radar_ref.value) return;
  inventory_radar?.dispose();
  inventory_radar = echarts.init(inventory_radar_ref.value);
  inventory_radar.setOption({
    tooltip: { trigger: "item" },
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
        name: "库存风险",
        type: "radar",
        data: [
          {
            value: inventory_radar_data.value,
            name: "风险数据"
          }
        ]
      }
    ]
  });
}

function render_membership_chart() {
  if (!membership_ref.value) return;
  membership_chart?.dispose();
  membership_chart = echarts.init(membership_ref.value);
  membership_chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["新增会员", "活跃会员"] },
    xAxis: { type: "category", data: membership_data.value.map(x => x.date) },
    yAxis: { type: "value" },
    series: [
      {
        name: "新增会员",
        type: "bar",
        data: membership_data.value.map(x => x.new_members)
      },
      {
        name: "活跃会员",
        type: "line",
        data: membership_data.value.map(x => x.active_members)
      }
    ]
  });
}

onMounted(async () => {
  try {
    await nextTick();
    render_chart();
    render_inventory_radar();
    render_membership_chart();
  } catch (e) {
    ElMessage.error("首页数据加载失败");
  }
});
</script>

<style scoped>
.welcome-page {
  padding: 16px;
}
.hover-card {
  transition: all 0.3s;
}
.hover-card:hover {
  transform: translateY(-3px);
}
</style>
