<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { ECharts } from "echarts";
import echarts from "@/plugins/echarts";

defineOptions({
  name: "Dashboard"
});

interface Stat {
  label: string;
  value: number;
  unit: string;
}

const stats: Stat[] = [
  { label: "今日销售额", value: 12600, unit: "元" },
  { label: "新增订单", value: 342, unit: "单" },
  { label: "新增会员", value: 58, unit: "人" },
  { label: "库存预警", value: 8, unit: "项" }
];

const salesChartRef = ref<HTMLDivElement>();
let salesChart: ECharts | null = null;

const categoryChartRef = ref<HTMLDivElement>();
let categoryChart: ECharts | null = null;

onMounted(() => {
  if (salesChartRef.value) {
    salesChart = echarts.init(salesChartRef.value);
    salesChart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
      },
      yAxis: { type: "value" },
      series: [
        {
          type: "line",
          data: [1200, 932, 901, 934, 1290, 1330, 1320],
          smooth: true,
          areaStyle: {}
        }
      ]
    });
  }
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value);
    categoryChart.setOption({
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: [
            { value: 5000, name: "处方药" },
            { value: 3000, name: "OTC" },
            { value: 2000, name: "保健品" },
            { value: 1500, name: "器械" },
            { value: 800, name: "其他" }
          ]
        }
      ]
    });
  }
});

onBeforeUnmount(() => {
  salesChart?.dispose();
  categoryChart?.dispose();
});
</script>

<template>
  <div class="p-6 space-y-6">
    <el-row :gutter="20">
      <el-col
        v-for="item in stats"
        :key="item.label"
        :xs="12"
        :sm="12"
        :lg="6"
        class="mb-4"
      >
        <el-card shadow="never">
          <div class="text-2xl font-semibold">
            {{ item.value }}
            <span class="text-sm ml-1">{{ item.unit }}</span>
          </div>
          <p class="mt-2 text-gray-500">{{ item.label }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="16" class="mb-4">
        <el-card shadow="never">
          <template #header>销售趋势</template>
          <div ref="salesChartRef" style="height: 300px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8" class="mb-4">
        <el-card shadow="never">
          <template #header>品类占比</template>
          <div ref="categoryChartRef" style="height: 300px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
