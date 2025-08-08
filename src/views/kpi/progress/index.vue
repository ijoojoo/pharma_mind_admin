<script setup lang="ts">
import { ref } from "vue";

defineOptions({
  name: "KpiProgress"
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

interface KpiProgressItem {
  id: number;
  name: string;
  target: number;
  current: number;
}

const loading = ref(false);
const tableData = ref<KpiProgressItem[]>([
  { id: 1, name: "日销售额", target: 20000, current: 15000 },
  { id: 2, name: "新增会员数", target: 30, current: 18 }
]);

const columns: TableColumnList = [
  { label: "指标名称", prop: "name", minWidth: 150 },
  { label: "目标值", prop: "target", minWidth: 100, align: "right" },
  { label: "当前值", prop: "current", minWidth: 100, align: "right" },
  { label: "完成进度", slot: "progress", minWidth: 160 }
];
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <pure-table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        border
        stripe
      >
        <template #progress="{ row }">
          <el-progress
            :percentage="
              Math.min(100, Math.round((row.current / row.target) * 100))
            "
          />
        </template>
      </pure-table>
    </el-card>
  </div>
</template>
