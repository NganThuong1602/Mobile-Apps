import type { Category } from "../models/Category";
import type { CourseFormValues } from "../models/Course";

// Lỗi theo tên trường.
// Ví dụ: { price: 'Học phí phải là số không âm.' }
export type CourseFieldErrors = Partial<Record<keyof CourseFormValues, string>>;

export type CategoryFieldErrors = Partial<
  Record<"name" | "description", string>
>;

// Kiểm tra đường dẫn HTTP/HTTPS.
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ==========================================
// 1. VALIDATION TỪNG TRƯỜNG KHÓA HỌC
// ==========================================

export function validateCourseFields(
  values: CourseFormValues,
  categories: Category[],
): CourseFieldErrors {
  const errors: CourseFieldErrors = {};

  // Tên khóa học
  if (!values.title.trim()) {
    errors.title = "Vui lòng nhập tên khóa học.";
  }

  // Mô tả
  if (!values.description.trim()) {
    errors.description = "Vui lòng nhập mô tả khóa học.";
  }

  // Danh mục phải tồn tại trên MockAPI
  const categoryExists = categories.some(
    (category) => String(category.id) === String(values.categoryId),
  );

  if (!values.categoryId || !categoryExists) {
    errors.categoryId = "Vui lòng chọn danh mục hợp lệ.";
  }

  // Giảng viên
  if (!values.instructor.trim()) {
    errors.instructor = "Vui lòng nhập giảng viên.";
  }

  // Học phí
  const price = Number(values.price);

  if (!values.price.trim() || !Number.isFinite(price) || price < 0) {
    errors.price = "Học phí phải là số không âm.";
  }

  // Thời lượng
  const duration = Number(values.duration);

  if (!values.duration.trim() || !Number.isFinite(duration) || duration <= 0) {
    errors.duration = "Thời lượng phải là số lớn hơn 0.";
  }

  // URL ảnh
  if (!isHttpUrl(values.thumbnail)) {
    errors.thumbnail =
      "URL ảnh bìa không hợp lệ. Hãy nhập URL http:// hoặc https://.";
  }

  // URL trailer
  if (!isHttpUrl(values.trailerUrl)) {
    errors.trailerUrl =
      "URL trailer không hợp lệ. Hãy nhập URL http:// hoặc https://.";
  }

  return errors;
}

// Giữ lại hàm cũ để tương thích code đã có.
// Hàm này chỉ trả về lỗi đầu tiên.
export function validateCourse(
  values: CourseFormValues,
  categories: Category[],
): string | null {
  const errors = validateCourseFields(values, categories);

  return Object.values(errors)[0] ?? null;
}

// ==========================================
// 2. VALIDATION DANH MỤC
// ==========================================

export function validateCategoryFields(
  name: string,
  description: string,
): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};

  if (!name.trim()) {
    errors.name = "Vui lòng nhập tên danh mục.";
  }

  if (!description.trim()) {
    errors.description = "Vui lòng nhập mô tả danh mục.";
  }

  return errors;
}

// Giữ hàm cũ để không ảnh hưởng code khác.
export function validateCategory(
  name: string,
  description: string,
): string | null {
  const errors = validateCategoryFields(name, description);

  return Object.values(errors)[0] ?? null;
}
