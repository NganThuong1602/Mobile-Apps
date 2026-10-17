// Dữ liệu của resource /categories trên MockAPI.
export interface Category {
  id: string;
  name: string;
  description: string;
}

// MockAPI tự sinh id khi thêm danh mục.
export type CategoryInput = Omit<Category, "id">;
