export type Language = "en" | "vi";

export type DishImage = {
  id: string;
  imageUrl: string;
  isThumbnail: boolean;
};

export type DishCategory = {
  id: string;
  name: string;
  description: string;
  remoteId?: string;
  dirty?: boolean;
  deleted?: boolean;
  seed?: boolean;
  version?: number;
};

export type Dish = {
  id: string;
  name: string;
  price: number;
  preparationTime: number;
  isAvailable: boolean;
  description: string;
  dishCategoryId: string;
  images: DishImage[];
  remoteId?: string;
  dirty?: boolean;
  deleted?: boolean;
  seed?: boolean;
  version?: number;
};

export type DishInput = Omit<
  Dish,
  "id" | "remoteId" | "dirty" | "deleted" | "seed" | "version"
>;
export type CategoryInput = Pick<DishCategory, "name" | "description">;

export type Filters = {
  search: string;
  categoryId: string;
  onlyAvailable: boolean;
  minPrice: string;
  maxPrice: string;
  sort: "name" | "priceAsc" | "priceDesc" | "timeAsc";
};

export type SyncStatus =
  | "disabled"
  | "offline"
  | "syncing"
  | "synced"
  | "error";
