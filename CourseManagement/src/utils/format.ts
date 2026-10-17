export function formatPrice(value: number): string {
  return `${Number(value).toLocaleString("vi-VN")} VNĐ`;
}
