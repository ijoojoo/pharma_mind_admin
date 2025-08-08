import { http } from "@/utils/http";
import type { Result, PaginatedResult } from "./types";

/**
 * @description 定义门店对象的类型结构
 */
export type Store = {
  id: number;
  source_store_id: string;
  store_code: string;
  name: string;
  address: string;
  business_scope: string;
};

/**
 * @description 获取门店列表 (分页)
 */
export const getStoreList = (params?: object) => {
  return http.request<{ data: PaginatedResult<Store> }>("get", "/api/stores/", {
    params
  });
};

/**
 * @description 更新门店信息
 */
export const updateStore = (id: number, data: object) => {
  return http.request<Result>("put", `/api/stores/${id}/`, { data });
};

/**
 * @description 新增门店
 */
export const createStore = (data: object) => {
  return http.request<Result<Store>>("post", "/api/stores/create/", { data });
};

/**
 * @description 删除门店
 */
export const deleteStore = (id: number) => {
  return http.request<Result>("delete", `/api/stores/${id}/`);
};
