import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Category } from "../../models/Category";
import type { Course } from "../../models/Course";
import { categoryService } from "../../services/categoryService";
import { courseService } from "../../services/courseService";
import { confirmDelete } from "../../utils/confirm";
import { formatPrice } from "../../utils/format";

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = Array.isArray(id) ? id[0] : id;
  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [reload, setReload] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!courseId) {
        setError("Không tìm thấy ID khóa học.");
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      setError("");
      setImageError(false);
      Promise.all([courseService.getById(courseId), categoryService.getAll()])
        .then(([detail, categoryData]) => {
          if (active) {
            setCourse(detail);
            setCategories(categoryData);
          }
        })
        .catch((err: Error) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [courseId, reload]),
  );

  const removeCourse = () => {
    if (!course || deleting) return;
    confirmDelete(`Bạn có chắc muốn xóa khóa học “${course.title}”?`, () => {
      setDeleting(true);
      courseService
        .remove(course.id)
        .then(() => router.back())
        .catch((err: Error) => {
          setError(err.message);
          setDeleting(false);
        });
    });
  };

  const categoryName =
    categories.find((item) => String(item.id) === String(course?.categoryId))
      ?.name ?? "Không xác định";

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Chi tiết khóa học" }} />
      {loading ? (
        <ActivityIndicator size="large" color="#2456bf" />
      ) : error && !course ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => setReload((v) => v + 1)}>
            <Text style={styles.link}>Thử lại</Text>
          </Pressable>
        </View>
      ) : course ? (
        <>
          {!imageError && course.thumbnail ? (
            <Image
              source={{ uri: course.thumbnail }}
              style={styles.image}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text>Không tải được ảnh</Text>
            </View>
          )}
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.category}>{categoryName}</Text>
          <View style={styles.card}>
            <Text style={styles.info}>Giảng viên: {course.instructor}</Text>
            <Text style={styles.info}>
              Học phí: {formatPrice(course.price)}
            </Text>
            <Text style={styles.info}>Thời lượng: {course.duration} giờ</Text>
            <Text style={styles.info}>Ngày tạo: {course.createdAt}</Text>
          </View>
          <Text style={styles.section}>Mô tả khóa học</Text>
          <Text style={styles.description}>{course.description}</Text>
          {Boolean(error) && <Text style={styles.error}>{error}</Text>}
          <Pressable
            style={styles.primary}
            onPress={() =>
              router.push({
                pathname: "/trailer",
                params: { url: course.trailerUrl, title: course.title },
              })
            }
          >
            <Text style={styles.primaryText}>▶ Xem trailer</Text>
          </Pressable>
          <View style={styles.row}>
            <Pressable
              style={[styles.primary, styles.edit]}
              onPress={() =>
                router.push({
                  pathname: "/courses/form",
                  params: { id: course.id },
                })
              }
            >
              <Text style={styles.editText}>Sửa khóa học</Text>
            </Pressable>
            <Pressable
              style={[styles.primary, styles.danger]}
              disabled={deleting}
              onPress={removeCourse}
            >
              <Text style={styles.primaryText}>
                {deleting ? "Đang xóa..." : "Xóa khóa học"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text>Không tìm thấy khóa học.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  center: { alignItems: "center", gap: 10, marginTop: 30 },
  image: { width: "100%", height: 225, borderRadius: 14 },
  placeholder: {
    backgroundColor: "#e8edf7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#192841" },
  category: { color: "#2456bf", fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10 },
  info: { color: "#33415c", fontSize: 15 },
  section: { fontSize: 18, fontWeight: "700", color: "#192841" },
  description: { fontSize: 15, lineHeight: 24, color: "#4b5971" },
  primary: {
    backgroundColor: "#2456bf",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  edit: { flex: 1, backgroundColor: "#e2eaff" },
  editText: { color: "#2456bf", fontWeight: "700" },
  danger: { flex: 1, backgroundColor: "#ca3848" },
  error: { color: "#c03244", lineHeight: 22 },
  link: { color: "#2456bf", fontWeight: "700" },
});
