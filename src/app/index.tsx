import React, { useState } from "react";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const trimmedName = name.trim();
  const trimmedStudentId = studentId.trim();
  const nameError = submitted && !trimmedName;
  const studentIdError = submitted && !trimmedStudentId;

  const handleContinue = () => {
    setSubmitted(true);

    if (!trimmedName || !trimmedStudentId) {
      return;
    }

    router.push({
      pathname: "/page2",
      params: { name: trimmedName, studentId: trimmedStudentId },
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.row}>
            <View style={[styles.box, styles.halfBox, styles.box1]}>
              <Text style={styles.boxText}>1</Text>
            </View>
            <View style={[styles.box, styles.halfBox, styles.box2]}>
              <Text style={styles.boxText}>2</Text>
            </View>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.smallBoxes}>
              <View style={[styles.box, styles.smallBox, styles.box3]}>
                <Text style={[styles.boxText, styles.textBlack]}>3</Text>
              </View>
              <View style={[styles.box, styles.smallBox, styles.box4]}>
                <Text style={styles.boxText}>4</Text>
              </View>
            </View>
            <View style={[styles.box, styles.box5]}>
              <Text style={styles.boxText}>5</Text>
            </View>
          
          </View>

          <View style={[styles.box, styles.box6]}>
            <Text style={styles.boxText}>6</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="Tên"
              autoCapitalize="words"
            />
            {nameError && (
              <Text style={styles.errorText}>Vui lòng nhập tên.</Text>
            )}

            <TextInput
              style={[styles.input, studentIdError && styles.inputError]}
              value={studentId}
              onChangeText={setStudentId}
              placeholder="Mã số sinh viên"
              autoCapitalize="characters"
            />
            {studentIdError && (
              <Text style={styles.errorText}>
                Vui lòng nhập mã số sinh viên.
              </Text>
            )}
          </View>

          <Pressable style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Click me</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  keyboardContainer: { flex: 1 },
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  row: { height: 80, flexDirection: "row", gap: 10, marginBottom: 10 },
  middleRow: { height: 120, flexDirection: "row", gap: 10, marginBottom: 10 },
  smallBoxes: { flex: 1, flexDirection: "row", gap: 10 },
  box: { alignItems: "center", justifyContent: "center" },
  halfBox: { flex: 1 },
  smallBox: { flex: 1 },
  boxText: { color: "#fff", fontSize: 40, fontWeight: "bold" },
  textBlack: { color: "#000" },
  box1: { backgroundColor: "#2D7EE4" },
  box2: { backgroundColor: "#EF3C3D" },
  box3: { backgroundColor: "#F7C617" },
  box4: { backgroundColor: "#2CA05A" },
  box5: { flex: 1, backgroundColor: "#7A3EE8" },
  box6: { height: 120, marginBottom: 16, backgroundColor: "#F37414" },
  form: { gap: 6 },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    borderRadius: 8,
    color: "#111827",
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#DC2626" },
  errorText: { marginBottom: 2, color: "#DC2626", fontSize: 13 },
  button: {
    alignSelf: "center",
    minWidth: 120,
    alignItems: "center",
    marginTop: "auto",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
