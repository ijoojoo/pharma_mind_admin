// --- src/router/modules/bi.ts ---
import { $t } from "@/plugins/i18n";
import { bi_analysis } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/bi",
  component: Layout,
  redirect: "/bi-analysis/daily-report/index",
  meta: {
    icon: "ri:bar-chart-2-line",
    title: $t("menus.hsBIAnalysis"),
    rank: bi_analysis
  },
  children: [
    {
      path: "/bi-analysis/daily-report/index",
      name: "DailyReport",
      component: () => import("@/views/bi-analysis/daily-report/index.vue"),
      meta: {
        title: $t("menus.hsDailyReport")
      }
    }
  ]
} satisfies RouteConfigsTable;
