// --- src/router/modules/ai-strategy.ts ---
import { $t } from "@/plugins/i18n";
import { ai_strategy } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/ai-strategy",
  component: Layout,
  redirect: "/ai-strategy/marketing",
  meta: {
    icon: "ep:magic-stick",
    title: $t("menus.hsAiStrategy"),
    rank: ai_strategy
  },
  children: [
    {
      path: "/ai-strategy/marketing",
      name: "AiStrategyMarketing",
      component: () => import("@/views/ai-strategy/marketing/index.vue"),
      meta: {
        title: $t("menus.hsAiMarketing")
      }
    }
  ]
} satisfies RouteConfigsTable;
