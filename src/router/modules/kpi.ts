// --- src/router/modules/kpi.ts ---
import { $t } from "@/plugins/i18n";
import { MenuRankEnum } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/kpi",
  component: Layout,
  redirect: "/kpi/progress/index",
  meta: {
    icon: "ri:line-chart-line",
    title: $t("menus.hsKPIAssessment"),
    rank: MenuRankEnum.KPI_ASSESSMENT
  },
  children: [
    {
      path: "/kpi/progress/index",
      name: "KPIProgress",
      component: () => import("@/views/kpi/progress/index.vue"),
      meta: {
        title: $t("menus.hsKPIProgress")
      }
    },
    {
      path: "/kpi/setting/index",
      name: "KPISetting",
      component: () => import("@/views/kpi/setting/index.vue"),
      meta: {
        title: $t("menus.hsKPISetting")
      }
    }
  ]
} satisfies RouteConfigsTable;
