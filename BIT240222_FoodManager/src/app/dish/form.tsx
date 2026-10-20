import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
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

function isValidImageUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !!parsed.hostname
    );
  } catch {
    return false;
  }
}

export default function DishFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { ready, dishes, categories, t, saveDish } = useFood();

  const scrollRef = useRef<ScrollView>(null);
  const loadedId = useRef<string | null>(null);

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

  const editing = id ? dishes.find((dish) => dish.id === id) : undefined;

  // Nạp dữ liệu một lần khi mở form sửa.
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

  // Cuộn tới cuối form khi chọn ô URL.
  const focusImageUrl = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 250);
  };

  const addImage = () => {
    const url = imageUrl.trim();

    if (!isValidImageUrl(url)) {
      setErrors((previous) => ({
        ...previous,
        image: "imageInvalid",
      }));
      return;
    }

    if (images.some((image) => image.imageUrl === url)) {
      setErrors((previous) => ({
        ...previous,
        image: "imageDuplicate",
      }));
      return;
    }

    const newImage: DishImage = {
      id: newImageId(),
      imageUrl: url,
      isThumbnail: images.length === 0,
    };

    setImages((previous) => [...previous, newImage]);

    setImageUrl("");
    setErrors((previous) => ({
      ...previous,
      image: undefined,
    }));

    Keyboard.dismiss();
  };

  const removeImage = (imageId: string) => {
    const next = images
      .filter((image) => image.id !== imageId)
      .map((image) => ({ ...image }));

    if (next.length > 0 && !next.some((image) => image.isThumbnail)) {
      next[0].isThumbnail = true;
    }

    setImages(next);
  };

  const changeThumbnail = (imageId: string) => {
    setImages((previous) =>
      previous.map((image) => ({
        ...image,
        isThumbnail: image.id === imageId,
      })),
    );
  };

  const submit = async () => {
    Keyboard.dismiss();

    const issues: Errors = {};
    const numericPrice = Number(price.trim());
    const numericTime = Number(time.trim());

    if (!name.trim()) {
      issues.name = "nameRequired";
    }

    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      issues.price = "priceInvalid";
    }

    if (!time.trim() || !Number.isInteger(numericTime) || numericTime <= 0) {
      issues.time = "timeInvalid";
    }

    if (!categories.some((category) => category.id === categoryId)) {
      issues.category = "categoryRequired";
    }

    if (
      dishes.some(
        (dish) =>
          dish.id !== id &&
          dish.dishCategoryId === categoryId &&
          dish.name.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      issues.name = "nameDuplicate";
    }

    const pendingUrl = imageUrl.trim();

    if (pendingUrl && !isValidImageUrl(pendingUrl)) {
      issues.image = "imageInvalid";
    }

    if (pendingUrl && images.some((image) => image.imageUrl === pendingUrl)) {
      issues.image = "imageDuplicate";
    }

    setErrors(issues);

    if (Object.keys(issues).length > 0) {
      return;
    }

    const savedImages: DishImage[] = pendingUrl
      ? [
          ...images,
          {
            id: newImageId(),
            imageUrl: pendingUrl,
            isThumbnail: images.length === 0,
          },
        ]
      : images;

    setBusy(true);

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

      router.replace({
        pathname: "/dish/[id]",
        params: { id: savedId },
      });
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

      setErrors((previous) => ({
        ...previous,
        [target]: target === "general" ? "unexpectedError" : key,
      }));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <Loading />;
  }

  if (id && !editing) {
    return (
      <Screen>
        <TitleBar title={t("editDish")} onBack={() => router.back()} />
        <Text style={[styles.error, { padding: 18 }]}>
          {t("recordMissing")}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <TitleBar
        title={id ? t("editDish") : t("addDish")}
        onBack={() => {
          Keyboard.dismiss();
          router.back();
        }}
      />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        showsVerticalScrollIndicator
      >
        <Text style={[styles.muted, { marginBottom: 16 }]}>
          {t("requiredFields")}
        </Text>

        {/* NAME */}
        <FormInput
          label={`${t("name")} *`}
          value={name}
          onChangeText={setName}
          error={errors.name ? t(errors.name) : undefined}
        />

        {/* PRICE */}
        <FormInput
          label={`${t("price")} *`}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          error={errors.price ? t(errors.price) : undefined}
        />

        {/* PREPARATION TIME */}
        <FormInput
          label={`${t("prepTime")} *`}
          value={time}
          onChangeText={setTime}
          keyboardType="number-pad"
          error={errors.time ? t(errors.time) : undefined}
        />

        {/* DESCRIPTION */}
        <FormInput
          label={t("description")}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* CATEGORY */}
        <Text style={styles.label}>{t("category")} *</Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              selected={categoryId === category.id}
              onPress={() => {
                setCategoryId(category.id);
                Keyboard.dismiss();
              }}
            />
          ))}
        </View>

        {!!errors.category && (
          <Text style={[styles.error, { marginBottom: 12 }]}>
            {t(errors.category)}
          </Text>
        )}

        {/* AVAILABLE */}
        <View
          style={[
            styles.card,
            styles.row,
            {
              justifyContent: "space-between",
            },
          ]}
        >
          <Text style={styles.label}>
            {available ? t("available") : t("unavailable")}
          </Text>

          <Switch
            value={available}
            onValueChange={setAvailable}
            trackColor={{
              true: palette.accent,
            }}
          />
        </View>

        {/* IMAGE SECTION */}
        <Text style={styles.heading}>
          {t("photos")} ({images.length})
        </Text>

        {/* IMAGE URL INPUT */}
        <View
          style={{
            marginBottom: 14,
          }}
        >
          <TextInput
            style={[
              styles.input,
              errors.image && {
                borderColor: palette.danger,
              },
            ]}
            value={imageUrl}
            onChangeText={(text) => {
              setImageUrl(text);

              if (errors.image) {
                setErrors((previous) => ({
                  ...previous,
                  image: undefined,
                }));
              }
            }}
            placeholder={t("imageUrl")}
            placeholderTextColor="#A0A7B2"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={() => {
              Keyboard.dismiss();
            }}
            onFocus={focusImageUrl}
            selectTextOnFocus={false}
          />

          {!!errors.image && (
            <Text style={styles.error}>{t(errors.image)}</Text>
          )}
        </View>

        {/* ADD IMAGE BUTTON */}
        <View
          style={{
            alignSelf: "flex-start",
            marginBottom: 15,
          }}
        >
          <ActionButton
            title={`+ ${t("addImage")}`}
            variant="outline"
            onPress={addImage}
            compact
          />
        </View>

        {/* IMAGE LIST */}
        {images.map((image) => (
          <View
            key={image.id}
            style={[
              styles.card,
              styles.row,
              {
                alignItems: "flex-start",
              },
            ]}
          >
            <Image
              source={{
                uri: image.imageUrl,
              }}
              style={{
                width: 90,
                height: 90,
                borderRadius: 10,
                backgroundColor: "#ECEFF2",
              }}
              resizeMode="cover"
            />

            <View
              style={{
                flex: 1,
                gap: 7,
              }}
            >
              <Text numberOfLines={2} style={styles.muted}>
                {image.imageUrl}
              </Text>

              <Pressable onPress={() => changeThumbnail(image.id)}>
                <Text
                  style={{
                    color: palette.accent,
                    fontWeight: "700",
                  }}
                >
                  {image.isThumbnail ? `✓ ${t("cover")}` : t("makeThumbnail")}
                </Text>
              </Pressable>

              <Pressable onPress={() => removeImage(image.id)}>
                <Text
                  style={{
                    color: palette.danger,
                  }}
                >
                  {t("removeImage")}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* GENERAL ERROR */}
        {!!errors.general && (
          <Text style={[styles.error, { marginBottom: 12 }]}>
            {t(errors.general)}
          </Text>
        )}

        {/* SAVE */}
        <ActionButton
          title={busy ? "..." : t("save")}
          onPress={() => void submit()}
          disabled={busy}
        />

        {/* CANCEL */}
        <View
          style={{
            marginTop: 10,
          }}
        >
          <ActionButton
            title={t("cancel")}
            variant="ghost"
            onPress={() => {
              Keyboard.dismiss();
              router.back();
            }}
          />
        </View>

        {/* OFFLINE NOTE */}
        <Text
          style={[
            styles.muted,
            {
              marginTop: 15,
              textAlign: "center",
            },
          ]}
        >
          {t("noteOffline")}
        </Text>
      </ScrollView>
    </Screen>
  );
}
