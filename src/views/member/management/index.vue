<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import {
  getMemberList,
  createMember,
  updateMember,
  deleteMember
} from "@/api/member";
import type { Member } from "@/api/member";
// 假设您有一个获取门店列表的API，用于下拉选择
// import { getStoreList } from "@/api/store";

defineOptions({
  name: "MemberManagement"
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
const tableData = ref<Member[]>([]);
const searchTerm = ref("");
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1
});

const dialogVisible = ref(false);
const dialogTitle = ref("编辑会员");
const formRef = ref();
const formData = reactive<Partial<Member>>({
  id: null,
  source_member_id: "",
  card_number: "",
  name: "",
  phone: "",
  address: "",
  issuing_store: null,
  current_points: 0
});

const storeList = ref([]); // 用于存放门店下拉列表

// --- 表格列定义 ---
const columns: TableColumnList = [
  { label: "会员卡号", prop: "card_number", minWidth: 150 },
  { label: "姓名", prop: "name", minWidth: 120 },
  { label: "手机号", prop: "phone", minWidth: 150 },
  { label: "办卡门店", prop: "issuing_store_name", minWidth: 180 }, // 假设后端会返回issuing_store_name
  { label: "当前积分", prop: "current_points", minWidth: 120, align: "right" },
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
    const { data } = await getMemberList({
      page: pagination.currentPage,
      page_size: pagination.pageSize,
      search: searchTerm.value
    });
    tableData.value = data.results;
    pagination.total = data.count;
  } catch (error) {
    console.error("获取会员列表失败:", error);
    ElMessage.error("获取会员列表失败，请稍后重试。");
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
    { id: 2, name: "洛阳涧西店" }
  ];
};

// --- 事件处理函数 ---
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchData();
};

const handleAdd = () => {
  dialogTitle.value = "新增会员";
  Object.assign(formData, {
    id: null,
    source_member_id: "",
    card_number: "",
    name: "",
    phone: "",
    address: "",
    issuing_store: null,
    current_points: 0
  });
  dialogVisible.value = true;
};

const handleEdit = (row: Member) => {
  dialogTitle.value = "编辑会员";
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleDelete = (row: Member) => {
  ElMessageBox.confirm(`您确定要删除会员【${row.name}】吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      await deleteMember(row.id);
      ElMessage.success("删除成功");
      fetchData();
    })
    .catch(() => {});
};

const handleSave = async () => {
  try {
    const apiCall = formData.id
      ? updateMember(formData.id, formData)
      : createMember(formData);

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
  fetchStores();
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <el-button type="primary" @click="handleAdd">新增会员</el-button>
          </div>
          <div class="flex items-center space-x-2">
            <el-input
              v-model="searchTerm"
              placeholder="搜索会员姓名或卡号..."
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
            v-model="formData.source_member_id"
            :disabled="!!formData.id"
          />
        </el-form-item>
        <el-form-item label="会员卡号">
          <el-input v-model="formData.card_number" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item label="办卡门店">
          <el-select
            v-model="formData.issuing_store"
            placeholder="请选择办卡门店"
            style="width: 100%"
          >
            <el-option
              v-for="item in storeList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前积分">
          <el-input-number
            v-model="formData.current_points"
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
