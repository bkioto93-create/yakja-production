// مسیر فایل: src/app/[lang]/admin/services/ServiceCategoriesManager.tsx
// تسک ۳ فاز ۰۴ — بخش تعاملی «مدیریت تخصص‌های خدماتی». دقیقاً هم‌رویکرد با
// src/app/[lang]/transport/driver/DriverProfileClient.tsx (فاز ۰۳) برای بروزرسانی خوش‌بینانه‌ی
// سوییچ فعال/غیرفعال + router.refresh() بعد از هر ذخیره‌ی موفق (این پروژه از revalidatePath
// استفاده نمی‌کند؛ الگوی ثابتش همیشه router.refresh() بعد از یک Server Action موفق بوده است).
//
// همان IconCategoryPicker فاز ۰۲ برای «انتخاب از کتابخانه» بازاستفاده شد (بدون هیچ کامپوننت
// تازه‌ی مشابه) — دقیقاً طبق همان الگویی که DriverProfileClient برای انتخاب نوع وسیله استفاده
// کرده بود.
"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Spinner } from "@/components/ui/Spinner";
import { Icons } from "@/components/ui/Icons";
import { IconCategoryPicker } from "@/components/ui/IconCategoryPicker";
import { useToast } from "@/components/ui/ToastProvider";
import {
  SERVICE_CATEGORY_BUILTIN_ICONS,
  getBuiltinIconComponent,
} from "@/lib/services/serviceCategoryIcons";
import type { ServiceCategory } from "@/lib/services/serviceCategories";
import {
  createServiceCategoryAction,
  updateServiceCategoryAction,
  setServiceCategoryActiveAction,
  uploadServiceCategoryIconAction,
  type ServiceCategoryFormInput,
} from "./actions";
import type { getDictionary } from "@/dictionaries/getDictionary";

type Dict = Awaited<ReturnType<typeof getDictionary>>;

