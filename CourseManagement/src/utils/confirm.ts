import { Alert, Platform } from "react-native";

// Alert.alert không hỗ trợ đầy đủ trên Web, nên có nhánh xác nhận riêng.
export function confirmDelete(message: string, onConfirm: () => void): void {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(message)) {
      onConfirm();
    }
    return;
  }

  Alert.alert("Xác nhận xóa", message, [
    { text: "Hủy", style: "cancel" },
    { text: "Xóa", style: "destructive", onPress: onConfirm },
  ]);
}
