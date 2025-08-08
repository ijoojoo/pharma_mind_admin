// --- src/router/modules/employee.ts ---
import { $t } from "@/plugins/i18n";
import { MenuRankEnum } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/employee",
  component: Layout,
  redirect: "/employee/management/index",
  meta: {
    icon: "ri:user-star-line",
    title: $t("menus.hsEmployeeCenter"),
    rank: MenuRankEnum.EMPLOYEE_MANAGEMENT
  },
  children: [
    {
      path: "/employee/management/index",
      name: "EmployeeManagement",
      component: () => import("@/views/employee/management/index.vue"),
      meta: {
        title: $t("menus.hsEmployeeCenter")
      }
    }
  ]
} satisfies RouteConfigsTable;
