import { useCallback, useState } from "react";

import {
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";

import Page3 from "./page3";

import { getStudents } from "../database/studentDatabase";

import { t } from "../i18n/translations";
import { Student } from "../models/Student";

export default function Page1() {
  const [students, setStudents] = useState<Student[]>([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const loadStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error(error);

      Alert.alert(t("error"), t("databaseError"));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadStudents();

    setRefreshing(false);
  };

  const openStudentDetail = (student: Student) => {
    router.push({
      pathname: "/page2",
      params: {
        id: String(student.id),
      },
    });
  };

  const renderStudent = ({ item }: { item: Student }) => {
    return (
      <TouchableOpacity
        style={styles.studentCard}
        activeOpacity={0.7}
        onPress={() => openStudentDetail(item)}
      >
        {item.avatar ? (
          <Image
            source={{
              uri: item.avatar,
            }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.defaultAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>

          <Text style={styles.studentCode}>
            {t("studentCode")}: {item.studentCode}
          </Text>

          <Text style={styles.email}>{item.email}</Text>

          <Text style={styles.tapText}>{t("tapToView")} →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={Platform.OS === "web" ? styles.webHeaderTitle : undefined}>
          <Text style={styles.title}>{t("studentList")}</Text>

          <Text style={styles.studentCount}>{students.length} sinh viên</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ {t("addStudent")}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderStudent}
        contentContainerStyle={
          students.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎓</Text>

            <Text style={styles.emptyText}>{t("noStudents")}</Text>

            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyAddButtonText}>+ {t("addStudent")}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Page3
        mode="add"
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={loadStudents}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    ...Platform.select({
      web: {
        flexWrap: "wrap",
        gap: 12,
      },
    }),
  },

  webHeaderTitle: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    minWidth: 0,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222222",
  },

  studentCount: {
    color: "#777777",
    marginTop: 4,
  },

  addButton: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  list: {
    padding: 14,
  },

  studentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eeeeee",
  },

  defaultAvatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1976D2",
  },

  defaultAvatarText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
  },

  studentInfo: {
    flex: 1,
    marginLeft: 15,
    ...Platform.select({ web: { minWidth: 0 } }),
  },

  studentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222222",
  },

  studentCode: {
    marginTop: 5,
    color: "#555555",
  },

  email: {
    marginTop: 3,
    color: "#777777",
  },

  tapText: {
    marginTop: 7,
    color: "#1976D2",
    fontSize: 12,
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },

  emptyIcon: {
    fontSize: 70,
  },

  emptyText: {
    fontSize: 18,
    color: "#777777",
    marginTop: 15,
  },

  emptyAddButton: {
    marginTop: 20,
    backgroundColor: "#1976D2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  emptyAddButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});
