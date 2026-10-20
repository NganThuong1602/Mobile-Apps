/** Sửa MSSV ở đây và tên project trong app.json nếu MSSV khác. */
export const STUDENT_ID = "BIT240222";
export const PROJECT_NAME = `${STUDENT_ID}_FoodManager`;
export const PREFIX = `${STUDENT_ID}_`;

/**
 * Lấy Base URL từ trang Project > API Endpoint trên mockapi.io.
 * Ví dụ: https://xxxxxxxx.mockapi.io/api/v1
 * KHÔNG thêm tên resource ở cuối.
 */
export const MOCK_API_BASE_URL =
  "https://6ad71664f71f154ac487bc24.mockapi.io/api/v1";
export const MOCK_API_CONFIGURED =
  MOCK_API_BASE_URL.startsWith("https://") &&
  !MOCK_API_BASE_URL.includes("YOUR-PROJECT");

export const CATEGORY_RESOURCE = `${PREFIX}DishCategory`;
export const DISH_RESOURCE = `${PREFIX}Dish`;
export const DB_NAME = `${STUDENT_ID}_FoodManager.db`;

export const TABLES = {
  categories: `${PREFIX}DishCategory`,
  dishes: `${PREFIX}Dish`,
  images: `${PREFIX}DishImage`,
  settings: `${PREFIX}Settings`,
};

export const column = (name: string) => `${PREFIX}${name}`;
