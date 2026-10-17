import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router, Stack, useLocalSearchParams } from "expo-router";

import type { Category } from "../../models/Category";

import type { CourseFormValues, CourseInput } from "../../models/Course";

import { categoryService } from "../../services/categoryService";
import { courseService } from "../../services/courseService";

import {
  isHttpUrl,
  validateCourseFields,
  type CourseFieldErrors,
} from "../../utils/validation";

// ==========================================
// 1. DỮ LIỆU MẶC ĐỊNH
// ==========================================

const EMPTY_FORM: CourseFormValues = {
  title: "",
  description: "",
  categoryId: "",
  instructor: "",
  price: "",
  duration: "",
  thumbnail: "",
  trailerUrl: "",
};

// ==========================================
// 2. COMPONENT HIỂN THỊ LỖI
// ==========================================

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <Text style={styles.fieldError}>{message}</Text>;
}

// ==========================================
// 3. MÀN HÌNH THÊM / SỬA KHÓA HỌC
// ==========================================

export default function CourseFormScreen() {
  const { id } = useLocalSearchParams<{
    id?: string;
  }>();

  const courseId = Array.isArray(id) ? id[0] : id;

  const isEditing = Boolean(courseId);

  // STATE DỮ LIỆU FORM
  const [values, setValues] = useState<CourseFormValues>(EMPTY_FORM);

  const [categories, setCategories] = useState<Category[]>([]);

  const [createdAt, setCreatedAt] = useState("");

  // STATE LỖI TỪNG TRƯỜNG
  const [fieldErrors, setFieldErrors] = useState<CourseFieldErrors>({});

  // Lỗi API / lỗi kết nối chung
  const [requestError, setRequestError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageError, setImageError] = useState(false);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // ==========================================
  // 4. CẬP NHẬT DỮ LIỆU FORM
  // ==========================================

  const change = (field: keyof CourseFormValues, text: string) => {
    setValues((previous) => ({
      ...previous,
      [field]: text,
    }));

    // Xóa lỗi riêng của trường vừa sửa
    setFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setRequestError("");

    if (field === "thumbnail") {
      setImageError(false);
    }
  };

  // Kiểm tra khi người dùng rời khỏi một ô
  const checkField = (field: keyof CourseFormValues) => {
    const nextError = validateCourseFields(values, categories)[field];

    setFieldErrors((previous) => ({
      ...previous,
      [field]: nextError,
    }));
  };

  // ==========================================
  // 5. LẤY DỮ LIỆU TỪ MOCKAPI
  // ==========================================

  useEffect(() => {
    let active = true;

    setLoading(true);
    setRequestError("");

    const requests =
      isEditing && courseId
        ? Promise.all([
            categoryService.getAll(),
            courseService.getById(courseId),
          ])
        : Promise.all([categoryService.getAll(), Promise.resolve(null)]);

    requests
      .then(([categoryData, course]) => {
        if (!active) return;

        setCategories(categoryData);

        if (course) {
          setValues({
            title: course.title,
            description: course.description,
            categoryId: String(course.categoryId),
            instructor: course.instructor,
            price: String(course.price),
            duration: String(course.duration),
            thumbnail: course.thumbnail,
            trailerUrl: course.trailerUrl,
          });

          setCreatedAt(course.createdAt);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setRequestError(err.message);
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
  }, [courseId, isEditing]);

  // ==========================================
  // 6. XỬ LÝ DROPDOWN DANH MỤC
  // ==========================================

  const selectedCategory = categories.find(
    (item) => String(item.id) === String(values.categoryId),
  );

  const openCategoryModal = () => {
    Keyboard.dismiss();
    setCategoryModalVisible(true);
  };

  const selectCategory = (id: string) => {
    change("categoryId", id);
    setCategoryModalVisible(false);
  };

  // ==========================================
  // 7. VALIDATION VÀ LƯU KHÓA HỌC
  // ==========================================

  const save = async () => {
    if (saving) return;

    // Kiểm tra TẤT CẢ các ô
    const errors = validateCourseFields(values, categories);

    // Kiểm tra cả khả năng tải ảnh xem trước
    if (imageError) {
      errors.thumbnail =
        "Không thể tải ảnh từ URL này. Hãy dùng đường dẫn ảnh công khai.";
    }

    // Hiển thị lỗi ngay dưới từng ô
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    // Dữ liệu gửi API
    const payload: CourseInput = {
      title: values.title.trim(),
      description: values.description.trim(),
      categoryId: String(values.categoryId),
      instructor: values.instructor.trim(),
      price: Number(values.price),
      duration: Number(values.duration),
      thumbnail: values.thumbnail.trim(),
      trailerUrl: values.trailerUrl.trim(),
      createdAt: isEditing ? createdAt : new Date().toISOString().slice(0, 10),
    };

    try {
      setSaving(true);
      setRequestError("");

      if (isEditing && courseId) {
        // PUT
        await courseService.update(courseId, payload);
      } else {
        // POST
        await courseService.create(payload);
      }

      router.back();
    } catch (err) {
      // Lỗi kết nối / server không gắn với một ô cụ thể
      setRequestError(
        err instanceof Error ? err.message : "Không thể lưu khóa học.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // 8. LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2456bf" />

        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // ==========================================
  // 9. GIAO DIỆN FORM
  // ==========================================

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          title: isEditing ? "Sửa khóa học" : "Thêm khóa học",
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>
          {isEditing ? "Cập nhật khóa học" : "Tạo khóa học mới"}
        </Text>

        {/* ===================================
            1. TÊN KHÓA HỌC
           =================================== */}

        <Text style={styles.label}>Tên khóa học *</Text>

        <TextInput
          style={[styles.input, fieldErrors.title && styles.inputInvalid]}
          value={values.title}
          onChangeText={(text) => change("title", text)}
          onBlur={() => checkField("title")}
          placeholder="VD: React Native cơ bản"
        />

        <FieldError message={fieldErrors.title} />

        {/* ===================================
            2. MÔ TẢ KHÓA HỌC
           =================================== */}

        <Text style={styles.label}>Mô tả *</Text>

        <TextInput
          style={[
            styles.input,
            styles.multiline,
            fieldErrors.description && styles.inputInvalid,
          ]}
          value={values.description}
          onChangeText={(text) => change("description", text)}
          onBlur={() => checkField("description")}
          placeholder="Nội dung khóa học..."
          multiline
          textAlignVertical="top"
        />

        <FieldError message={fieldErrors.description} />

        {/* ===================================
            3. DANH MỤC
           =================================== */}

        <Text style={styles.label}>Danh mục *</Text>

        <Pressable
          style={[
            styles.categoryButton,
            fieldErrors.categoryId && styles.inputInvalid,
          ]}
          onPress={openCategoryModal}
          accessibilityRole="button"
          accessibilityLabel="Chọn danh mục khóa học"
        >
          <Text
            style={[
              styles.categoryButtonText,
              !selectedCategory && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {selectedCategory?.name ?? "-- Chọn danh mục --"}
          </Text>

          <Text style={styles.chevron}>⌄</Text>
        </Pressable>

        <FieldError message={fieldErrors.categoryId} />

        {/* ===================================
            4. GIẢNG VIÊN
           =================================== */}

        <Text style={styles.label}>Giảng viên *</Text>

        <TextInput
          style={[styles.input, fieldErrors.instructor && styles.inputInvalid]}
          value={values.instructor}
          onChangeText={(text) => change("instructor", text)}
          onBlur={() => checkField("instructor")}
          placeholder="Tên giảng viên"
        />

        <FieldError message={fieldErrors.instructor} />

        {/* ===================================
            5. HỌC PHÍ
           =================================== */}

        <Text style={styles.label}>Học phí (VNĐ) *</Text>

        <TextInput
          style={[styles.input, fieldErrors.price && styles.inputInvalid]}
          value={values.price}
          onChangeText={(text) => change("price", text)}
          onBlur={() => checkField("price")}
          keyboardType="decimal-pad"
          placeholder="VD: 500000"
        />

        <FieldError message={fieldErrors.price} />

        {/* ===================================
            6. THỜI LƯỢNG
           =================================== */}

        <Text style={styles.label}>Thời lượng (giờ) *</Text>

        <TextInput
          style={[styles.input, fieldErrors.duration && styles.inputInvalid]}
          value={values.duration}
          onChangeText={(text) => change("duration", text)}
          onBlur={() => checkField("duration")}
          keyboardType="decimal-pad"
          placeholder="VD: 30"
        />

        <FieldError message={fieldErrors.duration} />

        {/* ===================================
            7. URL ẢNH BÌA
           =================================== */}

        <Text style={styles.label}>URL ảnh bìa *</Text>

        <TextInput
          style={[styles.input, fieldErrors.thumbnail && styles.inputInvalid]}
          value={values.thumbnail}
          onChangeText={(text) => change("thumbnail", text)}
          onBlur={() => checkField("thumbnail")}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://.../cover.jpg"
        />

        {/* Lỗi nằm ngay dưới ô URL ảnh */}
        <FieldError message={fieldErrors.thumbnail} />

        {/* XEM TRƯỚC ẢNH */}
        {isHttpUrl(values.thumbnail) && !imageError && (
          <Image
            source={{
              uri: values.thumbnail.trim(),
            }}
            style={styles.preview}
            onError={() => setImageError(true)}
          />
        )}

        {/* ẢNH KHÔNG TẢI ĐƯỢC */}
        {imageError && !fieldErrors.thumbnail && (
          <FieldError message="Không tải được ảnh xem trước từ URL này." />
        )}

        {/* ===================================
            8. URL TRAILER
           =================================== */}

        <Text style={styles.label}>URL trailer (MP4) *</Text>

        <TextInput
          style={[styles.input, fieldErrors.trailerUrl && styles.inputInvalid]}
          value={values.trailerUrl}
          onChangeText={(text) => change("trailerUrl", text)}
          onBlur={() => checkField("trailerUrl")}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://.../trailer.mp4"
        />

        <FieldError message={fieldErrors.trailerUrl} />

        {/* ===================================
            9. LỖI API / KẾT NỐI
           =================================== */}

        {Boolean(requestError) && (
          <Text style={styles.requestError}>{requestError}</Text>
        )}

        {/* ===================================
            10. NÚT LƯU
           =================================== */}

        <Pressable
          style={[styles.saveButton, saving && styles.disabled]}
          disabled={saving || categories.length === 0}
          onPress={save}
        >
          <Text style={styles.saveText}>
            {saving
              ? "Đang lưu..."
              : isEditing
                ? "Lưu thay đổi"
                : "Thêm khóa học"}
          </Text>
        </Pressable>

        {/* NÚT HỦY */}
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Hủy</Text>
        </Pressable>
      </ScrollView>

      {/* =====================================
          10. MODAL CHỌN DANH MỤC
         ===================================== */}

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* NHẤN RA NGOÀI ĐỂ ĐÓNG */}
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCategoryModalVisible(false)}
            accessibilityLabel="Đóng danh sách danh mục"
          />

          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn danh mục khóa học</Text>

            <ScrollView style={styles.modalList}>
              {categories.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có danh mục.</Text>
              ) : (
                categories.map((category) => {
                  const selected =
                    String(category.id) === String(values.categoryId);

                  return (
                    <Pressable
                      key={String(category.id)}
                      style={[
                        styles.categoryOption,
                        selected && styles.selectedOption,
                      ]}
                      onPress={() => selectCategory(String(category.id))}
                    >
                      <Text style={styles.optionText}>{category.name}</Text>

                      {selected && <Text style={styles.checkMark}>✓</Text>}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <Pressable
              style={styles.closeButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={styles.closeText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// 11. STYLES
// ==========================================

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#65738b",
  },

  content: {
    padding: 16,
    paddingBottom: 42,
    gap: 9,
  },

  heading: {
    fontSize: 23,
    fontWeight: "800",
    color: "#192841",
    marginBottom: 6,
  },

  label: {
    color: "#273855",
    fontWeight: "700",
    marginTop: 7,
  },

  input: {
    backgroundColor: "#fff",
    borderColor: "#dce3ef",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#192841",
  },

  // Viền đỏ cho ô có lỗi
  inputInvalid: {
    borderColor: "#c33543",
  },

  // Lỗi ngay dưới ô nhập
  fieldError: {
    color: "#c33543",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 1,
  },

  multiline: {
    minHeight: 90,
  },

  categoryButton: {
    height: 48,
    backgroundColor: "#fff",
    borderColor: "#dce3ef",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryButtonText: {
    flex: 1,
    color: "#192841",
    fontSize: 15,
  },

  placeholderText: {
    color: "#8792a6",
  },

  chevron: {
    fontSize: 22,
    color: "#65738b",
    marginLeft: 12,
  },

  preview: {
    width: "100%",
    height: 190,
    borderRadius: 10,
    marginTop: 6,
  },

  requestError: {
    color: "#c33543",
    lineHeight: 22,
    marginTop: 12,
  },

  saveButton: {
    marginTop: 18,
    backgroundColor: "#2456bf",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  disabled: {
    opacity: 0.55,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  cancelButton: {
    alignItems: "center",
    padding: 13,
  },

  cancelText: {
    color: "#536782",
    fontWeight: "600",
  },

  // MODAL DANH MỤC
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 22,
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
    color: "#192841",
    marginBottom: 12,
  },

  modalList: {
    flexGrow: 0,
  },

  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f5",
  },

  selectedOption: {
    backgroundColor: "#eef3ff",
    borderRadius: 8,
  },

  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#192841",
  },

  checkMark: {
    color: "#2456bf",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },

  emptyText: {
    color: "#65738b",
    paddingVertical: 16,
  },

  closeButton: {
    backgroundColor: "#2456bf",
    padding: 13,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },

  closeText: {
    color: "#fff",
    fontWeight: "700",
  },
});
