import React, {
  useCallback,
  useState,
} from 'react';

import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import StudentForm from '../components/StudentForm';

import {
  addStudent,
  getStudents,
  isStudentCodeExists,
} from '../database/studentDatabase';

import { Student } from '../models/Student';
import { t } from '../i18n/translations';

export default function HomeScreen() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error(error);

      Alert.alert(
        t('error'),
        t('databaseError')
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadStudents();

    setRefreshing(false);
  };

  const handleAddStudent = async (
    student: Student
  ) => {
    try {
      const exists =
        await isStudentCodeExists(
          student.studentCode
        );

      if (exists) {
        Alert.alert(
          t('error'),
          t('duplicateCode')
        );

        return;
      }

      await addStudent(student);

      setModalVisible(false);

      await loadStudents();

      Alert.alert(
        t('success'),
        t('addSuccess')
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        t('error'),
        t('databaseError')
      );
    }
  };

  const openStudentDetail = (
    student: Student
  ) => {
    router.push({
      pathname: '/student/[id]',
      params: {
        id: String(student.id),
      },
    });
  };

  const renderStudent = ({
    item,
  }: {
    item: Student;
  }) => {
    return (
      <TouchableOpacity
        style={styles.studentCard}
        activeOpacity={0.7}
        onPress={() =>
          openStudentDetail(item)
        }
      >
        {item.avatar ? (
          <Image
            source={{
              uri: item.avatar,
            }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.defaultAvatar,
            ]}
          >
            <Text style={styles.defaultAvatarText}>
              {item.name
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {item.name}
          </Text>

          <Text style={styles.studentCode}>
            {t('studentCode')}:{' '}
            {item.studentCode}
          </Text>

          <Text style={styles.email}>
            {item.email}
          </Text>

          <Text style={styles.tapText}>
            {t('tapToView')} →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={Platform.OS === 'web' ? styles.webHeaderTitle : undefined}>
          <Text style={styles.title}>
            {t('studentList')}
          </Text>

          <Text style={styles.studentCount}>
            {students.length} sinh viên
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            setModalVisible(true)
          }
        >
          <Text style={styles.addButtonText}>
            + {t('addStudent')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderStudent}
        contentContainerStyle={
          students.length === 0
            ? styles.emptyList
            : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🎓
            </Text>

            <Text style={styles.emptyText}>
              {t('noStudents')}
            </Text>

            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() =>
                setModalVisible(true)
              }
            >
              <Text
                style={
                  styles.emptyAddButtonText
                }
              >
                + {t('addStudent')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('addStudent')}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text
                  style={
                    styles.closeButton
                  }
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
              <StudentForm
                buttonText={t('addStudent')}
                onSubmit={handleAddStudent}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },

  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    ...Platform.select({
      web: {
        flexWrap: 'wrap',
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
    fontWeight: 'bold',
    color: '#222222',
  },

  studentCount: {
    color: '#777777',
    marginTop: 4,
  },

  addButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
  },

  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  list: {
    padding: 14,
  },

  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
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
    backgroundColor: '#eeeeee',
  },

  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1976D2',
  },

  defaultAvatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },

  studentInfo: {
    flex: 1,
    marginLeft: 15,
    ...Platform.select({ web: { minWidth: 0 } }),
  },

  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },

  studentCode: {
    marginTop: 5,
    color: '#555555',
  },

  email: {
    marginTop: 3,
    color: '#777777',
  },

  tapText: {
    marginTop: 7,
    color: '#1976D2',
    fontSize: 12,
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },

  emptyIcon: {
    fontSize: 70,
  },

  emptyText: {
    fontSize: 18,
    color: '#777777',
    marginTop: 15,
  },

  emptyAddButton: {
    marginTop: 20,
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  emptyAddButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    flexShrink: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '90%',
  },

  modalScroll: {
    flexShrink: 1,
  },

  modalScrollContent: {
    paddingBottom: 24,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    ...Platform.select({ web: { flexShrink: 1, minWidth: 0 } }),
  },

  closeButton: {
    fontSize: 25,
    color: '#777777',
    padding: 5,
  },
});
