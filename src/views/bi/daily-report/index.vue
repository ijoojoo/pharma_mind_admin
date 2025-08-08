<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { ElMessage } from "element-plus";
import { useECharts } from "@pureadmin/utils";
import {
  getDailySummary,
  getHourlySalesTrend,
  getStoreSalesRanking,
  requestAIDailyAnalysis
} from "@/api/bi";
import type {
  DailySummaryMetrics,
  HourlySalesTrend,
  StoreSalesRanking
} from "@/api/bi";

defineOptions({
  name: "DailyReport"
});

// --- 响应式状态定义 ---
const loading = reactive({
  summary: true,
  trend: true,
  ranking: true
});

const summaryData = ref<DailySummaryMetrics>({
  totalSales: 0,
  totalProfit: 0,
  customerCount: 0,
  avgOrderValue: 0,
  kpiProgress: 0
});

// --- 核心修改：为每个图表创建 ref 并分别初始化 useECharts ---
const salesTrendChartRef = ref<HTMLDivElement | null>(null);
const storeRankingChartRef = ref<HTMLDivElement | null>(null);
const { setOptions: setSalesTrendOptions } = useECharts(salesTrendChartRef);
const { setOptions: setStoreRankingOptions } = useECharts(storeRankingChartRef);
// --- 修改结束 ---

const aiReportVisible = ref(false);
const aiReportContent = ref("");
const aiLoading = ref(false);

// --- 核心业务逻辑 ---

const fetchSummaryData = async () => {
  loading.summary = true;
  try {
    // const { data } = await getDailySummary();
    // summaryData.value = data;
    // --- 模拟数据 ---
    await new Promise(resolve => setTimeout(resolve, 300));
    summaryData.value = {
      totalSales: 12853.21,
      totalProfit: 4588.67,
      customerCount: 256,
      avgOrderValue: 50.21,
      kpiProgress: 75.6
    };
  } catch (error) {
    ElMessage.error("获取核心指标失败");
  } finally {
    loading.summary = false;
  }
};

const initSalesTrendChart = async () => {
  loading.trend = true;
  try {
    // const { data } = await getHourlySalesTrend();
    // --- 模拟数据 ---
    await new Promise(resolve => setTimeout(resolve, 500));
    const data: HourlySalesTrend = {
      hours: [
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00"
      ],
      sales: [320, 532, 801, 934, 1290, 1330, 1320, 1100, 980, 750]
    };

    // --- 核心修改：使用 setOptions 来设置图表 ---
    setSalesTrendOptions({
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: data.hours },
      yAxis: { type: "value" },
      series: [{ data: data.sales, type: "line", smooth: true }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true }
    });
    // --- 修改结束 ---
  } catch (error) {
    ElMessage.error("加载销售趋势图失败");
  } finally {
    loading.trend = false;
  }
};

const initStoreRankingChart = async () => {
  loading.ranking = true;
  try {
    // const { data } = await getStoreSalesRanking();
    // --- 模拟数据 ---
    await new Promise(resolve => setTimeout(resolve, 700));
    const data: StoreSalesRanking = {
      storeNames: ["中心店", "涧西店", "西工店", "老城店", "洛龙店"],
      sales: [4200, 3500, 2800, 2100, 1500]
    };

    // --- 核心修改：使用 setOptions 来设置图表 ---
    setStoreRankingOptions({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      yAxis: {
        type: "category",
        data: data.storeNames.reverse(),
        axisLabel: { interval: 0 }
      },
      xAxis: { type: "value" },
      series: [{ data: data.sales.reverse(), type: "bar" }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true }
    });
    // --- 修改结束 ---
  } catch (error) {
    ElMessage.error("加载门店排名图失败");
  } finally {
    loading.ranking = false;
  }
};

const handleAIAnalysis = async () => {
  aiLoading.value = true;
  aiReportVisible.value = true;
  try {
    // const { data } = await requestAIDailyAnalysis();
    // aiReportContent.value = data.report;
    // --- 模拟数据 ---
    await new Promise(resolve => setTimeout(resolve, 1500));
    aiReportContent.value =
      "今日销售额12,853.21元，完成日度KPI的75.6%，表现良好。销售高峰集中在12:00-15:00，建议在此期间加强人员配备。中心店销售额遥遥领先，可总结其成功经验向其他门店推广。洛龙店销售额偏低，建议关注其客流和客单价情况，并考虑开展针对性营销活动。";
  } catch (error) {
    ElMessage.error("AI分析失败，请稍后重试");
    aiReportVisible.value = false;
  } finally {
    aiLoading.value = false;
  }
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchSummaryData();
  initSalesTrendChart();
  initStoreRankingChart();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- 页面标题与AI分析按钮 -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">当日战报</h1>
      <el-button type="primary" @click="handleAIAnalysis">AI复盘今日</el-button>
    </div>

    <!-- 核心指标统计 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="never">
          <el-row :gutter="20" class="flex items-center">
            <el-col :xs="12" :sm="12" :md="4.8" class="text-center mb-4 md:mb-0"
              ><el-statistic
                title="总销售额 (元)"
                :value="summaryData.totalSales"
            /></el-col>
            <el-col :xs="12" :sm="12" :md="4.8" class="text-center mb-4 md:mb-0"
              ><el-statistic
                title="总毛利额 (元)"
                :value="summaryData.totalProfit"
            /></el-col>
            <el-col :xs="12" :sm="12" :md="4.8" class="text-center mb-4 md:mb-0"
              ><el-statistic
                title="总客单数"
                :value="summaryData.customerCount"
            /></el-col>
            <el-col :xs="12" :sm="12" :md="4.8" class="text-center"
              ><el-statistic
                title="平均客单价 (元)"
                :value="summaryData.avgOrderValue"
            /></el-col>
            <el-col :xs="24" :sm="24" :md="4.8" class="flex justify-center">
              <div>
                <div class="text-sm text-gray-500 mb-2">日度KPI进度</div>
                <el-progress
                  type="dashboard"
                  :percentage="summaryData.kpiProgress"
                />
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12" class="mb-4 md:mb-0">
        <el-card v-loading="loading.trend" shadow="never">
          <template #header><div>分时销售趋势</div></template>
          <div ref="salesTrendChartRef" style="height: 300px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card v-loading="loading.ranking" shadow="never">
          <template #header><div>门店销售额排名</div></template>
          <div ref="storeRankingChartRef" style="height: 300px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- AI分析报告弹窗 -->
    <el-dialog
      v-model="aiReportVisible"
      title="AI当日战报分析"
      width="600px"
      draggable
    >
      <div v-loading="aiLoading" class="p-4 min-h-[150px]">
        <p class="text-base leading-relaxed">{{ aiReportContent }}</p>
      </div>
      <template #footer>
        <el-button @click="aiReportVisible = false">关闭</el-button>
        <el-button type="primary">继续对话</el-button>
      </template>
    </el-dialog>
  </div>
</template>
