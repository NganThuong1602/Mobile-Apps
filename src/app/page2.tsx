import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page2() {
  const { name, studentId } = useLocalSearchParams<{
    name?: string;
    studentId?: string;
  }>();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Pressable style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>

      <View style={styles.information}>
        <Text style={styles.title}>Thông tin sinh viên</Text>
        <Text style={styles.label}>Tên</Text>
        <Text style={styles.value}>{name ?? ""}</Text>
        <Text style={styles.label}>Mã số sinh viên</Text>
        <Text style={styles.value}>{studentId ?? ""}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  information: { marginTop: 32 },
  title: {
    marginBottom: 28,
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
  },
  label: { marginTop: 14, color: "#6B7280", fontSize: 14 },
  value: { marginTop: 4, color: "#111827", fontSize: 18, fontWeight: "600" },
  button: {
    alignSelf: "flex-start",
    minWidth: 120,
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
