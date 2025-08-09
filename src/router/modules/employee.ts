// --- src/router/modules/employee.ts ---
import { $t } from "@/plugins/i18n";
import { employee_management } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/employee",
  component: Layout,
  redirect: "/employee/center",
  meta: {
    icon: "ri:user-star-line",
    title: $t("menus.hsEmployeeCenter"),
    rank: employee_management
  },
  children: [
    {
      path: "/employee/center",
      name: "EmployeeCenter",
      component: () => import("@/views/employee/center.vue"),
      meta: {
        title: $t("menus.hsEmployeeCenter")
      }
    }
  ]
} satisfies RouteConfigsTable;
