<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import {
  getProductList,
  createProduct,
  updateProduct,
  deleteProduct,
  requestAIAutoCategorize
} from "@/api/product";
import type { Product } from "@/api/product";

defineOptions({
  name: "ProductManagement"
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
const aiLoading = ref(false); // 用于AI按钮的加载状态
const tableData = ref<Product[]>([]);
const searchTerm = ref("");
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1
});

const dialogVisible = ref(false);
const dialogTitle = ref("编辑商品");
const formRef = ref();
const formData = reactive<Partial<Product>>({
  id: null,
  product_code: "",
  name: "",
  specification: "",
  manufacturer: "",
  retail_price: 0
});

// --- 表格列定义 ---
const columns: TableColumnList = [
  { label: "商品编码", prop: "product_code", minWidth: 120 },
  { label: "商品名称", prop: "name", minWidth: 180 },
  { label: "规格", prop: "specification", minWidth: 150 },
  { label: "生产企业", prop: "manufacturer", minWidth: 180 },
  { label: "零售价 (元)", prop: "retail_price", minWidth: 120, align: "right" },
  {
    label: "操作",
    slot: "operation",
    width: 150,
    fixed: "right",
    align: "center"
  }
];

// --- 核心业务逻辑 ---
const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await getProductList({
      page: pagination.currentPage,
      page_size: pagination.pageSize,
      search: searchTerm.value
    });
    tableData.value = data.results;
    pagination.total = data.count;
  } catch (error) {
    console.error("获取商品列表失败:", error);
    ElMessage.error("获取商品列表失败，请稍后重试。");
  } finally {
    loading.value = false;
  }
};

// --- 事件处理函数 ---
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchData();
};

const handleAdd = () => {
  dialogTitle.value = "新增商品";
  Object.assign(formData, {
    id: null,
    product_code: "",
    name: "",
    specification: "",
    manufacturer: "",
    retail_price: 0
  });
  dialogVisible.value = true;
};

const handleEdit = (row: Product) => {
  dialogTitle.value = "编辑商品";
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleDelete = (row: Product) => {
  ElMessageBox.confirm(`您确定要删除商品【${row.name}】吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      await deleteProduct(row.id);
      ElMessage.success("删除成功");
      fetchData();
    })
    .catch(() => {});
};

const handleSave = async () => {
  try {
    const apiCall = formData.id
      ? updateProduct(formData.id, formData)
      : createProduct(formData);

    await apiCall;
    ElMessage.success(formData.id ? "更新成功" : "新增成功");
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error("操作失败，请稍后重试。");
  }
};

const handleAutoCategorize = () => {
  ElMessageBox.confirm(
    "这将对所有未分类的商品进行AI自动分类，可能会消耗较多Token。确定要继续吗？",
    "AI自动分类确认",
    {
      confirmButtonText: "开始分类",
      cancelButtonText: "取消",
      type: "info"
    }
  )
    .then(async () => {
      aiLoading.value = true;
      try {
        const { message } = await requestAIAutoCategorize();
        ElMessage.success(message || "AI分类任务已成功触发！");
        fetchData();
      } catch (error) {
        console.error("AI自动分类失败:", error);
        ElMessage.error("AI自动分类失败，请稍后重试。");
      } finally {
        aiLoading.value = false;
      }
    })
    .catch(() => {});
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
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <el-button type="primary" @click="handleAdd">新增商品</el-button>
            <el-button>批量操作</el-button>
          </div>
          <div class="flex items-center space-x-2">
            <el-input
              v-model="searchTerm"
              placeholder="搜索商品名称或编码..."
              clearable
              style="width: 240px"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

      <div class="flex items-center space-x-2 mb-4">
        <span class="text-sm font-semibold text-gray-700">AI 功能:</span>
        <el-button
          link
          type="primary"
          :loading="aiLoading"
          @click="handleAutoCategorize"
          >自动分类</el-button
        >
        <el-button link type="primary">价格带分析</el-button>
        <el-button link type="primary">重点品种挖掘</el-button>
      </div>

      <pure-table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        stripe
        border
        height="500"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
        <template #operation="{ row }">
          <el-button link type="primary" @click="handleEdit(row)"
            >编辑</el-button
          >
          <el-button link type="danger" @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </pure-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      draggable
    >
      <el-form ref="formRef" :model="formData" label-width="100px">
        <el-form-item label="商品编码">
          <el-input
            v-model="formData.product_code"
            :disabled="!!formData.id"
            placeholder="如果是新增，将自动生成"
          />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="formData.specification" />
        </el-form-item>
        <el-form-item label="生产企业">
          <el-input v-model="formData.manufacturer" />
        </el-form-item>
        <el-form-item label="零售价 (元)">
          <el-input-number
            v-model="formData.retail_price"
            :precision="2"
            :step="1"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
