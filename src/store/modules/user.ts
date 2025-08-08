import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  //type BackendLoginResult,
  type RefreshTokenResult,
  getLogin,
  getInfo as getUserInfoApi, // 1. 导入 getInfo 并重命名为 getUserInfoApi
  refreshTokenApi
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 头像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 用户名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 昵称
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 前端生成的验证码（按实际需求替换）
    verifyCode: "",
    // 判断登录页面显示哪个组件（0：登录（默认）、1：手机登录、2：二维码登录、3：注册、4：忘记密码）
    currentPage: 0,
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储前端生成的验证码 */
    SET_VERIFYCODE(verifyCode: string) {
      this.verifyCode = verifyCode;
    },
    /** 存储登录页面显示哪个组件 */
    SET_CURRENTPAGE(value: number) {
      this.currentPage = value;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 登入 */
    async loginByUsername(data) {
      // 目的：修改登录逻辑，以正确处理Django后端返回的token
      return new Promise<void>((resolve, reject) => {
        getLogin(data)
          .then(res => {
            // 判断条件：只要后端返回了 access token，就视为登录成功
            if (res && res.access) {
              setToken({
                accessToken: res.access,
                refreshToken: res.refresh,
                expires: new Date(
                  Date.now() + 1000 * 60 * 60 * 24 * this.loginDay
                ),
                username: data.username,
                roles: ["admin"] // 暂时硬编码角色
              });
              resolve(); // 解决Promise，表示成功
            } else {
              // 如果没有access token，则视为失败
              reject(new Error("登录失败，响应中未包含有效的Token"));
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 获取用户信息 */
    async getInfo() {
      return new Promise((resolve, reject) => {
        getUserInfoApi()
          .then(res => {
            console.log("从后端获取到的用户信息:", res);
            if (res && res.success) {
              const data = res.data;
              // 目的：在更新Pinia状态的同时，也更新localStorage中的用户信息
              const userInfo =
                storageLocal().getItem<DataInfo<number>>(userKey);
              userInfo.username = data.username;
              userInfo.roles = data.roles;
              userInfo.permissions = data.permissions;
              userInfo.nickname = data.nickname;
              userInfo.avatar = data.avatar;
              storageLocal().setItem(userKey, userInfo); // 将更新后的信息存回localStorage

              // 更新Pinia状态
              this.SET_USERNAME(data.username);
              this.SET_ROLES(data.roles);
              this.SET_AVATAR(data.avatar);
              this.SET_PERMS(data.permissions);
              // --- ↑↑↑ 核心修改内容结束 ↑↑↑ ---
              resolve(data);
            } else {
              reject(new Error("获取用户信息失败"));
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 刷新`token` */
    async handRefreshToken(data) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then(data => {
            if (data) {
              setToken(data.data);
              resolve(data);
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
