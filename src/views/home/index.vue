<script setup lang="ts">
defineOptions({
  name: "Home"
});

interface Feature {
  title: string;
  items: string[];
}

const features: Feature[] = [
  {
    title: "AI驱动的洞察",
    items: [
      "一键复盘：对当日/当周/当月的经营状况生成包含数据分析、问题归因和改进建议的报告。",
      "智能商品管理：AI自动为商品打标准品类标签、划分价格带、挖掘重点与滞销品种。",
      "智能会员管理：AI自动为会员画像并打上疾病、消费习惯和风险标签。",
      "AI策略生成：基于企业数据生成定制化的营销、品类、库存及员工培训方案。"
    ]
  },
  {
    title: "全面的BI分析中心",
    items: [
      "提供从企业全局到单店、单员工的多维度数据钻取能力。",
      "通过丰富的可视化图表直观展示销售、毛利、客流、坪效、人效等核心指标。"
    ]
  },
  {
    title: "精细化的运营管理",
    items: [
      "覆盖商品、门店、员工、会员等核心主数据的管理。",
      "专业的KPI考核中心支持从目标设定到进度追踪再到AI指导的全流程管理。"
    ]
  },
  {
    title: "安全可扩展的多租户架构",
    items: [
      "数据隔离：保证每个企业客户的数据经过严格的物理和逻辑隔离。",
      "权限分明：多层级角色权限体系确保员工只能访问其权限范围内的数据。",
      "模块化设计：清晰的模块化架构便于未来的功能扩展。"
    ]
  }
];
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold mb-2">PharmaMind AI 智慧药店运营平台</h1>
      <p class="text-gray-600">
        一个专为连锁药店行业设计的、深度集成AI能力的商业智能与运营优化平台。
      </p>
    </div>
    <el-row :gutter="20">
      <el-col
        v-for="feature in features"
        :key="feature.title"
        :xs="24"
        :sm="12"
        :lg="6"
        class="mb-4"
      >
        <el-card shadow="never" class="h-full">
          <template #header>
            <span class="font-medium">{{ feature.title }}</span>
          </template>
          <ul class="list-disc pl-4 space-y-1 text-sm leading-6">
            <li v-for="item in feature.items" :key="item">{{ item }}</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
