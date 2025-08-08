// --- src/router/modules/ai.ts ---
import { $t } from "@/plugins/i18n";
import { MenuRankEnum } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/ai",
  component: Layout,
  redirect: "/ai/marketing/index",
  meta: {
    icon: "ri:robot-2-line",
    title: $t("menus.hsAIStrategy"),
    rank: MenuRankEnum.AI_STRATEGY
  },
  children: [
    {
      path: "/ai/marketing/index",
      name: "AIMarketing",
      component: () => import("@/views/ai/marketing/index.vue"),
      meta: {
        title: $t("menus.hsAIMarketing")
      }
    },
    {
      path: "/ai/category/index",
      name: "AICategory",
      component: () => import("@/views/ai/category/index.vue"),
      meta: {
        title: $t("menus.hsAICategory")
      }
    },
    {
      path: "/ai/inventory/index",
      name: "AIInventory",
      component: () => import("@/views/ai/inventory/index.vue"),
      meta: {
        title: $t("menus.hsAIInventory")
      }
    },
    {
      path: "/ai/employee/index",
      name: "AIEmployee",
      component: () => import("@/views/ai/employee/index.vue"),
      meta: {
        title: $t("menus.hsAIEmployee")
      }
    }
  ]
} satisfies RouteConfigsTable;
