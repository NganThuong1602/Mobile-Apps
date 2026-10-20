import * as SQLite from "expo-sqlite";
import { column as c, DB_NAME, TABLES } from "../config/constants";
import type {
  CategoryInput,
  Dish,
  DishCategory,
  DishImage,
  DishInput,
  Language,
} from "../models/types";

const T = TABLES;
const q = (name: string) => `"${name}"`;
const f = (name: string) => q(c(name));
const uid = () =>
  `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

type CatRow = {
  id: string;
  name: string;
  description: string;
  remoteId: string | null;
  dirty: number;
  deleted: number;
  seed: number;
  version: number;
};
type DishRow = CatRow & {
  price: number;
  preparationTime: number;
  isAvailable: number;
  dishCategoryId: string;
};
type ImageRow = {
  id: string;
  dishId: string;
  imageUrl: string;
  isThumbnail: number;
};

const categorySelect = `SELECT ${f("Id")} AS id, ${f("Name")} AS name, ${f("Description")} AS description,
  ${f("RemoteId")} AS remoteId, ${f("Dirty")} AS dirty, ${f("Deleted")} AS deleted,
  ${f("Seed")} AS seed, ${f("Version")} AS version FROM ${q(T.categories)}`;
const dishSelect = `SELECT ${f("Id")} AS id, ${f("Name")} AS name, ${f("Price")} AS price,
  ${f("PreparationTime")} AS preparationTime, ${f("IsAvailable")} AS isAvailable,
  ${f("Description")} AS description, ${f("DishCategoryId")} AS dishCategoryId,
  ${f("RemoteId")} AS remoteId, ${f("Dirty")} AS dirty, ${f("Deleted")} AS deleted,
  ${f("Seed")} AS seed, ${f("Version")} AS version FROM ${q(T.dishes)}`;

const toCategory = (r: CatRow): DishCategory => ({
  id: r.id,
  name: r.name,
  description: r.description,
  remoteId: r.remoteId || undefined,
  dirty: !!r.dirty,
  deleted: !!r.deleted,
  seed: !!r.seed,
  version: r.version,
});
const toDish = (r: DishRow, images: DishImage[]): Dish => ({
  ...toCategory(r),
  price: r.price,
  preparationTime: r.preparationTime,
  isAvailable: !!r.isAvailable,
  dishCategoryId: r.dishCategoryId,
  images,
});

async function initialize(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS ${q(T.categories)} (
      ${f("Id")} TEXT PRIMARY KEY NOT NULL,
      ${f("Name")} TEXT NOT NULL,
      ${f("Description")} TEXT NOT NULL DEFAULT '',
      ${f("RemoteId")} TEXT,
      ${f("Dirty")} INTEGER NOT NULL DEFAULT 1,
      ${f("Deleted")} INTEGER NOT NULL DEFAULT 0,
      ${f("Seed")} INTEGER NOT NULL DEFAULT 0,
      ${f("Version")} INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS ${q(T.dishes)} (
      ${f("Id")} TEXT PRIMARY KEY NOT NULL,
      ${f("Name")} TEXT NOT NULL,
      ${f("Price")} REAL NOT NULL CHECK (${f("Price")} > 0),
      ${f("PreparationTime")} INTEGER NOT NULL CHECK (${f("PreparationTime")} > 0),
      ${f("IsAvailable")} INTEGER NOT NULL DEFAULT 1,
      ${f("Description")} TEXT NOT NULL DEFAULT '',
      ${f("DishCategoryId")} TEXT NOT NULL,
      ${f("RemoteId")} TEXT,
      ${f("Dirty")} INTEGER NOT NULL DEFAULT 1,
      ${f("Deleted")} INTEGER NOT NULL DEFAULT 0,
      ${f("Seed")} INTEGER NOT NULL DEFAULT 0,
      ${f("Version")} INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (${f("DishCategoryId")}) REFERENCES ${q(T.categories)}(${f("Id")})
    );
    CREATE TABLE IF NOT EXISTS ${q(T.images)} (
      ${f("Id")} TEXT PRIMARY KEY NOT NULL,
      ${f("DishId")} TEXT NOT NULL,
      ${f("ImageUrl")} TEXT NOT NULL,
      ${f("IsThumbnail")} INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (${f("DishId")}) REFERENCES ${q(T.dishes)}(${f("Id")}) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ${q("IDX_DishCover")}
      ON ${q(T.images)}(${f("DishId")}) WHERE ${f("IsThumbnail")} = 1;
    CREATE TABLE IF NOT EXISTS ${q(T.settings)} (
      ${f("Key")} TEXT PRIMARY KEY NOT NULL,
      ${f("Value")} TEXT NOT NULL
    );
  `);
  await seedIfNeeded(db);
  return db;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = initialize().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

