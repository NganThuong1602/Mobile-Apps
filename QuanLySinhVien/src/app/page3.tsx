import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addStudent,
  isStudentCodeExists,
  updateStudent,
} from "../database/studentDatabase";
import { t } from "../i18n/translations";
import { Student } from "../models/Student";

type Page3Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
} & ({ mode: "add"; student?: never } | { mode: "edit"; student: Student });

export default function Page3({
  mode,
  visible,
  student,
  onClose,
  onSaved,
}: Page3Props) {
  const handleAddStudent = async (student: Student) => {
    try {
      const exists = await isStudentCodeExists(student.studentCode);

      if (exists) {
        Alert.alert(t("error"), t("duplicateCode"));

        return;
      }

      await addStudent(student);

      onClose();

      await onSaved();

      Alert.alert(t("success"), t("addSuccess"));
    } catch (error) {
      console.error(error);

      Alert.alert(t("error"), t("databaseError"));
    }
  };

  const handleUpdate = async (updatedStudent: Student) => {
    if (!student) {
      return;
    }

    const exists = await isStudentCodeExists(
      updatedStudent.studentCode,
      student.id,
    );

    if (exists) {
      Alert.alert(t("error"), t("duplicateCode"));

      return;
    }

    Alert.alert(t("confirm"), t("confirmUpdate"), [
      {
        text: t("cancel"),
        style: "cancel",
      },

      {
        text: t("edit"),

        onPress: async () => {
          try {
            await updateStudent({
              ...updatedStudent,
              id: student.id,
            });

            onClose();

            await onSaved();

            Alert.alert(t("success"), t("updateSuccess"));
          } catch (error) {
            console.error(error);

            Alert.alert(t("error"), t("databaseError"));
          }
        },
      },
    ]);
  };

  if (mode === "add") {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => onClose()}
      >
        <KeyboardAvoidingView
          style={addStyles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={addStyles.modalContainer}>
            <View style={addStyles.modalHeader}>
              <Text style={addStyles.modalTitle}>{t("addStudent")}</Text>

              <TouchableOpacity onPress={() => onClose()}>
                <Text style={addStyles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={addStyles.modalScroll}
              contentContainerStyle={addStyles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
            >
              <StudentForm
                buttonText={t("addStudent")}
                onSubmit={handleAddStudent}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => onClose()}
    >
      <View style={editStyles.modalOverlay}>
        <View style={editStyles.modalContainer}>
          <View style={editStyles.modalHeader}>
            <Text style={editStyles.modalTitle}>{t("editStudent")}</Text>

            <TouchableOpacity onPress={() => onClose()}>
              <Text style={editStyles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <StudentForm
              initialStudent={student}
              buttonText={t("save")}
              onSubmit={handleUpdate}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface StudentFormProps {
  initialStudent?: Student;
  buttonText: string;
  onSubmit: (student: Student) => void;
}

function StudentForm({
  initialStudent,
  buttonText,
  onSubmit,
}: StudentFormProps) {
  const [name, setName] = useState(initialStudent?.name ?? "");

  const [studentCode, setStudentCode] = useState(
    initialStudent?.studentCode ?? "",
  );

  const [email, setEmail] = useState(initialStudent?.email ?? "");

  const [avatar, setAvatar] = useState(initialStudent?.avatar ?? "");

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t("notification"), t("imagePermission"));

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(value);
  };

  const handleSubmit = () => {
    const cleanName = name.trim();
    const cleanCode = studentCode.trim();
    const cleanEmail = email.trim();
    const cleanAvatar = avatar.trim();

    if (!cleanName || !cleanCode || !cleanEmail) {
      Alert.alert(t("error"), t("fillAllFields"));

      return;
    }

    if (/\p{Nd}/u.test(cleanName)) {
      Alert.alert(t("error"), t("invalidName"));
      return;
    }

    if (!/^B[A-Z]{2}(?:2[2-9]|30)[0-9]{4}$/.test(cleanCode)) {
      Alert.alert(t("error"), t("invalidStudentCode"));
      return;
    }

    if (!validateEmail(cleanEmail)) {
      Alert.alert(t("error"), t("invalidEmail"));

      return;
    }

    onSubmit({
      id: initialStudent?.id,
      name: cleanName,
      studentCode: cleanCode,
      email: cleanEmail,
      avatar: cleanAvatar,
    });
  };

  return (
    <View style={formStyles.container}>
      <Text style={formStyles.label}>{t("name")}</Text>

      <TextInput
        style={formStyles.input}
        placeholder={t("namePlaceholder")}
        value={name}
        onChangeText={(value) => setName(value.replace(/\p{Nd}/gu, ""))}
      />

      <Text style={formStyles.label}>{t("studentCode")}</Text>

      <TextInput
        style={formStyles.input}
        placeholder={t("codePlaceholder")}
        value={studentCode}
        onChangeText={setStudentCode}
        autoCapitalize="characters"
      />

      <Text style={formStyles.label}>{t("email")}</Text>

      <TextInput
        style={formStyles.input}
        placeholder={t("emailPlaceholder")}
        value={email}
        onChangeText={setEmail}
        keyboardType={"email-address" as KeyboardTypeOptions}
        autoCapitalize="none"
      />

      <Text style={formStyles.label}>{t("avatar")}</Text>

      <TextInput
        style={formStyles.input}
        placeholder={t("avatarPlaceholder")}
        value={avatar}
        onChangeText={setAvatar}
        autoCapitalize="none"
      />

      <Text style={formStyles.orText}>{t("or")}</Text>

      <TouchableOpacity style={formStyles.imageButton} onPress={pickImage}>
        <Text style={formStyles.imageButtonText}>📷 {t("chooseImage")}</Text>
      </TouchableOpacity>

      {avatar !== "" && (
        <View style={formStyles.previewContainer}>
          <Image source={{ uri: avatar }} style={formStyles.avatarPreview} />
        </View>
      )}

      <TouchableOpacity style={formStyles.saveButton} onPress={handleSubmit}>
        <Text style={formStyles.saveButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const formStyles = StyleSheet.create({
  container: {
    width: "100%",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
    color: "#222",
  },

  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },

  orText: {
    textAlign: "center",
    marginVertical: 10,
    color: "#777777",
  },

  imageButton: {
    borderWidth: 1,
    borderColor: "#1976D2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  imageButtonText: {
    color: "#1976D2",
    fontSize: 15,
    fontWeight: "600",
  },

  previewContainer: {
    alignItems: "center",
    marginTop: 20,
  },

  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eeeeee",
  },

  saveButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

const addStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    flexShrink: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: "90%",
  },

  modalScroll: {
    flexShrink: 1,
  },

  modalScrollContent: {
    paddingBottom: 24,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    ...Platform.select({ web: { flexShrink: 1, minWidth: 0 } }),
  },

  closeButton: {
    fontSize: 25,
    color: "#777777",
    padding: 5,
  },
});

const editStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },

  closeButton: {
    fontSize: 25,
    color: "#777777",
    padding: 5,
  },
});
