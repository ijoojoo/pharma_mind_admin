<!-- src/views/product/center.vue -->
<template>
  <div class="p-4 space-y-4">
    <!-- 顶部检索 -->
    <el-card shadow="hover">
      <el-form :model="query" label-width="90px" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="品名/条码/SKU"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="类目">
          <el-cascader
            v-model="query.category"
            :options="categoryOptions"
            clearable
            collapse-tags
            placeholder="选择类目"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="门店">
          <el-select
            v-model="query.storeIds"
            multiple
            clearable
            collapse-tags
            placeholder="门店"
            style="width: 220px"
          >
            <el-option
              v-for="s in storeOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            clearable
            placeholder="全部"
            style="width: 120px"
          >
            <el-option label="全部" value="全部" />
            <el-option label="上架" value="上架" />
            <el-option label="下架" value="下架" />
            <el-option label="冻结" value="冻结" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input-number
            v-model="query.priceMin"
            :min="0"
            placeholder="最低"
            style="width: 120px"
          />
          <span class="mx-1">—</span>
          <el-input-number
            v-model="query.priceMax"
            :min="0"
            placeholder="最高"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select
            v-model="query.stockStatus"
            clearable
            placeholder="全部"
            style="width: 140px"
          >
            <el-option label="全部" value="全部" />
            <el-option label="缺货" value="缺货" />
            <el-option label="低库存" value="低库存" />
            <el-option label="正常" value="正常" />
            <el-option label="高库存" value="高库存" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSearch"
            ><i class="i-ep-search mr-1" /> 查询</el-button
          >
          <el-button @click="onReset"
            ><i class="i-ep-refresh-left mr-1" /> 重置</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作条 -->
    <el-card shadow="hover">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <el-button :disabled="!hasSelection" @click="onAIClassify"
            ><i class="i-ep-collection-tag mr-1" /> AI 自动分类</el-button
          >
          <el-button :disabled="!hasSelection" @click="onAIPriceBand"
            ><i class="i-ep-price-tag mr-1" /> AI 价格带分析</el-button
          >
          <el-button :disabled="!hasSelection" @click="onAIMining"
            ><i class="i-ep-magic-stick mr-1" /> AI
            重点/潜力/滞销挖掘</el-button
          >
          <el-button :disabled="!hasSelection" @click="onBatchStatus('上架')"
            >批量上架</el-button
          >
          <el-button :disabled="!hasSelection" @click="onBatchStatus('下架')"
            >批量下架</el-button
          >
          <el-button :disabled="!hasSelection" @click="onBatchStatus('冻结')"
            >批量冻结</el-button
          >
        </div>
        <div class="text-[var(--el-text-color-secondary)] text-sm">
          已选 {{ multipleSelection.length }} 条
        </div>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="hover">
      <el-table
        v-loading="loading"
        :data="tableData"
        height="620"
        border
        stripe
        @selection-change="multipleSelection = $event"
      >
        <el-table-column type="selection" width="48" fixed />
        <el-table-column prop="sku" label="SKU/条码" width="160" fixed>
          <template #default="{ row }">
            <div class="font-medium">{{ row.sku }}</div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">
              {{ row.barcode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品/规格/厂家" min-width="240">
          <template #default="{ row }">
            <div class="font-medium">{{ row.name }}</div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">
              {{ row.spec }} · {{ row.vendor }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类目" min-width="180">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.categoryL1 }}</el-tag>
            <el-tag size="small" class="ml-1" effect="plain">{{
              row.categoryL2
            }}</el-tag>
            <el-tag size="small" class="ml-1" type="info" effect="plain">{{
              row.categoryL3
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storeName" label="门店" width="90" />
        <el-table-column prop="priceCurrent" label="价格(现/吊牌)" width="140">
          <template #default="{ row }">
            <div>¥{{ row.priceCurrent.toFixed(2) }}</div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">
              MSRP ¥{{ row.priceMsrp.toFixed(2) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="priceBand" label="价格带" width="80">
          <template #default="{ row }">
            <el-tag :type="bandType(row.priceBand)" effect="plain">{{
              row.priceBand
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grossMargin" label="毛利率" width="90">
          <template #default="{ row }">
            <span
              :class="
                row.grossMargin >= 0.45 ? 'text-[var(--el-color-success)]' : ''
              "
              >{{ (row.grossMargin * 100).toFixed(1) }}%</span
            >
          </template>
        </el-table-column>
        <el-table-column
          prop="sales30d"
          label="30日销量"
          width="100"
          sortable
        />
        <el-table-column prop="stock" label="库存" width="90" sortable />
        <el-table-column
          prop="turnoverDays"
          label="周转天数"
          width="100"
          sortable
        />
        <el-table-column prop="flags" label="重点/潜力/滞销" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="f in row.flags ?? []"
              :key="f"
              :type="flagType(f)"
              size="small"
              class="mr-1"
              effect="plain"
              >{{ f }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column
          prop="tags"
          label="标签"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              v-for="t in row.tags"
              :key="t"
              size="small"
              class="mr-1"
              type="info"
              effect="plain"
              >{{ t }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="plain">{{
              row.status
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)"
              >详情</el-button
            >
            <el-button link @click="quickAI('category', [row.id])"
              >AI分类</el-button
            >
            <el-button link @click="quickAI('price', [row.id])"
              >价格带</el-button
            >
            <el-button link @click="quickAI('mining', [row.id])"
              >挖掘</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pager.page"
          v-model:page-size="pager.pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 30, 50]"
          :total="pager.total"
          @size-change="load"
          @current-change="load"
        />
      </div>
    </el-card>

    <!-- 详情 / 编辑 -->
    <el-drawer
      v-model="detailVisible"
      size="520px"
      :with-header="true"
      title="商品详情"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="SKU">{{
          current?.sku
        }}</el-descriptions-item>
        <el-descriptions-item label="条码">{{
          current?.barcode
        }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{
          current?.name
        }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{
          current?.spec
        }}</el-descriptions-item>
        <el-descriptions-item label="厂家">{{
          current?.vendor
        }}</el-descriptions-item>
        <el-descriptions-item label="类目"
          >{{ current?.categoryL1 }} / {{ current?.categoryL2 }} /
          {{ current?.categoryL3 }}</el-descriptions-item
        >
        <el-descriptions-item label="价格">
          现价 ¥<el-input-number
            v-model="editable.priceCurrent"
            :min="0"
            size="small"
            style="width: 130px"
          />
          <span class="ml-2 text-[var(--el-text-color-secondary)]"
            >MSRP ¥{{ current?.priceMsrp.toFixed(2) }}</span
          >
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-segmented
            v-model="editable.status"
            :options="['上架', '下架', '冻结']"
            size="small"
          />
        </el-descriptions-item>
        <el-descriptions-item label="标签">
          <el-select
            v-model="editable.tags"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          />
        </el-descriptions-item>
      </el-descriptions>

      <div class="mt-4">
        <el-space wrap>
          <el-button @click="quickAI('category', [current!.id])"
            ><i class="i-ep-collection-tag mr-1" /> AI 分类</el-button
          >
          <el-button @click="quickAI('price', [current!.id])"
            ><i class="i-ep-price-tag mr-1" /> 价格带</el-button
          >
          <el-button @click="quickAI('mining', [current!.id])"
            ><i class="i-ep-magic-stick mr-1" /> 重点/潜力/滞销</el-button
          >
          <el-button type="primary" :loading="saving" @click="onSave"
            ><i class="i-ep-check mr-1" /> 保存</el-button
          >
        </el-space>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import type { ProductItem, ProductQuery } from "@/api/product-center";
import {
  fetchProductPage,
  aiClassifyCategory,
  aiPriceBand,
  aiMiningFocus,
  saveProduct
} from "@/api/product-center";

/** 检索条件 */
const query = reactive<ProductQuery>({
  page: 1,
  pageSize: 10,
  keyword: "",
  status: "全部",
  storeIds: [],
  category: [],
  priceMin: undefined,
  priceMax: undefined,
  stockStatus: "全部"
});
const dateRange = ref<[Date, Date] | null>(null);
const categoryOptions = [
  {
    label: "OTC",
    value: "OTC",
    children: [
      {
        label: "感冒咳嗽",
        value: "感冒咳嗽",
        children: [
          { label: "止咳", value: "止咳" },
          { label: "感冒灵", value: "感冒灵" }
        ]
      }
    ]
  },
  {
    label: "处方药",
    value: "处方药",
    children: [
      {
        label: "心脑血管",
        value: "心脑血管",
        children: [{ label: "阿司匹林", value: "阿司匹林" }]
      }
    ]
  },
  {
    label: "保健品",
    value: "保健品",
    children: [
      {
        label: "维矿",
        value: "维矿",
        children: [{ label: "复合维生素", value: "复合维生素" }]
      }
    ]
  },
  {
    label: "医疗器械",
    value: "医疗器械",
    children: [
      {
        label: "血压计",
        value: "血压计",
        children: [{ label: "上臂式", value: "上臂式" }]
      }
    ]
  }
];
const storeOptions = [
  { label: "门店A", value: "A" },
  { label: "门店B", value: "B" },
  { label: "门店C", value: "C" },
  { label: "门店D", value: "D" }
];

/** 表格 & 分页 */
const tableData = ref<ProductItem[]>([]);
const pager = reactive({ page: 1, pageSize: 10, total: 0 });
const loading = ref(false);
const multipleSelection = ref<ProductItem[]>([]);
const hasSelection = computed(() => multipleSelection.value.length > 0);

/** 详情/编辑 */
const detailVisible = ref(false);
const current = ref<ProductItem | null>(null);
const editable = reactive<{
  priceCurrent: number;
  status: ProductItem["status"];
  tags: string[];
}>({
  priceCurrent: 0,
  status: "上架",
  tags: []
});
const saving = ref(false);

/** 方法 */
async function load() {
  loading.value = true;
  try {
    const params: ProductQuery = {
      ...query,
      page: pager.page,
      pageSize: pager.pageSize,
      dateRange: dateRange.value
        ? [
            dateRange.value[0].toISOString().slice(0, 10),
            dateRange.value[1].toISOString().slice(0, 10)
          ]
        : undefined
    };
    const { list, total, page, pageSize } = await fetchProductPage(params);
    tableData.value = list;
    pager.total = total;
    pager.page = page;
    pager.pageSize = pageSize;
  } finally {
    loading.value = false;
  }
}
function onSearch() {
  pager.page = 1;
  load();
}
function onReset() {
  Object.assign(query, {
    page: 1,
    pageSize: 10,
    keyword: "",
    status: "全部",
    storeIds: [],
    category: [],
    priceMin: undefined,
    priceMax: undefined,
    stockStatus: "全部"
  });
  dateRange.value = null;
  pager.page = 1;
  pager.pageSize = 10;
  load();
}

function bandType(b: ProductItem["priceBand"]) {
  if (b === "高") return "danger";
  if (b === "中") return "warning";
  return "success";
}
function statusType(s: ProductItem["status"]) {
  if (s === "上架") return "success";
  if (s === "下架") return "info";
  return "warning";
}
function flagType(f: "重点" | "潜力" | "滞销") {
  if (f === "重点") return "danger";
  if (f === "潜力") return "warning";
  return "info";
}

function openDetail(row: ProductItem) {
  current.value = row;
  editable.priceCurrent = row.priceCurrent;
  editable.status = row.status;
  editable.tags = [...row.tags];
  detailVisible.value = true;
}

async function quickAI(kind: "category" | "price" | "mining", ids: string[]) {
  if (!ids.length) return;
  try {
    if (kind === "category") await aiClassifyCategory(ids);
    if (kind === "price") await aiPriceBand(ids);
    if (kind === "mining") await aiMiningFocus(ids);
    ElMessage.success("AI 处理完成（模拟）");
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || "AI 操作失败");
  }
}

async function onAIClassify() {
  await quickAI(
    "category",
    multipleSelection.value.map(x => x.id)
  );
}
async function onAIPriceBand() {
  await quickAI(
    "price",
    multipleSelection.value.map(x => x.id)
  );
}
async function onAIMining() {
  await quickAI(
    "mining",
    multipleSelection.value.map(x => x.id)
  );
}

function onBatchStatus(target: ProductItem["status"]) {
  multipleSelection.value.forEach(p => (p.status = target));
  ElMessage.success(
    `批量设置 ${multipleSelection.value.length} 个商品为「${target}」(本地模拟)`
  );
}

async function onSave() {
  if (!current.value) return;
  saving.value = true;
  try {
    await saveProduct({
      id: current.value.id,
      priceCurrent: editable.priceCurrent,
      status: editable.status,
      tags: editable.tags
    });
    Object.assign(current.value, {
      priceCurrent: editable.priceCurrent,
      status: editable.status,
      tags: [...editable.tags]
    });
    ElMessage.success("保存成功（模拟）");
    detailVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error(e?.message || "保存失败");
  } finally {
    saving.value = false;
  }
}

/** 监听 & 初始化 */
watch(
  () => [pager.page, pager.pageSize],
  () => load()
);
onMounted(load);
</script>

<style scoped></style>
