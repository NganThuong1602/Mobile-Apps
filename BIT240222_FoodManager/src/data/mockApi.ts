import {
  CATEGORY_RESOURCE,
  DISH_RESOURCE,
  MOCK_API_BASE_URL,
  PREFIX,
} from "../config/constants";

import type { Dish, DishCategory, DishImage } from "../models/types";

type JsonRecord = Record<string, unknown>;
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

const field = (name: string) => `${PREFIX}${name}`;

function toId(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function read(record: JsonRecord, name: string): unknown {
  return record[field(name)];
}

function parseId(record: JsonRecord): string {
  const id = toId(record.id);

  if (!id) {
    throw new Error("MockAPI không trả về trường id hệ thống.");
  }

  return id;
}

async function request<T>(
  resource: string,
  method: HttpMethod = "GET",
  id?: string,
  body?: JsonRecord,
): Promise<T> {
  const baseUrl = MOCK_API_BASE_URL.replace(/\/$/, "");

  const url =
    `${baseUrl}/${resource}` + (id ? `/${encodeURIComponent(id)}` : "");

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 12000);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`MockAPI ${method} ${resource}: HTTP ${response.status}`);
    }

    if (method === "DELETE") {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ========================================
// CATEGORY: JSON -> MODEL
// ========================================

function parseCategory(record: JsonRecord): DishCategory {
  const id = parseId(record);
  const name = read(record, "Name");

  if (typeof name !== "string" || !name.trim()) {
    throw new Error(`Dữ liệu loại món không hợp lệ: ${id}`);
  }

  return {
    id,
    remoteId: id,
    name,
    description: String(read(record, "Description") ?? ""),
  };
}

// ========================================
// IMAGE: JSON -> MODEL
// ========================================

function parseImages(raw: unknown, dishId: string): DishImage[] {
  let data = raw;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const images: DishImage[] = [];

  for (let index = 0; index < data.length; index++) {
    const value = data[index];

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const record = value as JsonRecord;

    const imageUrl = String(read(record, "ImageUrl") ?? "");

    if (!/^https?:\/\//i.test(imageUrl)) {
      continue;
    }

    const thumbnail = read(record, "IsThumbnail");

    images.push({
      id: `${dishId}-image-${index}`,
      imageUrl,
      isThumbnail:
        thumbnail === true || thumbnail === 1 || thumbnail === "true",
    });
  }

  // Chỉ cho phép tối đa một ảnh đại diện.
  let hasThumbnail = false;

  for (const image of images) {
    if (image.isThumbnail) {
      if (hasThumbnail) {
        image.isThumbnail = false;
      } else {
        hasThumbnail = true;
      }
    }
  }

  if (images.length > 0 && !hasThumbnail) {
    images[0].isThumbnail = true;
  }

  return images;
}

// ========================================
// DISH: JSON -> MODEL
// ========================================

function parseDish(record: JsonRecord): Dish {
  const id = parseId(record);

  const name = read(record, "Name");

  const price = Number(read(record, "Price"));

  const preparationTime = Number(read(record, "PreparationTime"));

  const dishCategoryId = toId(read(record, "DishCategoryId"));

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(preparationTime) ||
    preparationTime <= 0 ||
    !dishCategoryId
  ) {
    throw new Error(`Dữ liệu món ăn không hợp lệ: ${id}`);
  }

  const available = read(record, "IsAvailable");

  return {
    id,
    remoteId: id,
    name,
    price,
    preparationTime,
    isAvailable: available === true || available === 1 || available === "true",
    description: String(read(record, "Description") ?? ""),
    dishCategoryId,
    images: parseImages(read(record, "DishImage"), id),
  };
}

// ========================================
// CATEGORY: MODEL -> JSON
// ========================================

function categoryBody(category: DishCategory): JsonRecord {
  return {
    [field("Name")]: category.name,
    [field("Description")]: category.description,
  };
}

// ========================================
// DISH: MODEL -> JSON
// ========================================

function dishBody(dish: Dish, remoteCategoryId: string): JsonRecord {
  return {
    [field("Name")]: dish.name,
    [field("Price")]: dish.price,
    [field("PreparationTime")]: dish.preparationTime,
    [field("IsAvailable")]: dish.isAvailable,
    [field("Description")]: dish.description,
    [field("DishCategoryId")]: remoteCategoryId,
    [field("DishImage")]: dish.images.map((image) => ({
      [field("ImageUrl")]: image.imageUrl,
      [field("IsThumbnail")]: image.isThumbnail,
    })),
  };
}

// ========================================
// VALIDATE COLLECTION
// ========================================

function parseCollection<T>(
  data: unknown,
  resource: string,
  parser: (record: JsonRecord) => T,
): T[] {
  if (!Array.isArray(data)) {
    throw new Error(`MockAPI ${resource} phải trả về mảng.`);
  }

  return data.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`MockAPI ${resource} có bản ghi sai.`);
    }

    return parser(item as JsonRecord);
  });
}

// ========================================
// GET CATEGORIES
// ========================================

export async function fetchRemoteCategories(): Promise<DishCategory[]> {
  const response = await request<unknown>(CATEGORY_RESOURCE);

  return parseCollection(response, CATEGORY_RESOURCE, parseCategory);
}

// ========================================
// GET DISHES
// ========================================

export async function fetchRemoteDishes(): Promise<Dish[]> {
  const response = await request<unknown>(DISH_RESOURCE);

  return parseCollection(response, DISH_RESOURCE, parseDish);
}

// ========================================
// CREATE / UPDATE CATEGORY
// ========================================

export async function upsertRemoteCategory(
  category: DishCategory,
  remoteId?: string,
): Promise<string> {
  const response = await request<JsonRecord>(
    CATEGORY_RESOURCE,
    remoteId ? "PUT" : "POST",
    remoteId,
    categoryBody(category),
  );

  return parseCategory(response).remoteId!;
}

// ========================================
// CREATE / UPDATE DISH
// ========================================

export async function upsertRemoteDish(
  dish: Dish,
  remoteCategoryId: string,
  remoteId?: string,
): Promise<string> {
  const response = await request<JsonRecord>(
    DISH_RESOURCE,
    remoteId ? "PUT" : "POST",
    remoteId,
    dishBody(dish, remoteCategoryId),
  );

  return parseDish(response).remoteId!;
}

// ========================================
// DELETE CATEGORY
// ========================================

export async function removeRemoteCategory(remoteId: string): Promise<void> {
  await request<void>(CATEGORY_RESOURCE, "DELETE", remoteId);
}

// ========================================
// DELETE DISH
// ========================================

export async function removeRemoteDish(remoteId: string): Promise<void> {
  await request<void>(DISH_RESOURCE, "DELETE", remoteId);
}
