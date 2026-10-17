import type { Category, CategoryInput } from "../models/Category";
import { apiRequest } from "./api";

export const categoryService = {
  getAll: () => apiRequest<Category[]>("/categories"),

  create: (data: CategoryInput) =>
    apiRequest<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CategoryInput) =>
    apiRequest<Category>(`/categories/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiRequest<Category>(`/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
