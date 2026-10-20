import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import {
  ActionButton,
  Loading,
  palette,
  priceLabel,
  Screen,
  styles,
  TitleBar,
} from "../../components/UI";
import { useFood } from "../../context/FoodContext";

export default function DishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { ready, dishes, categories, t, removeDish, setThumbnail } = useFood();
  if (!ready) return <Loading />;
  const dish = dishes.find((d) => d.id === id);
  if (!dish)
    return (
      <Screen>
        <TitleBar title={t("dishDetail")} onBack={() => router.back()} />
        <Text style={[styles.error, { padding: 18 }]}>
          {t("recordMissing")}
        </Text>
      </Screen>
    );

  const category =
    categories.find((cat) => cat.id === dish.dishCategoryId)?.name || "";
  const cover =
    dish.images.find((image) => image.isThumbnail) || dish.images[0];
  const confirmDelete = () =>
    Alert.alert(t("confirm"), t("deleteDishQuestion"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirmDelete"),
        style: "destructive",
        onPress: () => {
          void removeDish(dish.id)
            .then(() => router.replace("/"))
            .catch((e) => Alert.alert(t("unexpectedError"), String(e)));
        },
      },
    ]);

  return (
    <Screen>
      <TitleBar title={t("dishDetail")} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {cover ? (
          <Image
            source={{ uri: cover.imageUrl }}
            style={{
              width: "100%",
              height: 240,
              borderRadius: 18,
              backgroundColor: "#ECEFF2",
            }}
          />
        ) : (
          <View
            style={[styles.card, { height: 180, justifyContent: "center" }]}
          >
            <Text style={styles.muted}>{t("noImages")}</Text>
          </View>
        )}
        <View style={{ marginVertical: 18 }}>
          <Text style={{ color: palette.ink, fontSize: 25, fontWeight: "800" }}>
            {dish.name}
          </Text>
          <Text style={[styles.muted, { marginTop: 6 }]}>{category}</Text>
          <Text
            style={{
              color: palette.accent,
              fontWeight: "800",
              fontSize: 22,
              marginTop: 6,
            }}
          >
            {priceLabel(dish.price)}
          </Text>
          <Text
            style={{
              color: dish.isAvailable ? palette.accent : palette.danger,
              marginTop: 8,
            }}
          >
            {dish.isAvailable ? t("available") : t("unavailable")}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>{t("prepTime")}</Text>
          <Text style={{ color: palette.ink }}>
            {dish.preparationTime} {t("minutes")} ·{" "}
            <Text style={{ fontWeight: "800" }}>
              {dish.preparationTime <= 15 ? t("quick") : t("regular")}
            </Text>
          </Text>
          <Text style={[styles.heading, { marginTop: 18 }]}>
            {t("description")}
          </Text>
          <Text style={{ color: palette.muted, lineHeight: 22 }}>
            {dish.description || "—"}
          </Text>
        </View>
        <Text style={styles.heading}>
          {t("photos")} ({dish.images.length})
        </Text>
        <Text style={[styles.muted, { marginBottom: 12 }]}>
          {t("galleryHint")}
        </Text>
        {dish.images.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 18 }}
          >
            {dish.images.map((image) => (
              <Pressable
                key={image.id}
                onPress={() => {
                  void setThumbnail(dish.id, image.id).catch((e) =>
                    Alert.alert(t("unexpectedError"), String(e)),
                  );
                }}
                style={{ marginRight: 10 }}
              >
                <Image
                  source={{ uri: image.imageUrl }}
                  style={{
                    width: 132,
                    height: 114,
                    borderRadius: 12,
                    borderWidth: image.isThumbnail ? 3 : 1,
                    borderColor: image.isThumbnail
                      ? palette.accent
                      : palette.border,
                  }}
                />
                <Text
                  style={{
                    color: image.isThumbnail ? palette.accent : palette.muted,
                    marginTop: 4,
                    fontSize: 12,
                  }}
                >
                  {image.isThumbnail ? `✓ ${t("cover")}` : t("makeThumbnail")}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.muted, { marginBottom: 18 }]}>
            {t("noImages")}
          </Text>
        )}
        <View style={[styles.row, { marginBottom: 25 }]}>
          <View style={{ flex: 1 }}>
            <ActionButton
              title={t("edit")}
              onPress={() =>
                router.push({ pathname: "/dish/form", params: { id: dish.id } })
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton
              title={t("delete")}
              variant="danger"
              onPress={confirmDelete}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
