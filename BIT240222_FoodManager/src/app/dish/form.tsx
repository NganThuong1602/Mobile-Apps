import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import {
  ActionButton,
  Chip,
  FormInput,
  Loading,
  palette,
  Screen,
  styles,
  TitleBar,
} from "../../components/UI";
import { useFood } from "../../context/FoodContext";
import type { TranslationKey } from "../../i18n/strings";
import type { DishImage } from "../../models/types";

const newImageId = () =>
  `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

type Errors = Partial<
  Record<
    "name" | "price" | "time" | "category" | "image" | "general",
    TranslationKey
  >
>;

export default function DishFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { ready, dishes, categories, t, saveDish } = useFood();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [available, setAvailable] = useState(true);
  const [images, setImages] = useState<DishImage[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const loadedId = useRef<string | null>(null);
  const editing = id ? dishes.find((dish) => dish.id === id) : undefined;

  // Load một lần để đồng bộ nền không xóa mất nội dung form người dùng đang nhập.
  useEffect(() => {
    if (id && editing && loadedId.current !== id) {
      setName(editing.name);
      setPrice(String(editing.price));
      setTime(String(editing.preparationTime));
      setDescription(editing.description);
      setCategoryId(editing.dishCategoryId);
      setAvailable(editing.isAvailable);
      setImages(editing.images.map((image) => ({ ...image })));
      loadedId.current = id;
    }
  }, [id, editing]);

  if (!ready) return <Loading />;
  if (id && !editing)
    return (
      <Screen>
        <TitleBar title={t("editDish")} onBack={() => router.back()} />
        <Text style={[styles.error, { padding: 18 }]}>
          {t("recordMissing")}
        </Text>
      </Screen>
    );

  const addImage = () => {
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setErrors((p) => ({ ...p, image: "imageInvalid" }));
      return;
    }
    if (images.some((item) => item.imageUrl === url)) {
      setErrors((p) => ({ ...p, image: "imageDuplicate" }));
      return;
    }
    setImages((previous) => [
      ...previous,
      { id: newImageId(), imageUrl: url, isThumbnail: previous.length === 0 },
    ]);
    setImageUrl("");
    setErrors((p) => ({ ...p, image: undefined }));
  };

  const removeImage = (imageId: string) => {
    const next = images.filter((image) => image.id !== imageId);
    if (next.length && !next.some((image) => image.isThumbnail))
      next[0].isThumbnail = true;
    setImages([...next]);
  };

  const submit = async () => {
    const issues: Errors = {};
    const numericPrice = Number(price.trim());
    const numericTime = Number(time.trim());
    if (!name.trim()) issues.name = "nameRequired";
    if (!price.trim() || !(numericPrice > 0) || !Number.isFinite(numericPrice))
      issues.price = "priceInvalid";
    if (!time.trim() || !Number.isInteger(numericTime) || numericTime <= 0)
      issues.time = "timeInvalid";
    if (!categories.some((category) => category.id === categoryId))
      issues.category = "categoryRequired";
    if (
      dishes.some(
        (dish) =>
          dish.id !== id &&
          dish.dishCategoryId === categoryId &&
          dish.name.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    )
      issues.name = "nameDuplicate";
    const pendingUrl = imageUrl.trim();
    if (pendingUrl && !/^https?:\/\//i.test(pendingUrl))
      issues.image = "imageInvalid";
    if (pendingUrl && images.some((image) => image.imageUrl === pendingUrl))
      issues.image = "imageDuplicate";
    setErrors(issues);
    if (Object.keys(issues).length) return;
    setBusy(true);
    const savedImages = pendingUrl
      ? [
          ...images,
          {
            id: newImageId(),
            imageUrl: pendingUrl,
            isThumbnail: images.length === 0,
          },
        ]
      : images;
    try {
      const savedId = await saveDish(
        {
          name: name.trim(),
          price: numericPrice,
          preparationTime: numericTime,
          isAvailable: available,
          description: description.trim(),
          dishCategoryId: categoryId,
          images: savedImages,
        },
        id,
      );
      router.replace({ pathname: "/dish/[id]", params: { id: savedId } });
    } catch (error) {
      const key =
        error instanceof Error
          ? (error.message as TranslationKey)
          : "unexpectedError";
      const target: keyof Errors =
        key === "nameRequired" || key === "nameDuplicate"
          ? "name"
          : key === "priceInvalid"
            ? "price"
            : key === "timeInvalid"
              ? "time"
              : key === "categoryRequired"
                ? "category"
                : key === "imageInvalid" || key === "imageDuplicate"
                  ? "image"
                  : "general";
      setErrors((old) => ({
        ...old,
        [target]: target === "general" ? "unexpectedError" : key,
      }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TitleBar
        title={id ? t("editDish") : t("addDish")}
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={[styles.muted, { marginBottom: 16 }]}>
            {t("requiredFields")}
          </Text>
          <FormInput
            label={`${t("name")} *`}
            value={name}
            onChangeText={setName}
            error={errors.name ? t(errors.name) : undefined}
          />
          <FormInput
            label={`${t("price")} *`}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            error={errors.price ? t(errors.price) : undefined}
          />
          <FormInput
            label={`${t("prepTime")} *`}
            value={time}
            onChangeText={setTime}
            keyboardType="number-pad"
            error={errors.time ? t(errors.time) : undefined}
          />
          <FormInput
            label={t("description")}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Text style={styles.label}>{t("category")} *</Text>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}
          >
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
          {!!errors.category && (
            <Text style={[styles.error, { marginBottom: 12 }]}>
              {t(errors.category)}
            </Text>
          )}
          <View
            style={[
              styles.card,
              styles.row,
              { justifyContent: "space-between" },
            ]}
          >
            <Text style={styles.label}>
              {available ? t("available") : t("unavailable")}
            </Text>
            <Switch
              value={available}
              onValueChange={setAvailable}
              trackColor={{ true: palette.accent }}
            />
          </View>
          <Text style={styles.heading}>
            {t("photos")} ({images.length})
          </Text>
          <FormInput
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder={t("imageUrl")}
            error={errors.image ? t(errors.image) : undefined}
          />
          <View style={{ alignSelf: "flex-start", marginBottom: 15 }}>
            <ActionButton
              title={`+ ${t("addImage")}`}
              variant="outline"
              onPress={addImage}
              compact
            />
          </View>
          {images.map((image) => (
            <View key={image.id} style={[styles.card, styles.row]}>
              <Image
                source={{ uri: image.imageUrl }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 10,
                  backgroundColor: "#ECEFF2",
                }}
              />
              <View style={{ flex: 1, gap: 7 }}>
                <Text numberOfLines={1} style={styles.muted}>
                  {image.imageUrl}
                </Text>
                <Pressable
                  onPress={() =>
                    setImages((old) =>
                      old.map((item) => ({
                        ...item,
                        isThumbnail: item.id === image.id,
                      })),
                    )
                  }
                >
                  <Text style={{ color: palette.accent, fontWeight: "700" }}>
                    {image.isThumbnail ? `✓ ${t("cover")}` : t("makeThumbnail")}
                  </Text>
                </Pressable>
                <Pressable onPress={() => removeImage(image.id)}>
                  <Text style={{ color: palette.danger }}>
                    {t("removeImage")}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
          {!!errors.general && (
            <Text style={[styles.error, { marginBottom: 12 }]}>
              {t(errors.general)}
            </Text>
          )}
          <ActionButton
            title={busy ? "..." : t("save")}
            onPress={() => void submit()}
            disabled={busy}
          />
          <View style={{ marginTop: 10 }}>
            <ActionButton
              title={t("cancel")}
              variant="ghost"
              onPress={() => router.back()}
            />
          </View>
          <Text style={[styles.muted, { marginTop: 15, textAlign: "center" }]}>
            {t("noteOffline")}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