const MAX_ICON_BYTES = 300 * 1024;
const ALLOWED_ICON_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function ServiceCategoriesManager({
  dict,
  initialCategories,
}: {
  dict: Dict;
  initialCategories: ServiceCategory[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const t = dict.admin.services;
  const errorsDict = t.errors as Record<string, string>;

  const [categories, setCategories] = useState(initialCategories);
  // بعد از هر router.refresh() (پس از افزودن/ویرایش موفق)، سرور دوباره فهرست کامل را می‌فرستد؛
  // این useEffect وضعیت محلی را با همان نسخه‌ی تازه هماهنگ نگه می‌دارد.
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startToggling] = useTransition();

  const errorText = (code: string) => errorsDict[code] ?? errorsDict.generic;

  function openCreateForm() {
    setEditingCategory(null);
    setIsFormOpen(true);
  }

  function openEditForm(category: ServiceCategory) {
    setEditingCategory(category);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCategory(null);
  }

  function handleSaved(message: string) {
    closeForm();
    showToast(message, "success");
    router.refresh();
  }

  function handleToggleActive(category: ServiceCategory, nextValue: boolean) {
    const previousCategories = categories;
    // به‌روزرسانی خوش‌بینانه؛ همان الگوی سوییچ فعال/غیرفعال راننده در فاز ۰۳.
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, isActive: nextValue } : c))
    );
    setTogglingId(category.id);

    startToggling(async () => {
      const result = await setServiceCategoryActiveAction(category.id, nextValue);
      setTogglingId(null);

      if (!result.success) {
        setCategories(previousCategories);
        showToast(errorText(result.error), "error");
        return;
      }

      showToast(t.statusChangeSuccess, "success");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="primary" onClick={openCreateForm} className="self-start gap-2">
        <Icons.Plus className="w-5 h-5" />
        {t.addButton}
      </Button>

      <div className="flex flex-col gap-3">
        {categories.map((category) => {
          const BuiltinIcon =
            category.iconSource === "builtin" ? getBuiltinIconComponent(category.iconKey) : null;

          return (
            <Card key={category.id} className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
                {category.iconSource === "custom" && category.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={category.iconUrl} alt="" className="w-8 h-8 object-contain" />
                ) : BuiltinIcon ? (
                  <BuiltinIcon className="w-6 h-6" />
                ) : null}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-main truncate">{category.nameFa}</p>
                <p className="text-sm text-text-muted truncate">{category.namePs}</p>
              </div>

              <Switch
                checked={category.isActive}
                onChange={(val) => handleToggleActive(category, val)}
                disabled={togglingId === category.id}
                label={category.isActive ? t.statusActive : t.statusInactive}
              />

              <button
                type="button"
                onClick={() => openEditForm(category)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/5 shrink-0"
                aria-label={t.editButton}
              >
                <Icons.Edit className="w-5 h-5" />
              </button>
            </Card>
          );
        })}

        {categories.length === 0 && (
          <Card className="p-8 text-center text-text-muted text-sm">{t.empty}</Card>
        )}
      </div>

      {isFormOpen && (
        <ServiceCategoryFormPanel
          dict={dict}
          editingCategory={editingCategory}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ServiceCategoryFormPanel({
  dict,
  editingCategory,
  onClose,
  onSaved,
}: {
  dict: Dict;
  editingCategory: ServiceCategory | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { showToast } = useToast();
  const t = dict.admin.services;
  const errorsDict = t.errors as Record<string, string>;
  const iconLabelsDict = t.icons as Record<string, string>;
  const isEditMode = !!editingCategory;

  const [nameFa, setNameFa] = useState(editingCategory?.nameFa ?? "");
  const [namePs, setNamePs] = useState(editingCategory?.namePs ?? "");
  const [iconSource, setIconSource] = useState<"builtin" | "custom">(
    editingCategory?.iconSource === "custom" ? "custom" : "builtin"
  );
  const [builtinIconKey, setBuiltinIconKey] = useState<string>(
    editingCategory?.iconSource === "builtin" && editingCategory.iconKey
      ? editingCategory.iconKey
      : SERVICE_CATEGORY_BUILTIN_ICONS[0].key
  );
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(
    editingCategory?.iconSource === "custom" ? editingCategory.iconUrl : null
  );

  const [isUploadingIcon, startUploadingIcon] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const errorText = (code: string) => errorsDict[code] ?? errorsDict.generic;

  function handleIconFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // اجازه‌ی انتخاب دوباره‌ی همان فایل در آینده (مثلاً بعد از خطا)

    if (!file) return;

    if (!ALLOWED_ICON_TYPES.includes(file.type)) {
      showToast(errorText("invalidFileType"), "error");
      return;
    }
    if (file.size > MAX_ICON_BYTES) {
      showToast(errorText("fileTooLarge"), "error");
      return;
    }

    startUploadingIcon(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadServiceCategoryIconAction(formData);

      if (!result.success) {
        showToast(errorText(result.error), "error");
        return;
      }

      setCustomIconUrl(result.data.url);
    });
  }

  function handleSubmit() {
    if (!nameFa.trim() || !namePs.trim()) {
      showToast(errorText("invalidName"), "error");
      return;
    }
    if (iconSource === "custom" && !customIconUrl) {
      showToast(errorText("invalidIcon"), "error");
      return;
    }

    const input: ServiceCategoryFormInput = {
      nameFa,
      namePs,
      iconSource,
      iconKey: iconSource === "builtin" ? builtinIconKey : null,
      iconUrl: iconSource === "custom" ? customIconUrl : null,
    };

    startSaving(async () => {
      const result = isEditMode
        ? await updateServiceCategoryAction(editingCategory!.id, input)
        : await createServiceCategoryAction(input);

      if (!result.success) {
        showToast(errorText(result.error), "error");
        return;
      }

      onSaved(isEditMode ? t.saveSuccessUpdate : t.saveSuccessCreate);
    });
  }

  const isBusy = isSaving || isUploadingIcon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-text-main text-lg">
            {isEditMode ? t.formTitleEdit : t.formTitleCreate}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:bg-bg-base shrink-0"
            aria-label={dict.common.cancel}
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <Input
          label={t.nameFaLabel}
          placeholder={t.nameFaPlaceholder}
          value={nameFa}
          onChange={(e) => setNameFa(e.target.value)}
        />
        <Input
          label={t.namePsLabel}
          placeholder={t.namePsPlaceholder}
          value={namePs}
          onChange={(e) => setNamePs(e.target.value)}
        />

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-text-main">{t.iconSectionTitle}</span>

          <div className="flex gap-2 bg-bg-base rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setIconSource("builtin")}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
                iconSource === "builtin" ? "bg-white shadow-sm text-primary" : "text-text-muted"
              }`}
            >
              {t.iconTabLibrary}
            </button>
            <button
              type="button"
              onClick={() => setIconSource("custom")}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
                iconSource === "custom" ? "bg-white shadow-sm text-primary" : "text-text-muted"
              }`}
            >
              {t.iconTabCustom}
            </button>
          </div>

          {iconSource === "builtin" && (
            <IconCategoryPicker
              options={SERVICE_CATEGORY_BUILTIN_ICONS.map((opt) => ({
                id: opt.key,
                label: iconLabelsDict[opt.dictKey] ?? opt.dictKey,
                icon: <opt.icon className="w-7 h-7" />,
              }))}
              value={builtinIconKey}
              onChange={setBuiltinIconKey}
            />
          )}

          {iconSource === "custom" && (
            <div className="flex flex-col items-center gap-3 bg-bg-base rounded-2xl p-5">
              {customIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customIconUrl} alt="" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-text-muted">
                  <Icons.Upload className="w-7 h-7" />
                </div>
              )}

              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-text-main hover:border-primary transition-colors">
                  {isUploadingIcon ? (
                    <Spinner className="w-4 h-4" label={dict.common.loading} />
                  ) : (
                    <Icons.Upload className="w-4 h-4" />
                  )}
                  {t.uploadButton}
                </span>
                <input
                  type="file"
                  accept={ALLOWED_ICON_TYPES.join(",")}
                  className="hidden"
                  onChange={handleIconFileChange}
                  disabled={isUploadingIcon}
                />
              </label>
              <p className="text-xs text-text-muted text-center">{t.uploadHint}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-2">
          <Button variant="outline" fullWidth onClick={onClose} disabled={isBusy}>
            {dict.common.cancel}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            loading={isSaving}
            disabled={isBusy}
          >
            {t.saveButton}
          </Button>
        </div>
      </div>
    </div>
  );
}

