<!-- --- src/components/PosterLite/index.vue --- -->
<template>
  <div class="poster-lite">
    <canvas ref="cv" :width="640" :height="900" class="rounded border" />
    <div class="mt-2 flex gap-2">
      <el-button size="small" @click="() => draw()">预览</el-button>
      <el-button size="small" type="primary" @click="() => download()"
        >导出 PNG</el-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
  title: string;
  period: string;
  coupon: string;
  skus: Array<{ name: string; price: number }>;
}>();

const cv = ref<HTMLCanvasElement | null>(null);

function draw() {
  if (!cv.value) return;
  const ctx = cv.value.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cv.value.width, cv.value.height);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 32px system-ui";
  ctx.fillText(props.title, 30, 60);

  ctx.fillStyle = "#6b7280";
  ctx.font = "16px system-ui";
  ctx.fillText(`活动时间：${props.period}`, 30, 95);

  ctx.fillStyle = "#2563eb";
  ctx.font = "bold 18px system-ui";
  ctx.fillText(props.coupon, 30, 125);

  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(30, 140);
  ctx.lineTo(610, 140);
  ctx.stroke();

  const items = props.skus.slice(0, 6);
  ctx.fillStyle = "#111827";
  ctx.font = "18px system-ui";
  items.forEach((it, idx) => {
    const y = 190 + idx * 110;
    ctx.fillText(`${idx + 1}. ${it.name}`, 40, y);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 24px system-ui";
    ctx.fillText(`¥${it.price}`, 40, y + 36);
    ctx.fillStyle = "#111827";
    ctx.font = "18px system-ui";
  });

  ctx.fillStyle = "#111827";
  ctx.font = "16px system-ui";
  ctx.fillText("到店更多惊喜 · 关注企微领券包", 30, 840);
}

function download() {
  if (!cv.value) return;
  const url = cv.value.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = "营销海报.png";
  a.click();
}

onMounted(draw);
watch(
  () => props,
  () => draw(),
  { deep: true }
);
</script>

<style scoped>
.poster-lite {
  width: 640px;
}
canvas {
  width: 100%;
  height: auto;
}
</style>
