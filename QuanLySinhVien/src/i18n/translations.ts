import { getLocales } from 'expo-localization';

const vi = {
  appName: 'Quản lý sinh viên',

  studentList: 'Danh sách sinh viên',
  studentDetail: 'Thông tin sinh viên',

  addStudent: 'Thêm sinh viên',
  editStudent: 'Sửa sinh viên',
  deleteStudent: 'Xóa sinh viên',

  name: 'Họ tên sinh viên',
  studentCode: 'Mã số sinh viên',
  email: 'Email',
  avatar: 'Ảnh đại diện',

  namePlaceholder: 'Nhập họ tên sinh viên',
  codePlaceholder: 'Nhập mã số sinh viên',
  emailPlaceholder: 'Nhập email',
  avatarPlaceholder: 'Nhập link ảnh avatar',

  chooseImage: 'Chọn ảnh từ thiết bị',
  save: 'Lưu',
  cancel: 'Hủy',
  edit: 'Sửa',
  delete: 'Xóa',

  noStudents: 'Chưa có sinh viên nào',
  tapToView: 'Nhấn để xem chi tiết',

  error: 'Lỗi',
  success: 'Thành công',
  notification: 'Thông báo',
  confirm: 'Xác nhận',

  fillAllFields: 'Vui lòng nhập đầy đủ thông tin.',
  invalidEmail: 'Email không hợp lệ.',
  invalidName: 'Họ tên không được chứa số.',
  invalidStudentCode:
    'Mã sinh viên phải gồm 9 ký tự: B, 2 chữ cái A–Z, 2 chữ số từ 22 đến 30 và 4 chữ số cuối (ví dụ: BKT221234).',
  duplicateCode: 'Mã sinh viên đã tồn tại.',
  addSuccess: 'Thêm sinh viên thành công.',
  updateSuccess: 'Cập nhật sinh viên thành công.',
  deleteSuccess: 'Xóa sinh viên thành công.',

  confirmUpdate:
    'Bạn có muốn sửa thông tin sinh viên không?',

  confirmDelete:
    'Bạn có muốn xóa thông tin sinh viên không?',

  imagePermission:
    'Ứng dụng cần quyền truy cập thư viện ảnh.',

  studentNotFound:
    'Không tìm thấy thông tin sinh viên.',

  databaseError:
    'Không thể truy cập cơ sở dữ liệu.',

  imageUrl: 'Link ảnh',
  or: 'hoặc',
};

const en = {
  appName: 'Student Management',

  studentList: 'Student List',
  studentDetail: 'Student Information',

  addStudent: 'Add Student',
  editStudent: 'Edit Student',
  deleteStudent: 'Delete Student',

  name: 'Student Name',
  studentCode: 'Student ID',
  email: 'Email',
  avatar: 'Avatar',

  namePlaceholder: 'Enter student name',
  codePlaceholder: 'Enter student ID',
  emailPlaceholder: 'Enter email',
  avatarPlaceholder: 'Enter avatar image URL',

  chooseImage: 'Choose image from device',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',

  noStudents: 'No students found',
  tapToView: 'Tap to view details',

  error: 'Error',
  success: 'Success',
  notification: 'Notification',
  confirm: 'Confirmation',

  fillAllFields: 'Please enter all required information.',
  invalidEmail: 'Invalid email address.',
  invalidName: 'The name must not contain numbers.',
  invalidStudentCode:
    'Student ID must contain 9 characters: B, 2 letters A–Z, 2 digits from 22 to 30, and 4 final digits (example: BKT221234).',
  duplicateCode: 'Student ID already exists.',
  addSuccess: 'Student added successfully.',
  updateSuccess: 'Student updated successfully.',
  deleteSuccess: 'Student deleted successfully.',

  confirmUpdate:
    'Do you want to update this student information?',

  confirmDelete:
    'Do you want to delete this student information?',

  imagePermission:
    'The application needs permission to access your photo library.',

  studentNotFound:
    'Student information not found.',

  databaseError:
    'Unable to access the database.',

  imageUrl: 'Image URL',
  or: 'or',
};

type TranslationKey = keyof typeof vi;

function getLanguage() {
  const languageCode = getLocales()[0]?.languageCode;

  return languageCode === 'vi' ? 'vi' : 'en';
}

export function t(key: TranslationKey): string {
  const language = getLanguage();

  if (language === 'vi') {
    return vi[key];
  }

  return en[key];
}
