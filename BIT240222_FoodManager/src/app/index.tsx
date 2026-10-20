import { useRouter } from "expo-router";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ActionButton,
  Chip,
  Loading,
  palette,
  priceLabel,
  Screen,
  styles,
} from "../components/UI";
import { MOCK_API_CONFIGURED, PROJECT_NAME } from "../config/constants";
import { useFood } from "../context/FoodContext";
import type { Dish } from "../models/types";

function DishCard({ dish }: { dish: Dish }) {
  const router = useRouter();
  const { categories, t } = useFood();
  const cover =
    dish.images.find((image) => image.isThumbnail) || dish.images[0];
  const categoryName =
    categories.find((cat) => cat.id === dish.dishCategoryId)?.name || "";
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/dish/[id]", params: { id: dish.id } })
      }
      style={[
        styles.card,
        {
          padding: 0,
          overflow: "hidden",
          flexDirection: "row",
          minHeight: 128,
        },
      ]}
    >
      {cover ? (
        <Image
          source={{ uri: cover.imageUrl }}
          style={{ width: 128, height: 134, backgroundColor: "#E9EDF1" }}
        />
      ) : (
        <View
          style={{
            width: 128,
            height: 134,
            justifyContent: "center",
            backgroundColor: "#EDF1F4",
            padding: 10,
          }}
        >
          <Text style={styles.muted}>{t("imagePlaceholder")}</Text>
        </View>
      )}
      <View style={{ flex: 1, padding: 12, justifyContent: "center", gap: 6 }}>
        <Text
          numberOfLines={1}
          style={{ color: palette.ink, fontSize: 17, fontWeight: "800" }}
        >
          {dish.name}
        </Text>
        <Text numberOfLines={1} style={styles.muted}>
          {categoryName}
        </Text>
        <Text
          style={{ color: palette.accent, fontSize: 16, fontWeight: "800" }}
        >
          {priceLabel(dish.price)}
        </Text>
        <Text style={styles.muted}>
          {dish.preparationTime} {t("minutes")} ·{" "}
          {dish.preparationTime <= 15 ? t("quick") : t("regular")}
        </Text>
        <Text
          style={{
            color: dish.isAvailable ? palette.accent : palette.danger,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {dish.isAvailable ? t("available") : t("unavailable")}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    ready,
    initError,
    categories,
    dishes,
    t,
    language,
    chooseLanguage,
    filters,
    setFilters,
    resetFilters,
    syncStatus,
  } = useFood();

  if (!ready && !initError) return <Loading />;
  if (initError)
    return (
      <Screen style={{ padding: 20 }}>
        <Text style={styles.error}>{initError}</Text>
      </Screen>
    );

  const set = (patch: Partial<typeof filters>) =>
    setFilters((previous) => ({ ...previous, ...patch }));
  const min = filters.minPrice.trim() ? Number(filters.minPrice) : 0;
  const max = filters.maxPrice.trim() ? Number(filters.maxPrice) : Infinity;
  const badRange =
    !Number.isFinite(min) ||
    (max !== Infinity && !Number.isFinite(max)) ||
    min < 0 ||
    max < 0 ||
    min > max;
  const filtered = badRange
    ? []
    : dishes
        .filter((dish) => {
          return (
            dish.name
              .toLocaleLowerCase()
              .includes(filters.search.trim().toLocaleLowerCase()) &&
            (!filters.categoryId ||
              dish.dishCategoryId === filters.categoryId) &&
            (!filters.onlyAvailable || dish.isAvailable) &&
            dish.price >= min &&
            dish.price <= max
          );
        })
        .sort((a, b) => {
          if (filters.sort === "priceAsc") return a.price - b.price;
          if (filters.sort === "priceDesc") return b.price - a.price;
          if (filters.sort === "timeAsc")
            return a.preparationTime - b.preparationTime;
          return a.name.localeCompare(b.name);
        });
  const statusKey =
    syncStatus === "offline"
      ? "offline"
      : syncStatus === "syncing"
        ? "syncing"
        : syncStatus === "synced"
          ? "synced"
          : syncStatus === "error"
            ? "syncError"
            : "setupApi";

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(dish) => dish.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <DishCard dish={item} />}
        ListHeaderComponent={
          <View>
            <View
              style={[
                styles.card,
                { backgroundColor: "#173A32", borderWidth: 0 },
              ]}
            >
              <Text
                style={{ fontSize: 23, fontWeight: "800", color: "#FFFFFF" }}
              >
                {t("appTitle")}
              </Text>
              <Text style={{ color: "#D4F3E8", marginTop: 4 }}>
                {PROJECT_NAME}
              </Text>
              <Text style={{ color: "#D4F3E8", marginTop: 8 }}>
                {MOCK_API_CONFIGURED ? t(statusKey) : t("setupApi")}
              </Text>
              <View style={[styles.row, { marginTop: 12, flexWrap: "wrap" }]}>
                <Chip
                  label={t("langEnglish")}
                  selected={language === "en"}
                  onPress={() => void chooseLanguage("en")}
                />
                <Chip
                  label={t("langVietnamese")}
                  selected={language === "vi"}
                  onPress={() => void chooseLanguage("vi")}
                />
              </View>
            </View>
            <View style={[styles.row, { marginBottom: 14 }]}>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={`+ ${t("addDish")}`}
                  onPress={() => router.push("/dish/form")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                  title={t("categories")}
                  variant="outline"
                  onPress={() => router.push("/categories")}
                />
              </View>
            </View>
            <Text style={styles.heading}>{t("filters")}</Text>
            <TextInput
              value={filters.search}
              onChangeText={(search) => set({ search })}
              style={[styles.input, { marginBottom: 12 }]}
              placeholder={t("search")}
              placeholderTextColor="#9BA5AF"
            />
            <Text style={styles.label}>{t("category")}</Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 5,
              }}
            >
              <Chip
                label={t("allCategories")}
                selected={!filters.categoryId}
                onPress={() => set({ categoryId: "" })}
              />
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  selected={filters.categoryId === cat.id}
                  onPress={() => set({ categoryId: cat.id })}
                />
              ))}
            </View>
            <Text style={styles.label}>{t("available")}</Text>
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              <Chip
                label={t("all")}
                selected={!filters.onlyAvailable}
                onPress={() => set({ onlyAvailable: false })}
              />
              <Chip
                label={t("available")}
                selected={filters.onlyAvailable}
                onPress={() => set({ onlyAvailable: true })}
              />
            </View>
            <View
              style={[
                styles.row,
                { alignItems: "flex-start", marginBottom: 3 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t("minPrice")}</Text>
                <TextInput
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="0"
                  value={filters.minPrice}
                  onChangeText={(minPrice) => set({ minPrice })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t("maxPrice")}</Text>
                <TextInput
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="∞"
                  value={filters.maxPrice}
                  onChangeText={(maxPrice) => set({ maxPrice })}
                />
              </View>
            </View>
            {badRange && (
              <Text style={[styles.error, { marginBottom: 8 }]}>
                {t("priceRangeInvalid")}
              </Text>
            )}
            <Text style={[styles.label, { marginTop: 10 }]}>{t("sort")}</Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              {(["name", "priceAsc", "priceDesc", "timeAsc"] as const).map(
                (sort) => (
                  <Chip
                    key={sort}
                    label={t(
                      sort === "name"
                        ? "sortName"
                        : sort === "priceAsc"
                          ? "sortPriceAsc"
                          : sort === "priceDesc"
                            ? "sortPriceDesc"
                            : "sortTime",
                    )}
                    selected={filters.sort === sort}
                    onPress={() => set({ sort })}
                  />
                ),
              )}
            </View>
            <View style={{ alignSelf: "flex-start", marginBottom: 14 }}>
              <ActionButton
                title={t("clearFilters")}
                onPress={resetFilters}
                variant="ghost"
                compact
              />
            </View>
            <Text style={styles.heading}>
              {t("dishes")} ({filtered.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={styles.muted}>
              {badRange ? t("priceRangeInvalid") : t("empty")}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
