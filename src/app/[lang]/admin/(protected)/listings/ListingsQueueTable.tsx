"use client";
// مسیر فایل: src/app/[lang]/admin/listings/ListingsQueueTable.tsx
// تسک ۳ فاز ۰۷ — بخش تعاملی «تایید یا حذف آگهی‌ها». دقیقاً هم‌الگو با
// admin/reports/ReportsQueueTable.tsx (تسک ۴/۵): یک select برای تغییر status هر ردیف، با
// حذف خوش‌بینانه (Optimistic) از فهرست فعلی به‌محض موفقیت.
//
// چون یک کامپوننت واحد باید هم آگهی کالا (category/title) و هم آگهی ملک (propertyType/dealType،
// بدون title) را نمایش بدهد، ترجمه‌ی برچسب دسته/نوع دقیقاً همین‌جا انجام می‌شود (نه در لایه‌ی
// queries)، با استفاده از نگاشتِ id خام → dictKey از همان فایل‌های تک‌نقطه‌ی حقیقت
// (LISTING_CATEGORIES/PROPERTY_TYPES/DEAL_TYPES) — دقیقاً همان الگوی REASON_DICT_KEY در
// ReportsQueueTable.tsx.
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { LISTING_CATEGORIES } from "@/lib/marketplace/categories";
import { getListingImageUrl } from "@/lib/marketplace/images";
import { PROPERTY_TYPES } from "@/lib/realEstate/propertyTypes";
import { DEAL_TYPES } from "@/lib/realEstate/dealTypes";
import { getRealEstateImageUrl } from "@/lib/realEstate/images";
import {
  setListingModerationStatusAction,
  type ListingModerationStatus,
  type ListingModule,
} from "./actions";
import type { AdminListingRow } from "@/lib/marketplace/adminListingQueries";
import type { AdminRealEstateRow } from "@/lib/realEstate/adminRealEstateQueries";

const CATEGORY_DICT_KEY: Record<string, string> = Object.fromEntries(
  LISTING_CATEGORIES.map((c) => [c.id, c.dictKey])
);
const PROPERTY_TYPE_DICT_KEY: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map((p) => [p.id, p.dictKey])
);
const DEAL_TYPE_DICT_KEY: Record<string, string> = Object.fromEntries(
  DEAL_TYPES.map((d) => [d.id, d.dictKey])
);

type Row = AdminListingRow | AdminRealEstateRow;

type Dict = {
  statusOptions: Record<ListingModerationStatus, string>;
  updateError: string;
  ownerLabel: string;
  unknownOwner: string;
  currencyLabel: string;
  categories: Record<string, string>;
  propertyTypes: Record<string, string>;
  dealTypes: Record<string, string>;
};

function isRealEstateRow(row: Row): row is AdminRealEstateRow {
  return "propertyType" in row;
}

export function ListingsQueueTable({
  lang,
  module: moduleName,
  items,
  dict,
}: {
  lang: string;
  module: ListingModule;
  items: Row[];
  dict: Dict;
}) {
  const [rows, setRows] = useState(items);
  const [isPending, startTransition] = useTransition();
  const [errorId, setErrorId] = useState<string | null>(null);

  function handleStatusChange(id: string, status: ListingModerationStatus) {
    setErrorId(null);
    startTransition(async () => {
      const result = await setListingModerationStatusAction(lang, moduleName, id, status);
      if (result.success) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      } else {
        setErrorId(id);
      }
    });
  }

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const imageUrl = row.images[0]
          ? isRealEstateRow(row)
            ? getRealEstateImageUrl(row.images[0])
            : getListingImageUrl(row.images[0])
          : null;

        const typeLabel = isRealEstateRow(row)
          ? [
              dict.propertyTypes[PROPERTY_TYPE_DICT_KEY[row.propertyType]] ?? row.propertyType,
              dict.dealTypes[DEAL_TYPE_DICT_KEY[row.dealType]] ?? row.dealType,
            ].join(" · ")
          : dict.categories[CATEGORY_DICT_KEY[row.category]] ?? row.category;

        const titleText = isRealEstateRow(row) ? row.address : row.title;
        const priceText = `${row.price.toLocaleString()} ${dict.currencyLabel}`;
        const subtitleText = isRealEstateRow(row) ? priceText : `${priceText} — ${row.address}`;

        return (
          <Card key={row.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0 bg-slate-100"
                />
              )}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="inline-flex w-fit items-center gap-1 text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {typeLabel}
                </span>
                <span className="font-bold text-text-main truncate">{titleText}</span>
                <span className="text-sm text-text-muted truncate">{subtitleText}</span>
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap">
                {new Date(row.createdAt).toLocaleDateString(lang === "ps" ? "fa-AF" : "fa-IR")}
              </span>
            </div>

            <div className="text-sm text-text-muted">
              {dict.ownerLabel}: {row.ownerName || dict.unknownOwner}
              {row.ownerPhone ? ` (${row.ownerPhone})` : ""}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Icons.CheckCircle className="w-4 h-4 text-text-muted shrink-0" />
              <select
                defaultValue={row.status}
                disabled={isPending}
                onChange={(e) =>
                  handleStatusChange(row.id, e.target.value as ListingModerationStatus)
                }
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold bg-white"
              >
                {(Object.keys(dict.statusOptions) as ListingModerationStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {dict.statusOptions[s]}
                  </option>
                ))}
              </select>
            </div>

            {errorId === row.id && <p className="text-xs text-red-500">{dict.updateError}</p>}
          </Card>
        );
      })}
    </div>
  );
}