async function seedIfNeeded(db: SQLite.SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ value: string }>(
    `SELECT ${f("Value")} AS value FROM ${q(T.settings)} WHERE ${f("Key")} = ?`,
    "seeded-v1",
  );
  if (existing) return;

  const cats = [
    {
      id: "seed-category-main",
      name: "Main courses",
      description: "Main dishes",
    },
    {
      id: "seed-category-fast",
      name: "Fast food",
      description: "Easy and quick dishes",
    },
    {
      id: "seed-category-drink",
      name: "Drinks",
      description: "Beverages and refreshments",
    },
  ];
  const dishes: Dish[] = [
    {
      id: "seed-dish-1",
      name: "Beef Pho",
      price: 55000,
      preparationTime: 20,
      isAvailable: true,
      description: "Vietnamese beef noodle soup",
      dishCategoryId: cats[0].id,
      images: [
        {
          id: "seed-image-1",
          imageUrl:
            "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
          isThumbnail: true,
        },
      ],
    },
    {
      id: "seed-dish-2",
      name: "Fried Rice",
      price: 45000,
      preparationTime: 15,
      isAvailable: true,
      description: "Fried rice with vegetables",
      dishCategoryId: cats[0].id,
      images: [
        {
          id: "seed-image-2",
          imageUrl:
            "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
          isThumbnail: true,
        },
      ],
    },
    {
      id: "seed-dish-3",
      name: "Burger",
      price: 65000,
      preparationTime: 12,
      isAvailable: true,
      description: "Classic beef burger",
      dishCategoryId: cats[1].id,
      images: [
        {
          id: "seed-image-3",
          imageUrl:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
          isThumbnail: true,
        },
      ],
    },
    {
      id: "seed-dish-4",
      name: "French Fries",
      price: 30000,
      preparationTime: 8,
      isAvailable: false,
      description: "Crispy golden fries",
      dishCategoryId: cats[1].id,
      images: [
        {
          id: "seed-image-4",
          imageUrl:
            "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800",
          isThumbnail: true,
        },
      ],
    },
    {
      id: "seed-dish-5",
      name: "Orange Juice",
      price: 25000,
      preparationTime: 5,
      isAvailable: true,
      description: "Fresh orange juice",
      dishCategoryId: cats[2].id,
      images: [
        {
          id: "seed-image-5",
          imageUrl:
            "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800",
          isThumbnail: true,
        },
      ],
    },
  ];
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const cat of cats) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO ${q(T.categories)}
        (${f("Id")}, ${f("Name")}, ${f("Description")}, ${f("Seed")}) VALUES (?, ?, ?, 1)`,
        cat.id,
        cat.name,
        cat.description,
      );
    }
    for (const dish of dishes) {
      await tx.runAsync(
        `INSERT OR IGNORE INTO ${q(T.dishes)}
        (${f("Id")}, ${f("Name")}, ${f("Price")}, ${f("PreparationTime")}, ${f("IsAvailable")},
         ${f("Description")}, ${f("DishCategoryId")}, ${f("Seed")})
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        dish.id,
        dish.name,
        dish.price,
        dish.preparationTime,
        Number(dish.isAvailable),
        dish.description,
        dish.dishCategoryId,
      );
      for (const image of dish.images) {
        await tx.runAsync(
          `INSERT OR IGNORE INTO ${q(T.images)}
          (${f("Id")}, ${f("DishId")}, ${f("ImageUrl")}, ${f("IsThumbnail")})
          VALUES (?, ?, ?, ?)`,
          image.id,
          dish.id,
          image.imageUrl,
          Number(image.isThumbnail),
        );
      }
    }
    await tx.runAsync(
      `INSERT INTO ${q(T.settings)} (${f("Key")}, ${f("Value")}) VALUES (?, ?)`,
      "seeded-v1",
      "true",
    );
  });
}

