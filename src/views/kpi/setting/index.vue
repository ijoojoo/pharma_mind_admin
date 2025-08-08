<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({
  name: "KpiSetting"
});

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

interface KpiItem {
  id: number;
  name: string;
  target: number;
  unit: string;
}

const form = reactive({
  name: "",
  target: 0,
  unit: "元"
});

const loading = ref(false);
const tableData = ref<KpiItem[]>([
  { id: 1, name: "日销售额", target: 20000, unit: "元" },
  { id: 2, name: "新增会员数", target: 30, unit: "人" }
]);

const columns: TableColumnList = [
  { label: "指标名称", prop: "name", minWidth: 150 },
  { label: "目标值", prop: "target", minWidth: 100, align: "right" },
  { label: "单位", prop: "unit", width: 80 },
  {
    label: "操作",
    slot: "operation",
    width: 100,
    align: "center",
    fixed: "right"
  }
];

const handleAdd = () => {
  if (!form.name) {
    ElMessage.warning("请填写指标名称");
    return;
  }
  tableData.value.push({
    id: Date.now(),
    name: form.name,
    target: form.target,
    unit: form.unit
  });
  form.name = "";
  form.target = 0;
  ElMessage.success("添加成功");
};

const handleDelete = (row: KpiItem) => {
  ElMessageBox.confirm(`确定删除指标【${row.name}】吗？`, "提示", {
    type: "warning"
  }).then(() => {
    tableData.value = tableData.value.filter(item => item.id !== row.id);
    ElMessage.success("删除成功");
  });
};
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <el-form :model="form" inline>
        <el-form-item label="指标名称">
          <el-input v-model="form.name" placeholder="如：日销售额" />
        </el-form-item>
        <el-form-item label="目标值">
          <el-input-number v-model="form.target" :min="0" />
        </el-form-item>
        <el-form-item label="单位">
          <el-select v-model="form.unit" style="width: 100px">
            <el-option label="元" value="元" />
            <el-option label="人" value="人" />
            <el-option label="%" value="%" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAdd">添加指标</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt-4">
      <pure-table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        border
        stripe
      >
        <template #operation="{ row }">
          <el-button type="danger" link @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </pure-table>
    </el-card>
  </div>
</template>
