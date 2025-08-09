<template>
  <div class="p-4 space-y-4">
    <!-- 操作栏 -->
    <div class="flex gap-2">
      <el-button
        type="primary"
        :disabled="!hasSelection"
        @click="() => openAssignTrain()"
      >
        指派培训
      </el-button>
      <el-button
        type="success"
        :disabled="!hasSelection"
        @click="() => onAICoach()"
      >
        AI 个性化辅导
      </el-button>
      <el-button type="warning" @click="() => refreshList()">刷新</el-button>
    </div>

    <!-- 员工表格 -->
    <el-card shadow="hover">
      <el-table
        v-loading="loading"
        :data="employeeList"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="store" label="门店" min-width="140" />
        <el-table-column prop="kpi" label="KPI 完成率" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="row.kpi"
              :status="row.kpi >= 100 ? 'success' : 'warning'"
            />
          </template>
        </el-table-column>
        <el-table-column prop="trainStatus" label="培训状态" width="140">
          <template #default="{ row }">
            <el-tag :type="row.trainStatus === '已完成' ? 'success' : 'info'">
              {{ row.trainStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="() => openDetail(row)"
              >详情</el-button
            >
            <el-button link type="primary" @click="() => openSetKpi(row)"
              >设置KPI</el-button
            >
            <el-button link @click="() => openAssignTrain([row])"
              >指派培训</el-button
            >
            <el-button link type="success" @click="() => onAICoach([row])"
              >AI辅导</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="total, prev, pager, next, jumper"
          :total="total"
          @current-change="refreshList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";

interface EmployeeItem {
  id: number;
  name: string;
  position: string;
  store: string;
  kpi: number; // 0-100
  trainStatus: "已完成" | "未完成";
}

const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const employeeList = ref<EmployeeItem[]>([]);
const multipleSelection = ref<EmployeeItem[]>([]);
const hasSelection = computed(() => multipleSelection.value.length > 0);

function refreshList() {
  loading.value = true;
  setTimeout(() => {
    const startId = 1 + (page.value - 1) * pageSize.value;
    const mock: EmployeeItem[] = Array.from(
      { length: pageSize.value },
      (_, i) => ({
        id: startId + i,
        name: ["张三", "李四", "王五", "赵六", "钱七"][i % 5],
        position: ["店长", "药师", "导购", "收银"][i % 4],
        store: `门店${(i % 4) + 1}`,
        kpi: Math.floor(Math.random() * 121), // 0~120
        trainStatus: Math.random() > 0.5 ? "已完成" : "未完成"
      })
    );
    employeeList.value = mock;
    total.value = 42; // 模拟总数
    loading.value = false;
  }, 350);
}

onMounted(refreshList);

function handleSelectionChange(val: EmployeeItem[]) {
  multipleSelection.value = val;
}

function openDetail(row: EmployeeItem) {
  ElMessage.info(`查看 ${row.name} 的详情（待接后端/抽屉）`);
}

function openSetKpi(row: EmployeeItem) {
  ElMessage.success(`为 ${row.name} 设置 KPI（待接后端/对话框）`);
}

function openAssignTrain(rows?: EmployeeItem[]) {
  const target = rows && rows.length ? rows : multipleSelection.value;
  if (!target.length) return ElMessage.warning("请先选择员工");
  ElMessage.success(`为 ${target.length} 位员工指派培训（模拟）`);
}

function onAICoach(rows?: EmployeeItem[]) {
  const target = rows && rows.length ? rows : multipleSelection.value;
  if (!target.length) return ElMessage.warning("请先选择员工");
  ElMessage.info(`为 ${target.length} 位员工生成 AI 辅导建议（模拟）`);
}
</script>
