// --- src/router/modules/store.ts ---
import { $t } from "@/plugins/i18n";
import { MenuRankEnum } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/store",
  component: Layout,
  redirect: "/store/management/index",
  meta: {
    icon: "ri:store-2-line",
    title: $t("menus.hsStoreCenter"),
    rank: MenuRankEnum.STORE_MANAGEMENT
  },
  children: [
    {
      path: "/store/management/index",
      name: "StoreManagement",
      component: () => import("@/views/store/management/index.vue"),
      meta: {
        title: $t("menus.hsStoreCenter")
      }
    }
  ]
} satisfies RouteConfigsTable;
