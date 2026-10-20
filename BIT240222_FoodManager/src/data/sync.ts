import { MOCK_API_CONFIGURED } from "../config/constants";

import {
  getDatabase,
  importCategory,
  importDish,
  listCategories,
  listDishes,
  markMissingRemote,
  markSynced,
} from "./database";

import {
  fetchRemoteCategories,
  fetchRemoteDishes,
  removeRemoteCategory,
  removeRemoteDish,
  upsertRemoteCategory,
  upsertRemoteDish,
} from "./mockApi";

import type { Dish, DishCategory } from "../models/types";

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

function checkRemoteDuplicates(
  categories: DishCategory[],
  dishes: Dish[],
): void {
  const categoryNames = new Set<string>();

  for (const category of categories) {
    const key = normalize(category.name);

    if (categoryNames.has(key)) {
      throw new Error(
        `MockAPI có loại món trùng tên: ${category.name}. ` +
          "Hãy xóa dữ liệu trùng trên MockAPI.",
      );
    }

    categoryNames.add(key);
  }

  const dishNames = new Set<string>();

  for (const dish of dishes) {
    const key = `${dish.dishCategoryId}:${normalize(dish.name)}`;

    if (dishNames.has(key)) {
      throw new Error(`MockAPI có món ăn trùng: ${dish.name}`);
    }

    dishNames.add(key);
  }
}

function matchingCategory(
  local: DishCategory,
  remote: DishCategory[],
): DishCategory | undefined {
  if (local.remoteId) {
    const byId = remote.find((item) => item.remoteId === local.remoteId);

    if (byId) return byId;
  }

  // Hỗ trợ khôi phục sau khi POST thành công
  // nhưng thiết bị bị mất phản hồi.
  return remote.find((item) => normalize(item.name) === normalize(local.name));
}

function matchingDish(
  local: Dish,
  remote: Dish[],
  remoteCategoryId: string,
): Dish | undefined {
  if (local.remoteId) {
    const byId = remote.find((item) => item.remoteId === local.remoteId);

    if (byId) return byId;
  }

  return remote.find(
    (item) =>
      item.dishCategoryId === remoteCategoryId &&
      normalize(item.name) === normalize(local.name),
  );
}

/**
 * Đồng bộ dữ liệu:
 *
 * 1. Đọc dữ liệu MockAPI.
 * 2. Xác định bản ghi local tương ứng với server.
 * 3. Đồng bộ danh mục trước.
 * 4. Đồng bộ món ăn sau.
 * 5. Đồng bộ thao tác xóa.
 * 6. Nhập dữ liệu server về SQLite.
 *
 * Khi offline, mọi thao tác vẫn lưu local.
 * Khi có mạng, FoodContext gọi hàm này tự động.
 */
