import type { CatalogItem } from "../types";
export const catalogLabel = (item: CatalogItem) =>
  item.number == null ? item.name : `${item.number}. ${item.name}`;
