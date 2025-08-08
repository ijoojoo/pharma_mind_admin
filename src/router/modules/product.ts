// --- src/router/modules/product.ts ---
import { $t } from "@/plugins/i18n";
import { MenuRankEnum } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/product",
  component: Layout,
  redirect: "/product/management/index",
  meta: {
    icon: "ri:shopping-bag-3-line",
    title: $t("menus.hsProductManagement"),
    rank: MenuRankEnum.PRODUCT_MANAGEMENT
  },
  children: [
    {
      path: "/product/management/index",
      name: "ProductManagement",
      component: () => import("@/views/product/management/index.vue"),
      meta: {
        title: $t("menus.hsProductInfoManagement")
      }
    }
  ]
} satisfies RouteConfigsTable;
