
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Stack, useFocusEffect } from 'expo-router';

import type { Category } from '../../models/Category';

import { categoryService } from '../../services/categoryService';
import { courseService } from '../../services/courseService';
import { confirmDelete } from '../../utils/confirm';

import {
  validateCategoryFields,
  type CategoryFieldErrors,
} from '../../utils/validation';

// ==========================================
// 1. HÀM HIỂN THỊ POPUP
// ==========================================

function showPopup(title: string, message: string) {
  // Trình duyệt Web
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    // Expo Go trên iOS / Android
    Alert.alert(title, message, [
      { text: 'Đã hiểu' },
    ]);
  }
}

// ==========================================
// 2. MÀN HÌNH QUẢN LÝ DANH MỤC
// ==========================================

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listError, setListError] = useState('');
  const [reload, setReload] = useState(0);

  // State form thêm/sửa
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [fieldErrors, setFieldErrors] =
    useState<CategoryFieldErrors>({});

  const [saveError, setSaveError] = useState('');

  // ==========================================
  // 3. LẤY DANH SÁCH DANH MỤC
  // ==========================================

  const loadCategories = async () => {
    const result = await categoryService.getAll();
    setCategories(result);
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);
      setListError('');

      categoryService
        .getAll()
        .then((result) => {
          if (active) setCategories(result);
        })
        .catch((err: Error) => {
          if (active) setListError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [reload])
  );

  // ==========================================
  // 4. MỞ FORM THÊM / SỬA
  // ==========================================

  const openForm = (category?: Category) => {
    setEditing(category ?? null);

    setName(category?.name ?? '');
    setDescription(category?.description ?? '');

    setFieldErrors({});
    setSaveError('');

    setModalVisible(true);
  };

  // ==========================================
  // 5. LƯU DANH MỤC
  // ==========================================

  const saveCategory = async () => {
    const errors = validateCategoryFields(
      name,
      description
    );

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0 || saving) {
      return;
    }

    try {
      setSaving(true);
      setSaveError('');

      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      if (editing) {
        await categoryService.update(
          editing.id,
          payload
        );
      } else {
        await categoryService.create(payload);
      }

      await loadCategories();
      setModalVisible(false);

    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Không thể lưu danh mục.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // 6. XÓA DANH MỤC
  // ==========================================

  const deleteCategory = async (category: Category) => {
    if (busyId) return;

    setBusyId(category.id);

    try {
      // GET toàn bộ khóa học để kiểm tra
      const courses = await courseService.getAll();

      const isUsed = courses.some(
        (course) =>
          String(course.categoryId) ===
          String(category.id)
      );

      // Nếu có khóa học -> Hiện popup, KHÔNG xóa
      if (isUsed) {
        showPopup(
          'Không thể xóa danh mục',
          `Danh mục “${category.name}” đang có khóa học. Hãy chuyển hoặc xóa các khóa học thuộc danh mục này trước.`
        );

        setBusyId(null);
        return;
      }

      // Danh mục không có khóa học
      // -> Yêu cầu xác nhận trước khi xóa
      setBusyId(null);

      confirmDelete(
        `Bạn chắc chắn muốn xóa danh mục “${category.name}”?`,
        () => {
          setBusyId(category.id);

          void (async () => {
            try {
              await categoryService.remove(category.id);
              await loadCategories();

            } catch (err) {
              showPopup(
                'Xóa thất bại',
                err instanceof Error
                  ? err.message
                  : 'Không thể xóa danh mục.'
              );
            } finally {
              setBusyId(null);
            }
          })();
        }
      );

    } catch (err) {
      showPopup(
        'Không thể kiểm tra danh mục',
        err instanceof Error
          ? err.message
          : 'Vui lòng kiểm tra kết nối mạng.'
      );

      setBusyId(null);
    }
  };

  // ==========================================
  // 7. GIAO DIỆN CHÍNH
  // ==========================================

  return (
    <View style={styles.page}>
      <Stack.Screen
        options={{ title: 'Quản lý danh mục' }}
      />

      <View style={styles.toolbar}>
        <Text style={styles.heading}>
          Danh mục khóa học
        </Text>

        <Pressable
          style={styles.addButton}
          onPress={() => openForm()}
        >
          <Text style={styles.addText}>
            + Thêm danh mục
          </Text>
        </Pressable>

        {/* Chỉ hiển thị lỗi tải danh sách tại đây */}
        {Boolean(listError) && (
          <Text style={styles.error}>
            {listError}
          </Text>
        )}
      </View>

      {/* DANH SÁCH DANH MỤC */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2456bf"
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) =>
            String(item.id)
          }
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={() =>
            setReload((n) => n + 1)
          }

          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.muted}>
                {listError || 'Chưa có danh mục nào.'}
              </Text>

              {Boolean(listError) && (
                <Pressable
                  onPress={() =>
                    setReload((n) => n + 1)
                  }
                >
                  <Text style={styles.retry}>
                    Thử lại
                  </Text>
                </Pressable>
              )}
            </View>
          }

          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemName}>
                {item.name}
              </Text>

              <Text style={styles.muted}>
                {item.description}
              </Text>

              <View style={styles.actions}>

                {/* SỬA */}
                <Pressable
                  style={styles.editButton}
                  onPress={() => openForm(item)}
                >
                  <Text style={styles.editText}>
                    Sửa
                  </Text>
                </Pressable>

                {/* XÓA */}
                <Pressable
                  style={styles.deleteButton}
                  disabled={busyId !== null}
                  onPress={() =>
                    void deleteCategory(item)
                  }
                >
                  <Text style={styles.deleteText}>
                    {busyId === item.id
                      ? 'Đang kiểm tra...'
                      : 'Xóa'}
                  </Text>
                </Pressable>

              </View>
            </View>
          )}
        />
      )}

      {/* ======================================
          8. MODAL THÊM / SỬA DANH MỤC
         ====================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) {
            setModalVisible(false);
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editing
                ? 'Sửa danh mục'
                : 'Thêm danh mục'}
            </Text>

            {/* TÊN DANH MỤC */}
            <Text style={styles.label}>
              Tên danh mục *
            </Text>

            <TextInput
              style={[
                styles.input,
                fieldErrors.name &&
                  styles.inputInvalid,
              ]}
              value={name}
              onChangeText={(text) => {
                setName(text);

                setFieldErrors((prev) => ({
                  ...prev,
                  name: undefined,
                }));
              }}
              placeholder="VD: Lập trình Mobile"
            />

            {Boolean(fieldErrors.name) && (
              <Text style={styles.fieldError}>
                {fieldErrors.name}
              </Text>
            )}

            {/* MÔ TẢ */}
            <Text style={styles.label}>
              Mô tả *
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.multiline,
                fieldErrors.description &&
                  styles.inputInvalid,
              ]}
              value={description}
              onChangeText={(text) => {
                setDescription(text);

                setFieldErrors((prev) => ({
                  ...prev,
                  description: undefined,
                }));
              }}
              multiline
              placeholder="Mô tả danh mục..."
            />

            {Boolean(fieldErrors.description) && (
              <Text style={styles.fieldError}>
                {fieldErrors.description}
              </Text>
            )}

            {/* LỖI KẾT NỐI / LƯU API */}
            {Boolean(saveError) && (
              <Text style={styles.fieldError}>
                {saveError}
              </Text>
            )}

            {/* NÚT HỦY / LƯU */}
            <View style={styles.actions}>
              <Pressable
                style={styles.cancelButton}
                disabled={saving}
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text style={styles.editText}>
                  Hủy
                </Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                disabled={saving}
                onPress={saveCategory}
              >
                <Text style={styles.saveText}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ==========================================
