// Dữ liệu của resource /courses trên MockAPI.
export interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  instructor: string;
  price: number;
  duration: number;
  thumbnail: string;
  trailerUrl: string;
  createdAt: string;
}

// Dữ liệu gửi bằng POST/PUT: không gửi id vì MockAPI tự sinh.
export type CourseInput = Omit<Course, "id">;

// TextInput trả về chuỗi kể cả với ô nhập số.
export interface CourseFormValues {
  title: string;
  description: string;
  categoryId: string;
  instructor: string;
  price: string;
  duration: string;
  thumbnail: string;
  trailerUrl: string;
}
