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
        height="640"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="姓名/手机" width="180">
          <template #default="{ row }">
            <div class="font-medium">{{ row.name }}（{{ row.gender }}）</div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">
              {{ row.phone }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="store" label="门店/岗位/状态" min-width="220">
          <template #default="{ row }">
            <div>{{ row.store }} · {{ row.position }}</div>
            <el-tag
              :type="statusTagType(row.status)"
              size="small"
              effect="plain"
              >{{ row.status }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="hiredAt" label="入职" width="110" />
        <el-table-column label="绩效(30天)" min-width="260">
          <template #default="{ row }">
            <div class="flex items-center gap-4">
              <div>销售额：¥{{ format(row.sales30d) }}</div>
              <div>订单：{{ format(row.orders30d) }}</div>
              <div>毛利：¥{{ format(row.gp30d) }}</div>
            </div>
            <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
              关联销售率 {{ (row.attachRate * 100).toFixed(1) }}% · 高毛利推荐
              {{ (row.highMarginRate * 100).toFixed(1) }}%
            </div>
          </template>
        </el-table-column>
        <el-table-column label="KPI" width="230">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-progress
                :percentage="Math.min(100, Math.round(row.kpiCompletion * 100))"
              />
              <el-button link type="primary" @click="() => openSetKpi(row)"
                >设置</el-button
              >
            </div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">
              目标 ¥{{ format(row.kpiTarget) }} · 已达成 ¥{{
                format(row.kpiProgress)
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="培训/证书"
          min-width="240"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div>
              培训：{{
                row.train
                  ?.map(t => t.course + "(" + t.status + ")")
                  .join("、") || "—"
              }}
            </div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">
              证书：{{
                row.certs?.map(c => c.type + "至" + c.validUntil).join("、") ||
                "—"
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="tags"
          label="标签"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              v-for="t in row.tags"
              :key="t"
              type="info"
              size="small"
              effect="plain"
              class="mr-1"
              >{{ t }}</el-tag
            >
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

    <!-- KPI设置对话框 -->
    <el-dialog v-model="kpiVisible" title="设置个人KPI" width="420px">
      <el-form label-width="90px">
        <el-form-item label="员工">
          <span
            >{{ current?.name }}（{{ current?.store }} ·
            {{ current?.position }}）</span
          >
        </el-form-item>
        <el-form-item label="销售目标">
          <el-input-number
            v-model="kpiTarget"
            :min="0"
            :step="1000"
            style="width: 240px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="kpiVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="() => onSaveKpi()"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <!-- 指派培训对话框 -->
    <el-dialog v-model="trainVisible" title="指派培训" width="520px">
      <div class="mb-2 text-[var(--el-text-color-secondary)]">
        将为以下人员指派培训（共 {{ selectedForTrain.length }} 人）：
      </div>
      <el-alert type="info" :closable="false" show-icon class="mb-3">
        <template #default>
          {{ selectedForTrain.map(x => x.name).join("、") }}
        </template>
      </el-alert>
      <el-form label-width="90px">
        <el-form-item label="课程">
          <el-select
            v-model="trainCourse"
            placeholder="选择课程"
            style="width: 320px"
          >
            <el-option
              v-for="c in courseOptions"
              :key="c"
              :label="c"
              :value="c"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="trainVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="saving"
          @click="() => onAssignTrain()"
          >确认指派</el-button
        >
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      size="520px"
      :with-header="true"
      title="员工档案"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="姓名"
          >{{ current?.name }}（{{ current?.gender }}）</el-descriptions-item
        >
        <el-descriptions-item label="手机号">{{
          current?.phone
        }}</el-descriptions-item>
        <el-descriptions-item label="门店/岗位"
          >{{ current?.store }} / {{ current?.position }}</el-descriptions-item
        >
        <el-descriptions-item label="状态">
          <el-tag
            :type="statusTagType(current?.status || '在岗')"
            effect="plain"
            >{{ current?.status }}</el-tag
          >
        </el-descriptions-item>
        <el-descriptions-item label="入职时间">{{
          current?.hiredAt
        }}</el-descriptions-item>
        <el-descriptions-item label="学历/专业"
          >{{ current?.edu }} / {{ current?.major }}</el-descriptions-item
        >
        <el-descriptions-item label="从业年限"
          >{{ current?.expYears }} 年</el-descriptions-item
        >
        <el-descriptions-item label="标签">
          <el-tag
            v-for="t in current?.tags || []"
            :key="t"
            size="small"
            type="info"
            effect="plain"
            class="mr-1"
            >{{ t }}</el-tag
          >
        </el-descriptions-item>
      </el-descriptions>

      <el-card shadow="never" class="mt-3">
        <template #header>近30天绩效</template>
        <div>
          销售额 ¥{{ format(current?.sales30d || 0) }} · 订单
          {{ format(current?.orders30d || 0) }} · 毛利 ¥{{
            format(current?.gp30d || 0)
          }}
        </div>
        <div class="text-xs text-[var(--el-text-color-secondary)] mt-1">
          关联销售率 {{ ((current?.attachRate || 0) * 100).toFixed(1) }}% ·
          高毛利推荐 {{ ((current?.highMarginRate || 0) * 100).toFixed(1) }}%
        </div>
        <div class="mt-2 flex items-center gap-2">
          <el-progress
            :percentage="
              Math.min(100, Math.round((current?.kpiCompletion || 0) * 100))
            "
          />
          <el-link type="primary" @click="() => openSetKpi(current!)"
            >设置目标</el-link
          >
        </div>
      </el-card>

      <el-card shadow="never" class="mt-3">
        <template #header>培训与证书</template>
        <div class="text-sm">
          培训：{{
            current?.train
              ?.map(t => t.course + "(" + t.status + ")")
              .join("、") || "—"
          }}
        </div>
        <div class="text-sm mt-1">
          证书：{{
            current?.certs?.map(c => c.type + "至" + c.validUntil).join("、") ||
            "—"
          }}
        </div>
        <div class="mt-2">
          <el-button size="small" @click="() => openAssignTrain([current!])"
            >指派培训</el-button
          >
        </div>
      </el-card>

      <el-card shadow="never" class="mt-3">
        <template #header>AI 辅导建议</template>
        <el-alert
          v-if="aiCoachTips.length"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div v-for="(t, idx) in aiCoachTips" :key="idx">• {{ t }}</div>
          </template>
        </el-alert>
        <div v-else class="text-[var(--el-text-color-secondary)]">
          点击“AI 个性化辅导”获取建议
        </div>
      </el-card>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";

/** ====== 类型 ====== */
type EmpStatus = "在岗" | "休假" | "停用";
type CertType = "执业药师" | "中药师" | "GSP" | "急救证";
type TrainStatus =
  | "未安排"
  | "已安排"
  | "学习中"
  | "待考试"
  | "已通过"
  | "未通过";

interface EmployeeItem {
  id: number;
  name: string;
  gender: "男" | "女";
  phone: string;
  store: string;
  position: string;
  status: EmpStatus;
  hiredAt: string;
  edu: string;
  major: string;
  expYears: number;

  // 绩效
  sales30d: number;
  orders30d: number;
  gp30d: number;
  attachRate: number;
  highMarginRate: number;
  kpiTarget: number;
  kpiProgress: number;
  kpiCompletion: number;

  // 培训 & 证书
  certs?: { type: CertType; validUntil: string }[];
  train?: { course: string; status: TrainStatus; score?: number }[];

  tags: string[];
}

/** ====== 状态 ====== */
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const employeeList = ref<EmployeeItem[]>([]);
const multipleSelection = ref<EmployeeItem[]>([]);
const hasSelection = computed(() => multipleSelection.value.length > 0);

/** KPI / 培训 / 详情 / AI */
const kpiVisible = ref(false);
const kpiTarget = ref<number>(0);

const trainVisible = ref(false);
const trainCourse = ref<string>("");
const courseOptions = [
  "高毛利品类推荐话术",
  "处方与GSP要点",
  "慢病复购SOP",
  "门店陈列与端架转化"
];
const selectedForTrain = ref<EmployeeItem[]>([]);

const detailVisible = ref(false);
const current = ref<EmployeeItem | null>(null);

const aiCoachTips = ref<string[]>([]);
const saving = ref(false);

/** ====== 工具 ====== */
function format(n: number) {
  return Number(n).toLocaleString("zh-CN");
}
function statusTagType(s: EmpStatus) {
  if (s === "在岗") return "success";
  if (s === "休假") return "warning";
  return "info";
}

/** ====== 模拟数据加载 ====== */
function mockOne(i: number): EmployeeItem {
  const stores = ["门店A", "门店B", "门店C", "门店D"];
  const positions = ["店员", "店长", "药师", "导购", "运营", "商品"];
  const status: EmpStatus[] = ["在岗", "休假", "停用"];
  const certsAll: CertType[] = ["执业药师", "中药师", "GSP", "急救证"];
  const trainPool = [
    "高毛利品类推荐话术",
    "感冒止咳推荐规范",
    "老慢病复购关怀SOP",
    "处方与GSP要点",
    "门店陈列与端架转化"
  ];

  const st = stores[i % stores.length];
  const pos = positions[i % positions.length];
  const s = status[i % status.length];

  const sales = Math.floor(20000 + Math.random() * 100000);
  const orders = Math.floor(120 + Math.random() * 800);
  const gp = Math.floor(sales * (0.23 + Math.random() * 0.15));
  const target = Math.floor(sales * (0.9 + Math.random() * 0.25));
  const progress = Math.floor(sales * (0.7 + Math.random() * 0.5));
  const completion = Math.min(1, progress / Math.max(1, target));

  const certNum =
    pos === "药师"
      ? 1 + Math.floor(Math.random() * 2)
      : Math.floor(Math.random() * 2);
  const certs = Array.from({ length: certNum }, () => ({
    type: certsAll[Math.floor(Math.random() * certsAll.length)],
    validUntil: `202${5 + Math.floor(Math.random() * 3)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, "0")}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, "0")}`
  }));
  const trainNum = Math.floor(Math.random() * 3);
  const train = Array.from({ length: trainNum }, () => ({
    course: trainPool[Math.floor(Math.random() * trainPool.length)],
    status: ["已安排", "学习中", "待考试", "已通过"][
      Math.floor(Math.random() * 4)
    ] as TrainStatus
  }));

  const tagPool = [
    ["高毛利推荐强"],
    ["关联销售弱"],
    ["慢病随访优"],
    ["客诉处理好评"],
    ["医保流程熟练"]
  ];
  const tags = tagPool[Math.floor(Math.random() * tagPool.length)];

  return {
    id: 1000 + i,
    name: `员工${i}`,
    gender: i % 2 === 0 ? "男" : "女",
    phone: `13${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`,
    store: st,
    position: pos,
    status: s,
    hiredAt: `202${Math.floor(Math.random() * 5)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, "0")}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, "0")}`,
    edu: ["中专", "大专", "本科"][i % 3],
    major: ["药学", "中药学", "护理", "市场营销"][i % 4],
    expYears: 1 + Math.floor(Math.random() * 10),

    sales30d: sales,
    orders30d: orders,
    gp30d: gp,
    attachRate: +(0.05 + Math.random() * 0.35).toFixed(2),
    highMarginRate: +(0.08 + Math.random() * 0.4).toFixed(2),
    kpiTarget: target,
    kpiProgress: progress,
    kpiCompletion: +completion.toFixed(2),

    certs,
    train,
    tags
  };
}

function refreshList() {
  loading.value = true;
  setTimeout(() => {
    const startId = 1 + (page.value - 1) * pageSize.value;
    employeeList.value = Array.from({ length: pageSize.value }, (_, i) =>
      mockOne(startId + i)
    );
    total.value = 88; // 模拟总数
    loading.value = false;
  }, 320);
}

onMounted(refreshList);

/** ====== 事件 ====== */
function handleSelectionChange(val: EmployeeItem[]) {
  multipleSelection.value = val;
}

function openDetail(row: EmployeeItem) {
  current.value = row;
  aiCoachTips.value = [];
  detailVisible.value = true;
}

function openSetKpi(row: EmployeeItem) {
  current.value = row;
  kpiTarget.value = row.kpiTarget || 0;
  kpiVisible.value = true;
}

async function onSaveKpi() {
  if (!current.value) return;
  saving.value = true;
  setTimeout(() => {
    current.value!.kpiTarget = kpiTarget.value;
    ElMessage.success("KPI 已保存（模拟）");
    kpiVisible.value = false;
    saving.value = false;
    refreshList();
  }, 300);
}

function openAssignTrain(rows?: EmployeeItem[]) {
  selectedForTrain.value =
    rows && rows.length ? rows : [...multipleSelection.value];
  if (!selectedForTrain.value.length) return;
  trainCourse.value = "";
  trainVisible.value = true;
}

async function onAssignTrain() {
  if (!selectedForTrain.value.length || !trainCourse.value)
    return ElMessage.warning("请选择课程");
  saving.value = true;
  setTimeout(() => {
    ElMessage.success("已指派培训（模拟）");
    trainVisible.value = false;
    saving.value = false;
    refreshList();
  }, 300);
}

async function onAICoach(rows?: EmployeeItem[]) {
  const pick = rows?.length ? rows : multipleSelection.value;
  if (!pick.length) return ElMessage.warning("请先选择员工");
  // 模拟 AI 返回
  aiCoachTips.value = [
    "晚高峰 18:00-19:00 转化偏低，建议演练快速问诊开场白。",
    "维矿与感冒类套装搭售机会充足，使用三明治推荐法提高成功率。",
    "对复购客户建立用药随访话术，提升复购周期与客单。"
  ];
  if (pick.length === 1) {
    current.value = pick[0];
    detailVisible.value = true;
  }
  ElMessage.success("AI 辅导建议已生成（模拟）");
}
</script>

<style scoped></style>
