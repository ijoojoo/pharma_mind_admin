<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import {
  getStoreList,
  createStore,
  updateStore,
  deleteStore
} from "@/api/store";
import type { Store } from "@/api/store";

defineOptions({
  name: "StoreManagement"
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
const tableData = ref<Store[]>([]);
const searchTerm = ref("");
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1
});

const dialogVisible = ref(false);
const dialogTitle = ref("编辑门店");
const formRef = ref();
const formData = reactive<Partial<Store>>({
  id: null,
  source_store_id: "",
  store_code: "",
  name: "",
  address: "",
  business_scope: ""
});

// --- 表格列定义 ---
const columns: TableColumnList = [
  { label: "门店编码", prop: "store_code", minWidth: 120 },
  { label: "门店名称", prop: "name", minWidth: 180 },
  { label: "经营场所", prop: "address", minWidth: 250 },
  { label: "经营范围", prop: "business_scope", minWidth: 200 },
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
    const { data } = await getStoreList({
      page: pagination.currentPage,
      page_size: pagination.pageSize,
      search: searchTerm.value
    });
    tableData.value = data.results;
    pagination.total = data.count;
  } catch (error) {
    console.error("获取门店列表失败:", error);
    ElMessage.error("获取门店列表失败，请稍后重试。");
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
  dialogTitle.value = "新增门店";
  Object.assign(formData, {
    id: null,
    source_store_id: "",
    store_code: "",
    name: "",
    address: "",
    business_scope: ""
  });
  dialogVisible.value = true;
};

const handleEdit = (row: Store) => {
  dialogTitle.value = "编辑门店";
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleDelete = (row: Store) => {
  ElMessageBox.confirm(`您确定要删除门店【${row.name}】吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      await deleteStore(row.id);
      ElMessage.success("删除成功");
      fetchData();
    })
    .catch(() => {});
};

const handleSave = async () => {
  try {
    const apiCall = formData.id
      ? updateStore(formData.id, formData)
      : createStore(formData);

    await apiCall;
    ElMessage.success(formData.id ? "更新成功" : "新增成功");
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error("操作失败，请稍后重试。");
  }
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
            <el-button type="primary" @click="handleAdd">新增门店</el-button>
          </div>
          <div class="flex items-center space-x-2">
            <el-input
              v-model="searchTerm"
              placeholder="搜索门店名称或编码..."
              clearable
              style="width: 240px"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>
        </div>
      </template>

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
        <el-form-item label="源系统ID">
          <el-input
            v-model="formData.source_store_id"
            :disabled="!!formData.id"
          />
        </el-form-item>
        <el-form-item label="门店编码">
          <el-input v-model="formData.store_code" />
        </el-form-item>
        <el-form-item label="门店名称">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="经营场所">
          <el-input v-model="formData.address" type="textarea" />
        </el-form-item>
        <el-form-item label="经营范围">
          <el-input v-model="formData.business_scope" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
