// --- src/router/modules/member.ts ---
import { $t } from "@/plugins/i18n";
import { member_management } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/member",
  component: Layout,
  redirect: "/member/management/index",
  meta: {
    icon: "ri:user-heart-line",
    title: $t("menus.hsMemberCenter"),
    rank: member_management
  },
  children: [
    {
      path: "/member/management/index",
      name: "MemberManagement",
      component: () => import("@/views/member/management/index.vue"),
      meta: {
        title: $t("menus.hsMemberCenter")
      }
    }
  ]
} satisfies RouteConfigsTable;
