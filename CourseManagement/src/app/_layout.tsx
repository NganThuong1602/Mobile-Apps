import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          // Màu thanh điều hướng
          headerStyle: {
            backgroundColor: "#ffffff",
          },

          // Màu nút Back và tiêu đề
          headerTintColor: "#1641a3",

          // Màu nền màn hình
          contentStyle: {
            backgroundColor: "#f5f7fb",
          },

          // Kiểu chữ tiêu đề
          headerTitleStyle: {
            fontWeight: "600",
          },

          // Chỉ hiện mũi tên Back, ẩn tên màn trước
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Quản lý khóa học",
          }}
        />
      </Stack>
    </>
  );
}
