import { http } from "@/utils/http";
import type { Result, PaginatedResult } from "./types";

/**
 * @description 定义会员对象的类型结构
 */
export type Member = {
  id: number;
  source_member_id: string;
  card_number: string;
  name: string;
  phone: string;
  address: string;
  issuing_store: number; // 关联的门店ID
  current_points: number;
  // 您可以根据 models.py 文件，在这里添加更多会员相关的字段
};

/**
 * @description 获取会员列表 (分页)
 */
export const getMemberList = (params?: object) => {
  return http.request<{ data: PaginatedResult<Member> }>(
    "get",
    "/api/members/",
    { params }
  );
};

/**
 * @description 更新会员信息
 */
export const updateMember = (id: number, data: object) => {
  return http.request<Result>("put", `/api/members/${id}/`, { data });
};

/**
 * @description 新增会员
 */
export const createMember = (data: object) => {
  return http.request<Result<Member>>("post", "/api/members/create/", { data });
};

/**
 * @description 删除会员
 */
export const deleteMember = (id: number) => {
  return http.request<Result>("delete", `/api/members/${id}/`);
};
