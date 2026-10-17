import type { Course, CourseInput } from "../models/Course";
import { apiRequest } from "./api";

export const courseService = {
  getAll: () => apiRequest<Course[]>("/courses"),

  getById: (id: string) =>
    apiRequest<Course>(`/courses/${encodeURIComponent(id)}`),

  create: (data: CourseInput) =>
    apiRequest<Course>("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CourseInput) =>
    apiRequest<Course>(`/courses/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiRequest<Course>(`/courses/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
