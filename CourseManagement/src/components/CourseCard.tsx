import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Course } from "../models/Course";
import { formatPrice } from "../utils/format";

type Props = {
  course: Course;
  categoryName: string;
  onPress: () => void;
};

export default function CourseCard({ course, categoryName, onPress }: Props) {
  const [imageError, setImageError] = useState(false);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {!imageError && course.thumbnail ? (
        <Image
          source={{ uri: course.thumbnail }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>Không tải được ảnh</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.category}>{categoryName}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.info}>Giảng viên: {course.instructor}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(course.price)}</Text>
          <Text style={styles.duration}>{course.duration} giờ</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e6eaf2",
  },
  image: { width: "100%", height: 165 },
  placeholder: {
    backgroundColor: "#e8edf7",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#697a95" },
  body: { padding: 14, gap: 7 },
  category: { color: "#2456bf", fontSize: 12, fontWeight: "700" },
  title: { fontSize: 18, color: "#1b2740", fontWeight: "700" },
  info: { color: "#68758b", fontSize: 14 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  price: { color: "#0e8a61", fontSize: 16, fontWeight: "700" },
  duration: { color: "#68758b", fontSize: 13 },
});
