import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import {
  ActionButton,
  FormInput,
  Loading,
  palette,
  Screen,
  styles,
  TitleBar,
} from "../components/UI";
import { useFood } from "../context/FoodContext";
import type { TranslationKey } from "../i18n/strings";
import type { DishCategory } from "../models/types";

export default function CategoriesScreen() {
  const router = useRouter();
  const { ready, categories, dishes, t, saveCategory, removeCategory } =
    useFood();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!ready) return <Loading />;

  const reset = () => {
    setOpen(false);
    setEditingId(undefined);
    setName("");
    setDescription("");
    setError("");
  };
  const edit = (category?: DishCategory) => {
    setEditingId(category?.id);
    setName(category?.name || "");
    setDescription(category?.description || "");
    setError("");
    setOpen(true);
  };
  const save = async () => {
    setBusy(true);
    try {
      await saveCategory({ name, description }, editingId);
      reset();
    } catch (e) {
      const key =
        e instanceof Error ? (e.message as TranslationKey) : "unexpectedError";
      setError(
        ["nameRequired", "categoryDuplicate", "recordMissing"].includes(key)
          ? t(key)
          : t("unexpectedError"),
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = (cat: DishCategory) => {
    if (dishes.some((dish) => dish.dishCategoryId === cat.id)) {
      Alert.alert(t("confirm"), t("categoryInUse"));
      return;
    }
    Alert.alert(t("confirm"), t("deleteCategoryQuestion"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          void removeCategory(cat.id).catch((e) =>
            Alert.alert(t("unexpectedError"), String(e)),
          );
        },
      },
    ]);
  };
  return (
    <Screen>
      <TitleBar title={t("categories")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 14 }}>
          <ActionButton
            title={`+ ${t("addCategory")}`}
            onPress={() => edit()}
          />
        </View>
        {open && (
          <View style={styles.card}>
            <Text style={styles.heading}>
              {editingId ? t("editCategory") : t("addCategory")}
            </Text>
            <FormInput
              label={`${t("name")} *`}
              value={name}
              onChangeText={setName}
              error={error}
            />
            <FormInput
              label={t("description")}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={busy ? "..." : t("save")}
                  disabled={busy}
                  onPress={() => void save()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("cancel")}
                  variant="ghost"
                  onPress={reset}
                />
              </View>
            </View>
          </View>
        )}
        {categories.length === 0 && (
          <Text style={styles.muted}>{t("emptyCategories")}</Text>
        )}
        {categories.map((cat) => (
          <View key={cat.id} style={styles.card}>
            <Text
              style={{ fontSize: 18, fontWeight: "800", color: palette.ink }}
            >
              {cat.name}
            </Text>
            <Text style={[styles.muted, { marginTop: 5 }]}>
              {cat.description || "—"}
            </Text>
            <Text style={[styles.muted, { marginTop: 7 }]}>
              {dishes.filter((dish) => dish.dishCategoryId === cat.id).length}{" "}
              {t("dishCount")}
            </Text>
            <View style={[styles.row, { marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("edit")}
                  variant="outline"
                  compact
                  onPress={() => edit(cat)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("delete")}
                  variant="danger"
                  compact
                  onPress={() => remove(cat)}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
