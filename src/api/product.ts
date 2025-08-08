import { http } from "@/utils/http";
import type { Result, PaginatedResult } from "./types";

/**
 * @description 定义商品对象的类型结构
 */
export type Product = {
  id: number;
  product_code: string;
  name: string;
  specification: string;
  manufacturer: string;
  retail_price: number;
  // 您可以根据 models.py 文件，在这里添加更多商品相关的字段
};

/**
 * @description 获取商品列表 (分页)
 */
export const getProductList = (params?: object) => {
  return http.request<{ data: PaginatedResult<Product> }>(
    "get",
    "/api/products/",
    { params }
  );
};

/**
 * @description 更新商品信息
 */
export const updateProduct = (id: number, data: object) => {
  return http.request<Result>("put", `/api/products/${id}/`, { data });
};

/**
 * @description 新增商品
 */
export const createProduct = (data: object) => {
  return http.request<Result<Product>>("post", "/api/products/create/", {
    data
  });
};

/**
 * @description 删除商品
 */
export const deleteProduct = (id: number) => {
  return http.request<Result>("delete", `/api/products/${id}/`);
};

// --- ↓↓↓ 新增内容开始 ↓↓↓ ---
/**
 * @description 请求AI对商品进行自动分类
 */
export const requestAIAutoCategorize = () => {
  return http.request<Result>("post", "/api/ai/products/auto-categorize/");
};
// --- ↑↑↑ 新增内容结束 ↑↑↑ ---
