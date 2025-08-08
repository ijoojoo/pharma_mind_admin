// --- src/router/modules/bi.ts ---
import { $t } from "@/plugins/i18n";
import { MenuRankEnum } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/bi",
  component: Layout,
  redirect: "/bi/daily-report/index",
  meta: {
    icon: "ri:bar-chart-2-line",
    title: $t("menus.hsBIAnalysis"),
    rank: MenuRankEnum.BI_ANALYSIS
  },
  children: [
    {
      path: "/bi/daily-report/index",
      name: "DailyReport",
      component: () => import("@/views/bi/daily-report/index.vue"),
      meta: {
        title: $t("menus.hsDailyReport")
      }
    },
    {
      path: "/bi/comprehensive-query/index",
      name: "ComprehensiveQuery",
      component: () => import("@/views/bi/comprehensive-query/index.vue"),
      meta: {
        title: $t("menus.hsComprehensiveQuery")
      }
    }
  ]
} satisfies RouteConfigsTable;
