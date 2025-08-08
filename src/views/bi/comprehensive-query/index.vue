<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { ElMessage } from "element-plus";
import { getComprehensiveData } from "@/api/bi";
import type { ComprehensiveDataRow } from "@/api/bi";
// 假设您有一个获取门店列表的API，用于下拉选择
// import { getStoreList } from "@/api/store";

defineOptions({
  name: "ComprehensiveQuery"
});

// --- 类型定义 ---
interface TableColumn {
  label: string;
  prop?: string;
  minWidth?: number;
  width?: number;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
  slot?: string;
}
type TableColumnList = TableColumn[];

// --- 响应式状态定义 ---
const loading = ref(true);
const tableData = ref<ComprehensiveDataRow[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1
});

const form = reactive({
  dateRange: null,
  storeIds: []
});

const storeList = ref([]); // 用于存放门店下拉列表

// --- 表格列定义 ---
const columns: TableColumnList = [
  { label: "日期", prop: "date", width: 120, fixed: "left" },
  { label: "门店名称", prop: "storeName", minWidth: 180 },
  { label: "销售额 (元)", prop: "sales", minWidth: 150, align: "right" },
  { label: "毛利额 (元)", prop: "profit", minWidth: 150, align: "right" },
  { label: "毛利率 (%)", prop: "profitMargin", minWidth: 120, align: "right" },
  { label: "客流", prop: "customerCount", minWidth: 100, align: "right" },
  { label: "客单价 (元)", prop: "avgOrderValue", minWidth: 150, align: "right" }
];

// --- 核心业务逻辑 ---
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      page_size: pagination.pageSize,
      start_date: form.dateRange?.[0],
      end_date: form.dateRange?.[1],
      store_ids: form.storeIds.join(",")
    };
    // const { data } = await getComprehensiveData(params);
    // tableData.value = data.results;
    // pagination.total = data.count;

    // --- 模拟数据 ---
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockData = {
      results: Array.from({ length: 10 }, (_, i) => ({
        date: `2025-08-${String(i + 1).padStart(2, "0")}`,
        storeName:
          form.storeIds.length > 0 ? `门店${form.storeIds[0]}` : `中心店`,
        sales: 12345.67 + i * 100,
        profit: 4321.98 + i * 50,
        profitMargin: 35.01 + i * 0.1,
        customerCount: 250 + i * 5,
        avgOrderValue: 49.38 + i * 0.2
      })),
      count: 30
    };
    tableData.value = mockData.results;
    pagination.total = mockData.count;
    // --- 模拟数据结束 ---
  } catch (error) {
    console.error("获取综合数据失败:", error);
    ElMessage.error("获取综合数据失败，请稍后重试。");
  } finally {
    loading.value = false;
  }
};

// 获取门店列表用于下拉框
const fetchStores = async () => {
  // 提示：请取消注释并实现真实的API调用
  // try {
  //   const { data } = await getStoreList({ page_size: 999 }); // 获取所有门店
  //   storeList.value = data.results;
  // } catch (error) {
  //   console.error("获取门店列表失败:", error);
  // }
  // --- 使用模拟数据 ---
  storeList.value = [
    { id: 1, name: "总部中心店" },
    { id: 2, name: "洛阳涧西店" },
    { id: 3, name: "西工店" },
    { id: 4, name: "老城店" },
    { id: 5, name: "洛龙店" }
  ];
};

// --- 事件处理函数 ---
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchData();
};

const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  fetchData();
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  fetchData();
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchData();
  fetchStores();
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <!-- 查询表单 -->
      <el-form :model="form" inline>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="选择门店">
          <el-select
            v-model="form.storeIds"
            multiple
            collapse-tags
            placeholder="可多选"
            style="width: 240px"
          >
            <el-option
              v-for="item in storeList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt-4">
      <!-- 表格主体 -->
      <pure-table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        stripe
        border
        height="600"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
  </div>
</template>
