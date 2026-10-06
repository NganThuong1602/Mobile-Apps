import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import StudentForm from "../../components/StudentForm";

import {
  deleteStudent,
  getStudentById,
  isStudentCodeExists,
  updateStudent,
} from "../../database/studentDatabase";

import { t } from "../../i18n/translations";
import { Student } from "../../models/Student";

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [student, setStudent] = useState<Student | null>(null);

  const [loading, setLoading] = useState(true);

  const [editVisible, setEditVisible] = useState(false);

  const studentId = Number(id);

  const loadStudent = async () => {
    try {
      setLoading(true);

      const data = await getStudentById(studentId);

      setStudent(data);
    } catch (error) {
      console.error(error);

      Alert.alert(t("error"), t("databaseError"));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudent();
    }, [studentId]),
  );

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

            setEditVisible(false);

            await loadStudent();

            Alert.alert(t("success"), t("updateSuccess"));
          } catch (error) {
            console.error(error);

            Alert.alert(t("error"), t("databaseError"));
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!student?.id) {
      return;
    }

    Alert.alert(t("confirm"), t("confirmDelete"), [
      {
        text: t("cancel"),
        style: "cancel",
      },

      {
        text: t("delete"),
        style: "destructive",

        onPress: async () => {
          try {
            await deleteStudent(student.id!);

            Alert.alert(t("success"), t("deleteSuccess"), [
              {
                text: "OK",

                onPress: () => {
                  router.back();
                },
              },
            ]);
          } catch (error) {
            console.error(error);

            Alert.alert(t("error"), t("databaseError"));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t("studentNotFound")}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          {student.avatar ? (
            <Image
              source={{
                uri: student.avatar,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.defaultAvatarText}>
                {student.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.name}>{student.name}</Text>

          <Text style={styles.code}>{student.studentCode}</Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label={t("name")} value={student.name} />

          <InfoRow label={t("studentCode")} value={student.studentCode} />

          <InfoRow label={t("email")} value={student.email} />

          <InfoRow
            label={t("avatar")}
            value={student.avatar ? student.avatar : "-"}
          />
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditVisible(true)}
          >
            <Text style={styles.buttonText}>{t("editStudent")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.buttonText}>{t("deleteStudent")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("editStudent")}</Text>

              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
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
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  content: {
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  notFound: {
    fontSize: 18,
    color: "#777777",
  },

  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    padding: 25,
    marginBottom: 15,

    elevation: 2,

    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },

  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#eeeeee",
  },

  defaultAvatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1976D2",
  },

  defaultAvatarText: {
    color: "#ffffff",
    fontSize: 50,
    fontWeight: "bold",
  },

  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    color: "#222222",
  },

  code: {
    fontSize: 16,
    color: "#777777",
    marginTop: 5,
  },

  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 20,
  },

  infoRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },

  infoLabel: {
    fontSize: 13,
    color: "#888888",
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 16,
    color: "#222222",
  },

  actionContainer: {
    gap: 12,
  },

  editButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

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
