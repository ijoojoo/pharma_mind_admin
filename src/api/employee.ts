import { http } from "@/utils/http";
import type { Result, PaginatedResult } from "./types";

/**
 * @description 定义员工对象的类型结构
 */
export type Employee = {
  id: number;
  source_employee_id: string;
  employee_number: string;
  name: string;
  phone: string;
  store: number; // 关联的门店ID
};

/**
 * @description 获取员工列表 (分页)
 */
export const getEmployeeList = (params?: object) => {
  return http.request<{ data: PaginatedResult<Employee> }>(
    "get",
    "/api/employees/",
    { params }
  );
};

/**
 * @description 更新员工信息
 */
export const updateEmployee = (id: number, data: object) => {
  return http.request<Result>("put", `/api/employees/${id}/`, { data });
};

/**
 * @description 新增员工
 */
export const createEmployee = (data: object) => {
  return http.request<Result<Employee>>("post", "/api/employees/create/", {
    data
  });
};

/**
 * @description 删除员工
 */
export const deleteEmployee = (id: number) => {
  return http.request<Result>("delete", `/api/employees/${id}/`);
};