export async function synchronize(): Promise<void> {
  if (!MOCK_API_CONFIGURED) {
    return;
  }

  await getDatabase();

  const remoteCategories = await fetchRemoteCategories();

  const remoteDishes = await fetchRemoteDishes();

  // Nếu server đã có dữ liệu trùng,
  // dừng trước khi tiếp tục ghi thêm.
  checkRemoteDuplicates(remoteCategories, remoteDishes);

  const localCategories = await listCategories(true);

  const localDishes = await listDishes(true);

  // local category ID -> MockAPI category ID
  const categoryIds = new Map<string, string>();

  // MockAPI category ID -> local category ID
  const reverseCategoryIds = new Map<string, string>();

  // local dish ID -> MockAPI dish ID
  const dishIds = new Map<string, string>();

  // MockAPI dish ID -> local dish ID
  const reverseDishIds = new Map<string, string>();

  // =====================================
  // 1. GHÉP CÁC BẢN GHI ĐÃ TỒN TẠI
  // =====================================

  for (const local of localCategories) {
    const remote = matchingCategory(local, remoteCategories);

    if (!remote?.remoteId) continue;

    categoryIds.set(local.id, remote.remoteId);

    reverseCategoryIds.set(remote.remoteId, local.id);
  }

  // =====================================
  // 2. CREATE / UPDATE CATEGORY
  // =====================================

  for (const category of localCategories) {
    if (!category.dirty || category.deleted) {
      continue;
    }

    const remoteId = categoryIds.get(category.id);

    const existing = remoteCategories.find(
      (item) => item.remoteId === remoteId,
    );

    // Danh mục mẫu đã tồn tại trên server.
    // Không POST thêm bản trùng.
    if (category.seed && existing) {
      await markSynced(
        "category",
        category.id,
        existing.remoteId,
        category.version || 1,
      );

      continue;
    }

    const savedRemoteId = await upsertRemoteCategory(category, remoteId);

    await markSynced(
      "category",
      category.id,
      savedRemoteId,
      category.version || 1,
    );

    categoryIds.set(category.id, savedRemoteId);

    reverseCategoryIds.set(savedRemoteId, category.id);
  }

  // Tải lại danh mục để bảo đảm các ID
  // mới tạo đã có trên MockAPI.
  const currentRemoteCategories = await fetchRemoteCategories();

  const currentLocalCategories = await listCategories(true);

  for (const local of currentLocalCategories) {
    const remote = matchingCategory(local, currentRemoteCategories);

    if (!remote?.remoteId) continue;

    categoryIds.set(local.id, remote.remoteId);

    reverseCategoryIds.set(remote.remoteId, local.id);
  }

  // =====================================
  // 3. GHÉP DISH ĐÃ ĐỒNG BỘ
  // =====================================

  for (const dish of localDishes) {
    const remoteCategoryId = categoryIds.get(dish.dishCategoryId);

    if (!remoteCategoryId) continue;

    const remote = matchingDish(dish, remoteDishes, remoteCategoryId);

    if (!remote?.remoteId) continue;

    dishIds.set(dish.id, remote.remoteId);

    reverseDishIds.set(remote.remoteId, dish.id);
  }

  // =====================================
  // 4. CREATE / UPDATE DISH
  // =====================================

  for (const dish of localDishes) {
    if (!dish.dirty || dish.deleted) {
      continue;
    }

    const remoteCategoryId = categoryIds.get(dish.dishCategoryId);

    if (!remoteCategoryId) {
      throw new Error(`Không tìm thấy loại món trên MockAPI: ${dish.name}`);
    }

    const remoteId = dishIds.get(dish.id);

    const existing = remoteDishes.find((item) => item.remoteId === remoteId);

    if (dish.seed && existing) {
      await markSynced("dish", dish.id, existing.remoteId, dish.version || 1);

      continue;
    }

    const savedRemoteId = await upsertRemoteDish(
      dish,
      remoteCategoryId,
      remoteId,
    );

    await markSynced("dish", dish.id, savedRemoteId, dish.version || 1);

    dishIds.set(dish.id, savedRemoteId);

    reverseDishIds.set(savedRemoteId, dish.id);
  }

  // =====================================
  // 5. DELETE DISH
  // =====================================

  for (const dish of localDishes) {
    if (!dish.dirty || !dish.deleted) {
      continue;
    }

    const remoteId = dishIds.get(dish.id);

    if (remoteId) {
      await removeRemoteDish(remoteId);
    }

    await markSynced("dish", dish.id, remoteId, dish.version || 1);
  }

  // =====================================
  // 6. DELETE CATEGORY
  // =====================================

  for (const category of localCategories) {
    if (!category.dirty || !category.deleted) {
      continue;
    }

    const remoteId = categoryIds.get(category.id);

    if (remoteId) {
      await removeRemoteCategory(remoteId);
    }

    await markSynced("category", category.id, remoteId, category.version || 1);
  }

  // =====================================
  // 7. REFRESH REMOTE DATA
  // =====================================

  const latestCategories = await fetchRemoteCategories();

  const latestDishes = await fetchRemoteDishes();

  checkRemoteDuplicates(latestCategories, latestDishes);

  // =====================================
  // 8. IMPORT CATEGORIES -> SQLITE
  // =====================================

  for (const remote of latestCategories) {
    const remoteId = remote.remoteId!;

    // Giữ local ID cũ nếu đã từng đồng bộ.
    // Bản ghi chỉ có trên server nhận
    // một local ID ổn định dựa trên remote ID.
    const localId =
      reverseCategoryIds.get(remoteId) || `remote-category-${remoteId}`;

    categoryIds.set(localId, remoteId);

    reverseCategoryIds.set(remoteId, localId);

    await importCategory({
      ...remote,
      id: localId,
      remoteId,
    });
  }

  // =====================================
  // 9. IMPORT DISHES -> SQLITE
  // =====================================

  for (const remote of latestDishes) {
    const remoteId = remote.remoteId!;

    // Trên MockAPI, DishCategoryId
    // là id của category trên server.
    const localCategoryId = reverseCategoryIds.get(remote.dishCategoryId);

    if (!localCategoryId) {
      throw new Error(
        `Món "${remote.name}" tham chiếu tới ` +
          "loại món không tồn tại trên MockAPI.",
      );
    }

    const localId = reverseDishIds.get(remoteId) || `remote-dish-${remoteId}`;

    dishIds.set(localId, remoteId);

    reverseDishIds.set(remoteId, localId);

    await importDish({
      ...remote,
      id: localId,
      remoteId,
      dishCategoryId: localCategoryId,
    });
  }

  // =====================================
  // 10. XỬ LÝ BẢN GHI MẤT TRÊN SERVER
  // =====================================

  await markMissingRemote(
    "dish",
    new Set(latestDishes.map((item) => item.remoteId!)),
  );

  await markMissingRemote(
    "category",
    new Set(latestCategories.map((item) => item.remoteId!)),
  );
}
