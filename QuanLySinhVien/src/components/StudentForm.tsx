import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { Student } from '../models/Student';
import { t } from '../i18n/translations';

interface StudentFormProps {
  initialStudent?: Student;
  buttonText: string;
  onSubmit: (student: Student) => void;
}

export default function StudentForm({
  initialStudent,
  buttonText,
  onSubmit,
}: StudentFormProps) {
  const [name, setName] = useState(
    initialStudent?.name ?? ''
  );

  const [studentCode, setStudentCode] = useState(
    initialStudent?.studentCode ?? ''
  );

  const [email, setEmail] = useState(
    initialStudent?.email ?? ''
  );

  const [avatar, setAvatar] = useState(
    initialStudent?.avatar ?? ''
  );

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        t('notification'),
        t('imagePermission')
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const validateEmail = (value: string) => {
    const regex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(value);
  };

  const handleSubmit = () => {
    const cleanName = name.trim();
    const cleanCode = studentCode.trim();
    const cleanEmail = email.trim();
    const cleanAvatar = avatar.trim();

    if (
      !cleanName ||
      !cleanCode ||
      !cleanEmail
    ) {
      Alert.alert(
        t('error'),
        t('fillAllFields')
      );

      return;
    }

    if (/\p{Nd}/u.test(cleanName)) {
      Alert.alert(t('error'), t('invalidName'));
      return;
    }

    if (!/^B[A-Z]{2}(?:2[2-9]|30)[0-9]{4}$/.test(cleanCode)) {
      Alert.alert(t('error'), t('invalidStudentCode'));
      return;
    }

    if (!validateEmail(cleanEmail)) {
      Alert.alert(
        t('error'),
        t('invalidEmail')
      );

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
    <View style={styles.container}>
      <Text style={styles.label}>
        {t('name')}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('namePlaceholder')}
        value={name}
        onChangeText={(value) => setName(value.replace(/\p{Nd}/gu, ''))}
      />

      <Text style={styles.label}>
        {t('studentCode')}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('codePlaceholder')}
        value={studentCode}
        onChangeText={setStudentCode}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>
        {t('email')}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType={'email-address' as KeyboardTypeOptions}
        autoCapitalize="none"
      />

      <Text style={styles.label}>
        {t('avatar')}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('avatarPlaceholder')}
        value={avatar}
        onChangeText={setAvatar}
        autoCapitalize="none"
      />

      <Text style={styles.orText}>
        {t('or')}
      </Text>

      <TouchableOpacity
        style={styles.imageButton}
        onPress={pickImage}
      >
        <Text style={styles.imageButtonText}>
          📷 {t('chooseImage')}
        </Text>
      </TouchableOpacity>

      {avatar !== '' && (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: avatar }}
            style={styles.avatarPreview}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSubmit}
      >
        <Text style={styles.saveButtonText}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    color: '#222',
  },

  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },

  orText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#777777',
  },

  imageButton: {
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  imageButtonText: {
    color: '#1976D2',
    fontSize: 15,
    fontWeight: '600',
  },

  previewContainer: {
    alignItems: 'center',
    marginTop: 20,
  },

  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eeeeee',
  },

  saveButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },

  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
