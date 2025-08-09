// --- src/router/modules/kpi.ts ---
import { $t } from "@/plugins/i18n";
import { kpi_assessment } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/kpi",
  component: Layout,
  redirect: "/kpi/progress/index",
  meta: {
    icon: "ri:line-chart-line",
    title: $t("menus.hsKPIAssessment"),
    rank: kpi_assessment
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