export async function listCategories(
  includeDeleted = false,
): Promise<DishCategory[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CatRow>(
    `${categorySelect} ${includeDeleted ? "" : `WHERE ${f("Deleted")} = 0`} ORDER BY ${f("Name")} COLLATE NOCASE`,
  );
  return rows.map(toCategory);
}

export async function listDishes(includeDeleted = false): Promise<Dish[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DishRow>(
    `${dishSelect} ${includeDeleted ? "" : `WHERE ${f("Deleted")} = 0`} ORDER BY ${f("Name")} COLLATE NOCASE`,
  );
  const imageRows = await db.getAllAsync<ImageRow>(`SELECT ${f("Id")} AS id,
    ${f("DishId")} AS dishId, ${f("ImageUrl")} AS imageUrl, ${f("IsThumbnail")} AS isThumbnail
    FROM ${q(T.images)} ORDER BY ${f("IsThumbnail")} DESC`);
  const grouped = new Map<string, DishImage[]>();
  for (const item of imageRows) {
    const list = grouped.get(item.dishId) || [];
    list.push({
      id: item.id,
      imageUrl: item.imageUrl,
      isThumbnail: !!item.isThumbnail,
    });
    grouped.set(item.dishId, list);
  }
  return rows.map((r) => toDish(r, grouped.get(r.id) || []));
}

export async function findDish(id: string): Promise<Dish | undefined> {
  return (await listDishes()).find((dish) => dish.id === id);
}

export async function readLanguage(): Promise<Language> {
  const db = await getDatabase();
  const found = await db.getFirstAsync<{ value: string }>(
    `SELECT ${f("Value")} AS value FROM ${q(T.settings)} WHERE ${f("Key")} = ?`,
    "language",
  );
  return found?.value === "vi" ? "vi" : "en";
}

