<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";

defineOptions({
  name: "AiMarketing"
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

interface StrategyRow {
  name: string;
  channels: string;
  budget: number;
  content: string;
}

const form = reactive({
  goal: "",
  budget: 1000
});

const loading = ref(false);
const tableData = ref<StrategyRow[]>([]);

const columns: TableColumnList = [
  { label: "策略名称", prop: "name", minWidth: 120 },
  { label: "投放渠道", prop: "channels", minWidth: 120 },
  { label: "预算(元)", prop: "budget", minWidth: 100, align: "right" },
  { label: "策略详情", prop: "content", minWidth: 300 }
];

const handleGenerate = () => {
  loading.value = true;
  setTimeout(() => {
    tableData.value = [
      {
        name: "优惠券促销",
        channels: "小程序",
        budget: form.budget * 0.5,
        content: `针对${form.goal || "目标客户"}发放满减券`
      },
      {
        name: "社群推广",
        channels: "微信群",
        budget: form.budget * 0.3,
        content: "建立会员微信群，推送健康知识和产品优惠"
      },
      {
        name: "线下活动",
        channels: "门店",
        budget: form.budget * 0.2,
        content: "开展义诊活动吸引客流"
      }
    ];
    loading.value = false;
    ElMessage.success("AI策略生成完成");
  }, 800);
};
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <el-form :model="form" inline>
        <el-form-item label="营销目标">
          <el-input
            v-model="form.goal"
            placeholder="如：提升会员活跃"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="预算(元)">
          <el-input-number v-model="form.budget" :min="0" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleGenerate">生成策略</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt-4">
      <pure-table
        :data="tableData"
        :columns="columns"
        :loading="loading"
        stripe
        border
      />
    </el-card>
  </div>
</template>
