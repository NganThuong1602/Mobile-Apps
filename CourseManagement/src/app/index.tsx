import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";

import CourseCard from "../components/CourseCard";
import type { Category } from "../models/Category";
import type { Course } from "../models/Course";
import { categoryService } from "../services/categoryService";
import { courseService } from "../services/courseService";

export default function CourseListScreen() {
  // =====================================
  // 1. STATE QUẢN LÝ DỮ LIỆU
  // =====================================
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // =====================================
  // 2. LẤY DỮ LIỆU TỪ MOCKAPI
  // =====================================
  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      setError("");

      Promise.all([courseService.getAll(), categoryService.getAll()])
        .then(([courseData, categoryData]) => {
          if (!active) return;

          setCourses(courseData);
          setCategories(categoryData);
        })
        .catch((err: Error) => {
          if (active) {
            setError(err.message);
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [reload]),
  );

  // =====================================
  // 3. LẤY TÊN DANH MỤC TỪ API
  // =====================================
  const categoryNames = useMemo(() => {
    return new Map(categories.map((item) => [String(item.id), item.name]));
  }, [categories]);

  // =====================================
  // 4. TÌM KIẾM VÀ LỌC KHÓA HỌC
  // =====================================
  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return courses.filter((course) => {
      const matchSearch = course.title
        .toLocaleLowerCase("vi")
        .includes(keyword);

      const matchCategory =
        categoryId === "" || String(course.categoryId) === String(categoryId);

      return matchSearch && matchCategory;
    });
  }, [courses, search, categoryId]);

  // =====================================
  // 5. DROPDOWN DANH MỤC
  // =====================================

  // Tên danh mục đang được chọn
  const selectedCategoryName =
    categoryId === ""
      ? "Tất cả danh mục"
      : (categoryNames.get(categoryId) ?? "Không xác định");

  // Xử lý khi chọn danh mục
  const handleSelectCategory = (id: string) => {
    setCategoryId(id);
    setCategoryModalVisible(false);
  };

  // =====================================
  // 6. GIAO DIỆN CHÍNH
  // =====================================
  return (
    <View style={styles.page}>
      <FlatList
        data={error ? [] : filteredCourses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={() => {
          setReload((value) => value + 1);
        }}
        // Khu vực tìm kiếm và lọc
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Khám phá khóa học</Text>

            {/* TÌM KIẾM THEO TÊN */}
            <TextInput
              style={styles.input}
              placeholder="Tìm theo tên khóa học..."
              placeholderTextColor="#8894a8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />

            {/* DROPDOWN DANH MỤC */}
            <Pressable
              style={styles.categoryButton}
              onPress={() => {
                setCategoryModalVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Chọn danh mục khóa học"
            >
              <Text style={styles.categoryButtonText}>
                {selectedCategoryName}
              </Text>

              <Text style={styles.arrow}>⌄</Text>
            </Pressable>

            {/* CÁC NÚT CHỨC NĂNG */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.secondary]}
                onPress={() => router.push("/categories")}
              >
                <Text style={styles.secondaryText}>Danh mục</Text>
              </Pressable>

              <Pressable
                style={styles.button}
                onPress={() => router.push("/courses/form")}
              >
                <Text style={styles.buttonText}>+ Thêm khóa học</Text>
              </Pressable>
            </View>

            {!error && !loading && (
              <Text style={styles.count}>
                {filteredCourses.length} khóa học
              </Text>
            )}
          </View>
        }
        // HIỂN THỊ MỖI KHÓA HỌC
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            categoryName={
              categoryNames.get(String(item.categoryId)) ?? "Không xác định"
            }
            onPress={() =>
              router.push({
                pathname: "/courses/[id]",
                params: { id: String(item.id) },
              })
            }
          />
        )}
        // XỬ LÝ LOADING, LỖI VÀ DANH SÁCH RỖNG
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color="#2456bf" />
            ) : (
              <>
                <Text style={styles.message}>
                  {error || "Không có khóa học phù hợp."}
                </Text>

                {error && (
                  <Pressable onPress={() => setReload((value) => value + 1)}>
                    <Text style={styles.retry}>Thử lại</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        }
      />

      {/* =================================
          7. MODAL CHỌN DANH MỤC
          DÙNG ĐƯỢC TRÊN IOS VÀ WEB
         ================================= */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCategoryModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          {/* Nhấn bên ngoài để đóng */}
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
            onPress={() => setCategoryModalVisible(false)}
            accessibilityLabel="Đóng chọn danh mục"
          />

          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn danh mục khóa học</Text>

            <ScrollView
              style={styles.categoryList}
              keyboardShouldPersistTaps="handled"
            >
              {/* HIỂN THỊ TẤT CẢ */}
              <Pressable
                style={[
                  styles.categoryOption,
                  categoryId === "" && styles.selectedOption,
                ]}
                onPress={() => handleSelectCategory("")}
              >
                <Text style={styles.optionText}>Tất cả danh mục</Text>

                {categoryId === "" && <Text style={styles.checkMark}>✓</Text>}
              </Pressable>

              {/* DANH MỤC LẤY TỪ MOCKAPI */}
              {categories.map((category) => {
                const selected = String(category.id) === categoryId;

                return (
                  <Pressable
                    key={String(category.id)}
                    style={[
                      styles.categoryOption,
                      selected && styles.selectedOption,
                    ]}
                    onPress={() => handleSelectCategory(String(category.id))}
                  >
                    <Text style={styles.optionText}>{category.name}</Text>

                    {selected && <Text style={styles.checkMark}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setCategoryModalVisible(false);
              }}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =====================================
// 8. STYLES
// =====================================
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    gap: 12,
    marginBottom: 16,
  },

  heading: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172541",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dde3ef",
    padding: 12,
    fontSize: 15,
    color: "#172541",
  },

  // Dropdown hiển thị gọn trên mọi nền tảng
  categoryButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dde3ef",
    paddingHorizontal: 14,
    height: 48,
  },

  categoryButtonText: {
    fontSize: 15,
    color: "#172541",
    flex: 1,
  },

  arrow: {
    fontSize: 22,
    color: "#65738b",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  button: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#2456bf",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },

  secondary: {
    backgroundColor: "#e5edff",
  },

  secondaryText: {
    color: "#2456bf",
    fontWeight: "700",
  },

  count: {
    fontSize: 14,
    color: "#65738b",
  },

  empty: {
    alignItems: "center",
    padding: 28,
    gap: 12,
  },

  message: {
    color: "#68758b",
    textAlign: "center",
  },

  retry: {
    color: "#2456bf",
    fontWeight: "700",
  },

  // =====================================
  // GIAO DIỆN MODAL
  // =====================================
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    maxHeight: "75%",
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#172541",
    marginBottom: 16,
  },

  categoryList: {
    flexGrow: 0,
  },

  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef1f5",
  },

  selectedOption: {
    backgroundColor: "#eef3ff",
    borderRadius: 8,
  },

  optionText: {
    fontSize: 16,
    color: "#172541",
  },

  checkMark: {
    fontSize: 18,
    color: "#2456bf",
    fontWeight: "700",
  },

  closeButton: {
    marginTop: 16,
    backgroundColor: "#2456bf",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  closeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
