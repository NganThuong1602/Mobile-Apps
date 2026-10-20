import React from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ViewStyle,
} from "react-native";

export const palette = {
  background: "#F7F8FB",
  white: "#FFFFFF",
  ink: "#1C2635",
  muted: "#657184",
  accent: "#1D9F75",
  accentSoft: "#E7F8F0",
  border: "#E3E7ED",
  danger: "#D94747",
  warning: "#F0A93B",
  purple: "#7160D0",
};

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}

export function ActionButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger" | "ghost";
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        compact && styles.compact,
        variant === "primary" && styles.buttonPrimary,
        variant === "outline" && styles.buttonOutline,
        variant === "danger" && styles.buttonDanger,
        variant === "ghost" && styles.buttonGhost,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "outline" && { color: palette.accent },
          variant === "ghost" && { color: palette.ink },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  multiline = false,
}: {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && { minHeight: 84, textAlignVertical: "top" },
          !!error && { borderColor: palette.danger },
        ]}
        placeholder={placeholder}
        placeholderTextColor="#A0A7B2"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize="sentences"
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TitleBar({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.titleBar}>
      {!!onBack && (
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={{ fontSize: 26, color: palette.ink }}>‹</Text>
        </Pressable>
      )}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export function Loading() {
  return (
    <Screen style={{ justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={palette.accent} />
    </Screen>
  );
}

export function priceLabel(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, paddingBottom: 36 },
  card: {
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: palette.white,
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
  },
  backButton: { minWidth: 30, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 21, fontWeight: "800", color: palette.ink, flex: 1 },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.ink,
    marginBottom: 12,
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
  },
  muted: { color: palette.muted, fontSize: 13 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    fontSize: 15,
    color: palette.ink,
  },
  error: { color: palette.danger, marginTop: 5, fontSize: 12 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  compact: { minHeight: 34, paddingVertical: 7, paddingHorizontal: 12 },
  buttonPrimary: { backgroundColor: palette.accent },
  buttonOutline: {
    backgroundColor: palette.white,
    borderColor: palette.accent,
    borderWidth: 1,
  },
  buttonDanger: { backgroundColor: palette.danger },
  buttonGhost: { backgroundColor: "#EFF1F4" },
  buttonText: { fontSize: 14, color: palette.white, fontWeight: "700" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
  },
  chipText: { color: palette.muted, fontWeight: "600", fontSize: 13 },
  chipTextSelected: { color: palette.accent },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
});