export async function writeLanguage(value: Language): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO ${q(T.settings)} (${f("Key")}, ${f("Value")}) VALUES (?, ?)
    ON CONFLICT(${f("Key")}) DO UPDATE SET ${f("Value")} = excluded.${f("Value")}`,
    "language",
    value,
  );
}

export async function saveCategory(
  input: CategoryInput,
  id?: string,
): Promise<string> {
  const db = await getDatabase();
  const name = input.name.trim();
  if (!name) throw new Error("nameRequired");
  const categories = await listCategories();
  if (
    categories.some(
      (cat) =>
        cat.id !== id &&
        cat.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
  ) {
    throw new Error("categoryDuplicate");
  }
  const current = id ? categories.find((cat) => cat.id === id) : undefined;
  if (id && !current) throw new Error("recordMissing");
  const key = id || uid();
  if (current) {
    await db.runAsync(
      `UPDATE ${q(T.categories)} SET ${f("Name")} = ?, ${f("Description")} = ?,
      ${f("Dirty")} = 1, ${f("Seed")} = 0, ${f("Version")} = ${f("Version")} + 1 WHERE ${f("Id")} = ?`,
      name,
      input.description.trim(),
      key,
    );
  } else {
    await db.runAsync(
      `INSERT INTO ${q(T.categories)}
      (${f("Id")}, ${f("Name")}, ${f("Description")}) VALUES (?, ?, ?)`,
      key,
      name,
      input.description.trim(),
    );
  }
  return key;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  const cat = (await listCategories()).find((item) => item.id === id);
  if (!cat) throw new Error("recordMissing");
  const dishes = await listDishes();
  if (dishes.some((dish) => dish.dishCategoryId === id))
    throw new Error("categoryInUse");
  await db.runAsync(
    `UPDATE ${q(T.categories)} SET ${f("Deleted")} = 1, ${f("Dirty")} = 1,
    ${f("Seed")} = 0, ${f("Version")} = ${f("Version")} + 1 WHERE ${f("Id")} = ?`,
    id,
  );
}

function checkImages(images: DishImage[]): DishImage[] {
  const normalized = images.map((image) => ({
    id: image.id || uid(),
    imageUrl: image.imageUrl.trim(),
    isThumbnail: image.isThumbnail,
  }));
  const seen = new Set<string>();
  for (const item of normalized) {
    if (!/^https?:\/\//i.test(item.imageUrl)) throw new Error("imageInvalid");
    if (seen.has(item.imageUrl)) throw new Error("imageDuplicate");
    seen.add(item.imageUrl);
  }
  if (normalized.length && !normalized.some((image) => image.isThumbnail))
    normalized[0].isThumbnail = true;
  let foundCover = false;
  for (const item of normalized) {
    if (item.isThumbnail) {
      if (foundCover) item.isThumbnail = false;
      foundCover = true;
    }
  }
  return normalized;
}

export async function saveDish(input: DishInput, id?: string): Promise<string> {
  const db = await getDatabase();
  const name = input.name.trim();
  if (!name) throw new Error("nameRequired");
  if (!Number.isFinite(input.price) || input.price <= 0)
    throw new Error("priceInvalid");
  if (!Number.isInteger(input.preparationTime) || input.preparationTime <= 0)
    throw new Error("timeInvalid");
  const categories = await listCategories();
  if (!categories.some((cat) => cat.id === input.dishCategoryId))
    throw new Error("categoryRequired");
  const dishes = await listDishes();
  if (
    dishes.some(
      (dish) =>
        dish.id !== id &&
        dish.dishCategoryId === input.dishCategoryId &&
        dish.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
  )
    throw new Error("nameDuplicate");
  if (id && !dishes.some((dish) => dish.id === id))
    throw new Error("recordMissing");
  const images = checkImages(input.images);
  const key = id || uid();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO ${q(T.dishes)}
      (${f("Id")}, ${f("Name")}, ${f("Price")}, ${f("PreparationTime")}, ${f("IsAvailable")},
       ${f("Description")}, ${f("DishCategoryId")}, ${f("Dirty")}, ${f("Deleted")}, ${f("Seed")}, ${f("Version")})
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 1)
      ON CONFLICT(${f("Id")}) DO UPDATE SET
        ${f("Name")} = excluded.${f("Name")}, ${f("Price")} = excluded.${f("Price")},
        ${f("PreparationTime")} = excluded.${f("PreparationTime")},
        ${f("IsAvailable")} = excluded.${f("IsAvailable")},
        ${f("Description")} = excluded.${f("Description")},
        ${f("DishCategoryId")} = excluded.${f("DishCategoryId")},
        ${f("Dirty")} = 1, ${f("Seed")} = 0, ${f("Version")} = ${q(T.dishes)}.${f("Version")} + 1`,
      key,
      name,
      input.price,
      input.preparationTime,
      Number(input.isAvailable),
      input.description.trim(),
      input.dishCategoryId,
    );
    await tx.runAsync(
      `DELETE FROM ${q(T.images)} WHERE ${f("DishId")} = ?`,
      key,
    );
    for (const image of images) {
      await tx.runAsync(
        `INSERT INTO ${q(T.images)} (${f("Id")}, ${f("DishId")}, ${f("ImageUrl")}, ${f("IsThumbnail")})
        VALUES (?, ?, ?, ?)`,
        image.id,
        key,
        image.imageUrl,
        Number(image.isThumbnail),
      );
    }
  });
  return key;
}

export async function deleteDish(id: string): Promise<void> {
  const db = await getDatabase();
  if (!(await findDish(id))) throw new Error("recordMissing");
  await db.runAsync(
    `UPDATE ${q(T.dishes)} SET ${f("Deleted")} = 1, ${f("Dirty")} = 1,
    ${f("Seed")} = 0, ${f("Version")} = ${f("Version")} + 1 WHERE ${f("Id")} = ?`,
    id,
  );
}

export async function changeThumbnail(
  dishId: string,
  imageId: string,
): Promise<void> {
  const dish = await findDish(dishId);
  if (!dish) throw new Error("recordMissing");
  if (!dish.images.some((image) => image.id === imageId))
    throw new Error("imageInvalid");
  await saveDish(
    {
      ...dish,
      images: dish.images.map((image) => ({
        ...image,
        isThumbnail: image.id === imageId,
      })),
    },
    dishId,
  );
}

/** Chỉ đánh dấu sạch nếu bản local chưa bị người dùng sửa trong lúc HTTP đang chạy. */
export async function markSynced(
  type: "category" | "dish",
  id: string,
  remoteId: string | undefined,
  version: number,
): Promise<void> {
  const db = await getDatabase();
  const table = type === "category" ? T.categories : T.dishes;
  await db.runAsync(
    `UPDATE ${q(table)} SET ${f("RemoteId")} = COALESCE(?, ${f("RemoteId")}),
    ${f("Dirty")} = 0, ${f("Seed")} = 0 WHERE ${f("Id")} = ? AND ${f("Version")} = ?`,
    remoteId || null,
    id,
    version,
  );
}

