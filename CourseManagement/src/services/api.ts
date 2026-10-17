// Địa chỉ API của project CourseManagement đã tạo trên MockAPI.
export const BASE_URL = "https://6ad32cfb59dd78397bbb6f05.mockapi.io/api/v1";

/**
 * Hàm HTTP chung: gửi request, đọc JSON, kiểm tra mã lỗi.
 * Mọi service đều gọi hàm này thay vì viết lại fetch().
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const raw = await response.text();
    let data: unknown = null;

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error("Phản hồi từ API không phải JSON hợp lệ.");
      }
    }

    if (!response.ok) {
      throw new Error(`API báo lỗi ${response.status}. Vui lòng thử lại.`);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Yêu cầu quá thời gian. Hãy kiểm tra mạng.");
    }
    if (error instanceof TypeError) {
      throw new Error("Không kết nối được MockAPI. Hãy kiểm tra Internet.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
