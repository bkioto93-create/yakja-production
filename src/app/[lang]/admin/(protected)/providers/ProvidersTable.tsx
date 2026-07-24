"use client";
// مسیر فایل: src/app/[lang]/admin/providers/ProvidersTable.tsx
// تسک ۵ فاز ۰۷ — بخش تعاملی «مدیریت اختصاصی رانندگان و متخصصین فنی». دقیقاً هم‌رویکرد با
// ServiceCategoriesManager.tsx (فاز ۰۴، تسک ۳) از نظر سوییچ (کامپوننت مشترک Switch +
// به‌روزرسانی خوش‌بینانه + بازگردانی وضعیت قبلی در صورت خطا)، و هم‌رویکرد با
// ListingsQueueTable.tsx (فاز ۰۷، تسک ۳) از نظر یک کامپوننت واحد که هر دو نوع ردیف
// (راننده/متخصص) را با یک Type Guard تشخیص می‌دهد — به‌جای دو کامپوننت تقریباً تکراری.
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { setDriverActiveAction, setServiceProviderActiveAction } from "./actions";
import type { AdminDriverRow } from "@/lib/transport/adminDriverQueries";
import type { AdminServiceProviderRow } from "@/lib/services/adminServiceProviderQueries";

export type ProvidersModule = "drivers" | "services";

type Row = AdminDriverRow | AdminServiceProviderRow;

function isDriverRow(row: Row): row is AdminDriverRow {
  return "vehicleType" in row;
}

type Dict = {
  ownerLabel: string;
  unknownOwner: string;
  statusActive: string;
  statusInactive: string;
  updateError: string;
  vehicleTypes: Record<string, string>;
};

export function ProvidersTable({
  lang,
  module: moduleName,
  items,
  dict,
}: {
  lang: string;
  module: ProvidersModule;
  items: Row[];
  dict: Dict;
}) {
  const [rows, setRows] = useState(items);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  function handleToggle(id: string, nextActive: boolean) {
    setErrorId(null);
    const previousRows = rows;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: nextActive } : r)));
    setTogglingId(id);

    startTransition(async () => {
      const result =
        moduleName === "drivers"
          ? await setDriverActiveAction(id, nextActive)
          : await setServiceProviderActiveAction(id, nextActive);

      setTogglingId(null);

      if (!result.success) {
        setRows(previousRows);
        setErrorId(id);
      }
    });
  }

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const rowIsPending = isPending && togglingId === row.id;
        const titleText = isDriverRow(row)
          ? dict.vehicleTypes[row.vehicleType] ?? row.vehicleType
          : lang === "ps"
            ? row.categoryNamePs ?? row.categoryNameFa ?? ""
            : row.categoryNameFa ?? row.categoryNamePs ?? "";
        const subtitleText = isDriverRow(row)
          ? row.vehicleDetails
            ? `${row.contactPhone} — ${row.vehicleDetails}`
            : row.contactPhone
          : `${row.contactPhone} — ${row.address}`;

        return (
          <Card key={row.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="font-bold text-text-main truncate">{titleText}</span>
                <span className="text-sm text-text-muted truncate" dir="ltr">
                  {subtitleText}
                </span>
              </div>
            </div>

            <div className="text-sm text-text-muted">
              {dict.ownerLabel}: {row.ownerName || dict.unknownOwner}
              {row.ownerPhone ? ` (${row.ownerPhone})` : ""}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span className={`font-bold text-sm ${row.isActive ? "text-emerald-600" : "text-red-500"}`}>
                {row.isActive ? dict.statusActive : dict.statusInactive}
              </span>
              <Switch
                checked={row.isActive}
                onChange={(val) => handleToggle(row.id, val)}
                disabled={rowIsPending}
                label={row.isActive ? dict.statusActive : dict.statusInactive}
              />
            </div>

            {errorId === row.id && <p className="text-xs text-red-500">{dict.updateError}</p>}
          </Card>
        );
      })}
    </div>
  );
}