/** Remote -> SQLite. Không ghi đè phiên bản đang chờ đồng bộ. */
export async function importCategory(cat: DishCategory): Promise<void> {
  const db = await getDatabase();
  const local = (await listCategories(true)).find((x) => x.id === cat.id);
  if (local?.deleted || (local?.dirty && !local.seed)) return;
  await db.runAsync(
    `INSERT INTO ${q(T.categories)}
    (${f("Id")}, ${f("Name")}, ${f("Description")}, ${f("RemoteId")}, ${f("Dirty")}, ${f("Deleted")}, ${f("Seed")})
    VALUES (?, ?, ?, ?, 0, 0, 0)
    ON CONFLICT(${f("Id")}) DO UPDATE SET
      ${f("Name")} = excluded.${f("Name")}, ${f("Description")} = excluded.${f("Description")},
      ${f("RemoteId")} = excluded.${f("RemoteId")}, ${f("Dirty")} = 0, ${f("Seed")} = 0`,
    cat.id,
    cat.name,
    cat.description,
    cat.remoteId || null,
  );
}

export async function importDish(dish: Dish): Promise<void> {
  const db = await getDatabase();
  const local = (await listDishes(true)).find((x) => x.id === dish.id);
  if (local?.deleted || (local?.dirty && !local.seed)) return;
  const cat = (await listCategories()).find(
    (x) => x.id === dish.dishCategoryId,
  );
  if (!cat) return; // Bỏ qua món không có loại hợp lệ từ máy chủ.
  const images = checkImages(dish.images);
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO ${q(T.dishes)}
      (${f("Id")}, ${f("Name")}, ${f("Price")}, ${f("PreparationTime")}, ${f("IsAvailable")},
       ${f("Description")}, ${f("DishCategoryId")}, ${f("RemoteId")}, ${f("Dirty")}, ${f("Deleted")}, ${f("Seed")})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
      ON CONFLICT(${f("Id")}) DO UPDATE SET
        ${f("Name")} = excluded.${f("Name")}, ${f("Price")} = excluded.${f("Price")},
        ${f("PreparationTime")} = excluded.${f("PreparationTime")}, ${f("IsAvailable")} = excluded.${f("IsAvailable")},
        ${f("Description")} = excluded.${f("Description")}, ${f("DishCategoryId")} = excluded.${f("DishCategoryId")},
        ${f("RemoteId")} = excluded.${f("RemoteId")}, ${f("Dirty")} = 0, ${f("Seed")} = 0`,
      dish.id,
      dish.name,
      dish.price,
      dish.preparationTime,
      Number(dish.isAvailable),
      dish.description,
      dish.dishCategoryId,
      dish.remoteId || null,
    );
    await tx.runAsync(
      `DELETE FROM ${q(T.images)} WHERE ${f("DishId")} = ?`,
      dish.id,
    );
    for (const image of images) {
      await tx.runAsync(
        `INSERT INTO ${q(T.images)}
        (${f("Id")}, ${f("DishId")}, ${f("ImageUrl")}, ${f("IsThumbnail")}) VALUES (?, ?, ?, ?)`,
        image.id,
        dish.id,
        image.imageUrl,
        Number(image.isThumbnail),
      );
    }
  });
}

/** Phát hiện dữ liệu bị xóa ở phía server; giữ tombstone để tránh phục hồi nhầm. */
export async function markMissingRemote(
  type: "category" | "dish",
  remoteIds: Set<string>,
): Promise<void> {
  const db = await getDatabase();
  const table = type === "category" ? T.categories : T.dishes;
  const rows =
    type === "category" ? await listCategories(true) : await listDishes(true);
  for (const r of rows) {
    if (r.remoteId && !r.dirty && !r.deleted && !remoteIds.has(r.remoteId)) {
      // Chỉ đánh dấu xóa category nếu không còn món hoạt động.
      if (
        type === "category" &&
        (await listDishes()).some((d) => d.dishCategoryId === r.id)
      )
        continue;
      await db.runAsync(
        `UPDATE ${q(table)} SET ${f("Deleted")} = 1 WHERE ${f("Id")} = ? AND ${f("Dirty")} = 0`,
        r.id,
      );
    }
  }
}
