import NetInfo from "@react-native-community/netinfo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { MOCK_API_CONFIGURED } from "../config/constants";
import * as storage from "../data/database";
import { synchronize } from "../data/sync";
import { translate, type TranslationKey } from "../i18n/strings";
import type {
  CategoryInput,
  Dish,
  DishCategory,
  DishInput,
  Filters,
  Language,
  SyncStatus,
} from "../models/types";

const initialFilters: Filters = {
  search: "",
  categoryId: "",
  onlyAvailable: false,
  minPrice: "",
  maxPrice: "",
  sort: "name",
};

type FoodContextValue = {
  ready: boolean;
  initError: string;
  dishes: Dish[];
  categories: DishCategory[];
  language: Language;
  t: (key: TranslationKey) => string;
  chooseLanguage: (lang: Language) => Promise<void>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  resetFilters: () => void;
  online: boolean;
  syncStatus: SyncStatus;
  refresh: () => Promise<void>;
  saveDish: (input: DishInput, id?: string) => Promise<string>;
  removeDish: (id: string) => Promise<void>;
  setThumbnail: (dishId: string, imageId: string) => Promise<void>;
  saveCategory: (input: CategoryInput, id?: string) => Promise<string>;
  removeCategory: (id: string) => Promise<void>;
};

const FoodContext = createContext<FoodContextValue | null>(null);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [online, setOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
  const onlineRef = useRef(false);
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    const [nextCats, nextDishes] = await Promise.all([
      storage.listCategories(),
      storage.listDishes(),
    ]);
    setCategories(nextCats);
    setDishes(nextDishes);
  }, []);

  const syncNow = useCallback(async () => {
    if (!onlineRef.current || syncingRef.current || !MOCK_API_CONFIGURED)
      return;
    syncingRef.current = true;
    setSyncStatus("syncing");
    try {
      await synchronize();
      await refresh();
      setSyncStatus("synced");
    } catch (error) {
      console.warn("Sync failed (local data is safe):", error);
      setSyncStatus(onlineRef.current ? "error" : "offline");
    } finally {
      syncingRef.current = false;
    }
  }, [refresh]);

  useEffect(() => {
    let mounted = true;
    const onConnection = (connected: boolean) => {
      onlineRef.current = connected;
      if (!mounted) return;
      setOnline(connected);
      if (!connected) setSyncStatus("offline");
      else if (!MOCK_API_CONFIGURED) setSyncStatus("disabled");
      else void syncNow();
    };
    const unsubscribe = NetInfo.addEventListener((state) => {
      onConnection(!!state.isConnected && state.isInternetReachable !== false);
    });
    const stateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncNow();
    });
    const timer = setInterval(() => {
      void syncNow();
    }, 20000);

    (async () => {
      try {
        await storage.getDatabase();
        const savedLang = await storage.readLanguage();
        if (mounted) setLanguage(savedLang);
        await refresh();
        if (mounted) setReady(true);
        const network = await NetInfo.fetch();
        onConnection(
          !!network.isConnected && network.isInternetReachable !== false,
        );
      } catch (error) {
        if (mounted) setInitError(String(error));
      }
    })();
    return () => {
      mounted = false;
      unsubscribe();
      stateSubscription.remove();
      clearInterval(timer);
    };
  }, [refresh, syncNow]);

  const afterChange = async () => {
    await refresh();
    if (onlineRef.current) void syncNow();
  };

  const chooseLanguage = async (lang: Language) => {
    await storage.writeLanguage(lang);
    setLanguage(lang);
  };

  return (
    <FoodContext.Provider
      value={{
        ready,
        initError,
        dishes,
        categories,
        language,
        t: (key) => translate(language, key),
        chooseLanguage,
        filters,
        setFilters,
        resetFilters: () => setFilters(initialFilters),
        online,
        syncStatus,
        refresh,
        saveDish: async (input, id) => {
          const key = await storage.saveDish(input, id);
          await afterChange();
          return key;
        },
        removeDish: async (id) => {
          await storage.deleteDish(id);
          await afterChange();
        },
        setThumbnail: async (dishId, imageId) => {
          await storage.changeThumbnail(dishId, imageId);
          await afterChange();
        },
        saveCategory: async (input, id) => {
          const key = await storage.saveCategory(input, id);
          await afterChange();
          return key;
        },
        removeCategory: async (id) => {
          await storage.deleteCategory(id);
          await afterChange();
        },
      }}
    >
      {children}
    </FoodContext.Provider>
  );
}

export function useFood() {
  const context = useContext(FoodContext);
  if (!context) throw new Error("useFood must be used inside FoodProvider");
  return context;
}
