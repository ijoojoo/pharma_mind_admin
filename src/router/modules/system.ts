// --- src/router/modules/system.ts ---
import { $t } from "@/plugins/i18n";
import { MenuRankEnum } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/system",
  component: Layout,
  redirect: "/system/user/index",
  meta: {
    icon: "ri:settings-3-line",
    title: $t("menus.hsSystemManagement"),
    rank: MenuRankEnum.SYSTEM_MANAGEMENT
  },
  children: [
    {
      path: "/system/user/index",
      name: "UserManagement",
      component: () => import("@/views/system/user/index.vue"),
      meta: {
        title: $t("menus.hsUserManagement")
      }
    },
    {
      path: "/system/role/index",
      name: "RoleManagement",
      component: () => import("@/views/system/role/index.vue"),
      meta: {
        title: $t("menus.hsRoleManagement")
      }
    },
    {
      path: "/system/account/index",
      name: "EnterpriseAccount",
      component: () => import("@/views/system/account/index.vue"),
      meta: {
        title: $t("menus.hsEnterpriseAccount")
      }
    }
  ]
} satisfies RouteConfigsTable;