// 9. STYLES
// ==========================================

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  toolbar: {
    padding: 16,
    gap: 12,
  },

  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#192841',
  },

  addButton: {
    padding: 13,
    backgroundColor: '#2456bf',
    alignItems: 'center',
    borderRadius: 10,
  },

  addText: {
    color: '#fff',
    fontWeight: '700',
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 12,
  },

  loader: {
    marginTop: 40,
  },

  item: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 9,
    borderWidth: 1,
    borderColor: '#e2e8f1',
  },

  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#192841',
  },

  muted: {
    color: '#65738b',
    lineHeight: 21,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  editButton: {
    flex: 1,
    padding: 11,
    alignItems: 'center',
    backgroundColor: '#e2eaff',
    borderRadius: 9,
  },

  deleteButton: {
    flex: 1,
    padding: 11,
    alignItems: 'center',
    backgroundColor: '#fde9ec',
    borderRadius: 9,
  },

  editText: {
    color: '#2456bf',
    fontWeight: '700',
  },

  deleteText: {
    color: '#b72f43',
    fontWeight: '700',
  },

  error: {
    color: '#be3145',
    lineHeight: 22,
  },

  empty: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },

  retry: {
    color: '#2456bf',
    fontWeight: '700',
  },

  overlay: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'center',
    padding: 18,
  },

  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#192841',
  },

  label: {
    fontWeight: '700',
    color: '#35415b',
  },

  input: {
    borderColor: '#dbe1eb',
    borderWidth: 1,
    borderRadius: 9,
    padding: 12,
    backgroundColor: '#fff',
  },

  inputInvalid: {
    borderColor: '#c33543',
  },

  fieldError: {
    color: '#be3145',
    fontSize: 13,
    lineHeight: 19,
  },

  multiline: {
    minHeight: 85,
    textAlignVertical: 'top',
  },

  cancelButton: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: '#e2eaff',
  },

  saveButton: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: '#2456bf',
  },

  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
