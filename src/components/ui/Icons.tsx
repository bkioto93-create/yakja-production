// مسیر فایل: src/components/ui/Icons.tsx
// مجموعه‌ی گرافیک‌های مستقل SVG بدون وابستگی به لایسنس بیرونی جهت بهینه‌سازیِ قطعی اپ.
import React from 'react';

export const Icons = {
  Home: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  Box: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  Truck: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  ),
  Wrench: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  ),
  User: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  CheckCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  AlertCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  Phone: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  MessageSquare: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  LogOut: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  LayoutDashboard: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="3" width="7" height="9"></rect>
      <rect x="14" y="3" width="7" height="5"></rect>
      <rect x="14" y="12" width="7" height="9"></rect>
      <rect x="3" y="16" width="7" height="5"></rect>
    </svg>
  ),

  // --- افزوده‌شده در فاز ۰۲ (تسک ۱) — آیکون دسته‌بندی‌های ماژول خرید و فروش کالا ---
  CategoryFood: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="14" r="7"></circle>
      <path d="M12 7c0-2 1-4 3-4"></path>
      <path d="M9 4c1.2 0 2.2.9 2.6 2"></path>
    </svg>
  ),
  CategoryBuildingMaterials: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <rect x="1.5" y="4" width="7" height="5" rx="0.5"></rect>
      <rect x="9.5" y="4" width="7" height="5" rx="0.5"></rect>
      <rect x="17.5" y="4" width="5" height="5" rx="0.5"></rect>
      <rect x="-1" y="10" width="7" height="5" rx="0.5"></rect>
      <rect x="7" y="10" width="7" height="5" rx="0.5"></rect>
      <rect x="15" y="10" width="7" height="5" rx="0.5"></rect>
      <rect x="1.5" y="16" width="7" height="5" rx="0.5"></rect>
      <rect x="9.5" y="16" width="7" height="5" rx="0.5"></rect>
      <rect x="17.5" y="16" width="5" height="5" rx="0.5"></rect>
    </svg>
  ),
  CategoryClothing: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M9 3L4 6.5V10h3v11h10V10h3V6.5L15 3l-3 2-3-2z"></path>
    </svg>
  ),
  CategoryHomeGoods: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M4 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"></path>
      <path d="M4 12h16v6a1 1 0 0 1-1 1h-1v2h-2v-2H8v2H6v-2H5a1 1 0 0 1-1-1v-6z"></path>
      <path d="M4 15h16"></path>
    </svg>
  ),
  CategoryMotorcycle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="5" cy="17" r="3"></circle>
      <circle cx="19" cy="17" r="3"></circle>
      <path d="M5 17h6l3-6h4"></path>
      <path d="M11 11L9 7H6"></path>
      <path d="M15 11l2 2h2"></path>
    </svg>
  ),
  CategoryCar: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5"></path>
      <rect x="2" y="13" width="20" height="5" rx="1"></rect>
      <circle cx="7" cy="18.5" r="1.5"></circle>
      <circle cx="17" cy="18.5" r="1.5"></circle>
    </svg>
  ),
  CategoryLivestock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M4 9c0-2 2-4 4-4h8c2 0 4 2 4 4v3c0 3-2 6-4 7H8c-2-1-4-4-4-7V9z"></path>
      <circle cx="9" cy="10" r="1"></circle>
      <circle cx="15" cy="10" r="1"></circle>
      <path d="M3 6l2 3"></path>
      <path d="M21 6l-2 3"></path>
      <path d="M10 15h4"></path>
    </svg>
  ),
  CategoryAgriculture: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M12 3v18"></path>
      <path d="M12 5c-2 1-4 1-4 3s2 2 4 3"></path>
      <path d="M12 5c2 1 4 1 4 3s-2 2-4 3"></path>
      <path d="M12 11c-2 1-4 1-4 3s2 2 4 3"></path>
      <path d="M12 11c2 1 4 1 4 3s-2 2-4 3"></path>
    </svg>
  ),
  CategoryOther: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="5" cy="12" r="1.75"></circle>
      <circle cx="12" cy="12" r="1.75"></circle>
      <circle cx="19" cy="12" r="1.75"></circle>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۴/۵ فاز ۰۲ — آیکون «افزودن عکس» در مرحله‌ی دوم فرم ثبت آگهی ---
  Camera: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۶ فاز ۰۲ — آیکون موقعیت مکانی (آدرس آگهی) و پیکان بازگشت ---
  MapPin: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  // چون کل رابط کاربری همیشه RTL است (fa و ps هردو راست‌به‌چپ)، پیکان «بازگشت» رو به راست
  // طراحی شده تا هم‌سو با جهت طبیعی خواندن صفحه باشد.
  ArrowRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۷ فاز ۰۲ — آیکون جستجوی دستی (شهر/منطقه) و دکمه‌ی «موقعیت من» ---
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  LocateFixed: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <line x1="12" y1="2" x2="12" y2="5"></line>
      <line x1="12" y1="19" x2="12" y2="22"></line>
      <line x1="2" y1="12" x2="5" y2="12"></line>
      <line x1="19" y1="12" x2="22" y2="12"></line>
      <circle cx="12" cy="12" r="7"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۸ فاز ۰۲ — آیکون اطلاع‌رسانی (پیام یک‌باره‌ی سلب مسئولیت معاملات) ---
  Info: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۱ فاز ۰۳ — آیکون انواع وسیله نقلیه ماژول حمل‌ونقل ---
  // یادداشت: برای «کامیون» عمداً آیکون تازه ساخته نشد؛ همان Icons.Truck موجود (که هم‌اکنون در
  // ناوبری/داشبورد برای کل ماژول حمل‌ونقل استفاده می‌شود) در src/lib/transport/vehicleTypes.ts
  // مستقیماً برای نوع «کامیون» هم استفاده می‌شود. به همین ترتیب، برای «سایر» از همان
  // Icons.CategoryOther (فاز ۰۲) استفاده شد تا نماد «سایر» در کل اپ یکدست بماند. پس اینجا فقط
  // ۵ آیکون واقعاً تازه لازم بود: تاکسی، زرنج، ریکشا، تراکتور، وانت.
  VehicleTaxi: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <rect x="9" y="3.5" width="6" height="3" rx="0.5"></rect>
      <path d="M4.5 13l1.4-4.3A2 2 0 0 1 7.8 7.3h8.4a2 2 0 0 1 1.9 1.4L19.5 13"></path>
      <rect x="2.5" y="13" width="19" height="5" rx="1"></rect>
      <circle cx="7" cy="18.5" r="1.5"></circle>
      <circle cx="17" cy="18.5" r="1.5"></circle>
    </svg>
  ),
  VehicleZaranj: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M9 8V5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V8"></path>
      <path d="M4 17v-6a2 2 0 0 1 2-2h5.5l4.5 4v4"></path>
      <path d="M4 17h15"></path>
      <circle cx="7" cy="19" r="2"></circle>
      <circle cx="17" cy="19" r="2"></circle>
    </svg>
  ),
  VehicleRickshaw: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M3.5 14.5c0-3.3 2.5-6 5.7-6h1.6c3.2 0 5.7 2.7 5.7 6"></path>
      <path d="M16.5 14.5H20l2 3.5"></path>
      <path d="M3.5 14.5H2"></path>
      <circle cx="7.5" cy="18.5" r="2.3"></circle>
      <circle cx="17" cy="18.5" r="2.3"></circle>
    </svg>
  ),
  VehicleTractor: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="6" cy="18" r="3.2"></circle>
      <circle cx="17.5" cy="18.5" r="2"></circle>
      <path d="M9 18h5.5"></path>
      <path d="M8.5 18V9h3l3 4h2.5v5"></path>
      <path d="M11.5 9V6h2.5"></path>
    </svg>
  ),
  VehiclePickup: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M2 16.5V12a1 1 0 0 1 1-1h5.2l2.6-3.5h3.2a1 1 0 0 1 1 1V12h3a2 2 0 0 1 2 2v2.5"></path>
      <path d="M2 16.5h19"></path>
      <circle cx="6.5" cy="18.5" r="1.7"></circle>
      <circle cx="17.5" cy="18.5" r="1.7"></circle>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۳ فاز ۰۴ — آیکون‌های اختصاصی ۹ تخصص خدماتی (پایه‌ی بند ۶.۳) که در
  // کتابخانه‌ی «انتخاب از آیکون‌های آماده» بخش مدیریت تخصص‌های خدماتی پنل ادمین استفاده می‌شوند.
  // مقدار هر کلید، دقیقاً همان icon_key است که در ستون service_categories.icon_key ذخیره شده
  // (بذر شده در 10_phase_04_service_categories_schema.sql، فاز ۰۴ تسک ۱). برای تخصص «سایر»
  // آیکون تازه ساخته نشد؛ همان الگوی «کامیون/سایر» در vehicleTypes.ts تکرار شد — نگاشت آن در
  // src/lib/services/serviceCategoryIcons.ts به Icons.CategoryOther انجام می‌شود.
  ServiceBuilder: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M3 21l6-6"></path>
      <path d="M9 15l5.5-5.5a3 3 0 1 0-4-4L5 11"></path>
      <path d="M14 4l2-2"></path>
    </svg>
  ),
  ServiceElectrician: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <polygon points="13 2 4 14 12 14 10 22 20 10 12 10 12 2"></polygon>
    </svg>
  ),
  ServicePlumber: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M5 9h9a3 3 0 0 1 3 3v1"></path>
      <path d="M5 9V6"></path>
      <circle cx="5" cy="5" r="1.5"></circle>
      <path d="M17 15v1a2 2 0 0 1-2 2"></path>
      <path d="M13.5 20.5c0-1.5 1.2-2.5 1.5-3.5.3 1 1.5 2 1.5 3.5a1.5 1.5 0 0 1-3 0z"></path>
    </svg>
  ),
  ServiceCarpenter: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M3 21L14 10"></path>
      <path d="M14 10l7-7"></path>
      <path d="M13 9l1 1"></path>
      <path d="M15 7l1 1"></path>
      <path d="M17 5l1 1"></path>
      <circle cx="5" cy="19" r="1.2"></circle>
    </svg>
  ),
  ServicePainter: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="4" width="10" height="6" rx="1"></rect>
      <path d="M8 10v3"></path>
      <path d="M8 13h3a2 2 0 0 1 2 2v2"></path>
      <path d="M13 17v4"></path>
    </svg>
  ),
  ServiceWelder: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M4 9a8 5 0 0 1 16 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path>
      <rect x="8" y="9" width="8" height="3" rx="0.5"></rect>
      <path d="M9 15l-1 6"></path>
      <path d="M15 15l1 6"></path>
    </svg>
  ),
  ServiceMechanic: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="3.5"></circle>
      <path d="M12 2.5v3"></path>
      <path d="M12 18.5v3"></path>
      <path d="M2.5 12h3"></path>
      <path d="M18.5 12h3"></path>
      <path d="M5.4 5.4l2.1 2.1"></path>
      <path d="M16.5 16.5l2.1 2.1"></path>
      <path d="M5.4 18.6l2.1-2.1"></path>
      <path d="M16.5 7.5l2.1-2.1"></path>
    </svg>
  ),
  ServiceDailyWorker: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M4 15a8 6 0 0 1 16 0"></path>
      <rect x="2" y="15" width="20" height="2.8" rx="1"></rect>
      <path d="M12 5v4"></path>
    </svg>
  ),
  ServiceTailor: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="6" cy="6" r="2.5"></circle>
      <circle cx="6" cy="18" r="2.5"></circle>
      <path d="M8.2 7.8L20 20"></path>
      <path d="M8.2 16.2L20 4"></path>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۳ فاز ۰۴ — آیکون‌های عمومی رابط کاربری برای بخش «مدیریت تخصص‌های
  // خدماتی» پنل ادمین (افزودن/ویرایش/بستن مودال/آپلود آیکون سفارشی). هیچ‌کدام مختص یک ماژول
  // خاص نیستند و می‌توانند در فازهای بعدی هم (مثلاً فاز ۰۷ پنل مدیریت) بازاستفاده شوند.
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Edit: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  ),
  X: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Upload: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  // --- افزوده‌شده در تسک ۱ فاز ۰۵ — آیکون انواع ملک ماژول املاک ---
  // یادداشت: برای «سایر» عمداً آیکون تازه ساخته نشد؛ همان Icons.CategoryOther (فاز ۰۲) در
  // src/lib/realEstate/propertyTypes.ts مستقیماً برای نوع «سایر» هم استفاده می‌شود — دقیقاً همان
  // تصمیمی که در vehicleTypes.ts (فاز ۰۳) گرفته شد، تا نماد «سایر» در کل اپ یکدست بماند. پس
  // اینجا فقط ۶ آیکون واقعاً تازه لازم بود: فروش خانه، اجاره خانه، فروش زمین، باغ، مغازه، سوله.
  PropertyHouseSale: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M2.5 11L11 4l6 5"></path>
      <path d="M4.5 10v9a1 1 0 0 0 1 1h7.5"></path>
      <path d="M8.5 20v-5.5h3"></path>
      <path d="M17.5 8.5l4 4a1 1 0 0 1 0 1.4l-2.6 2.6a1 1 0 0 1-1.4 0l-4-4V9a1 1 0 0 1 1-1h2.5a1 1 0 0 1 .5.5z"></path>
      <circle cx="18" cy="10.5" r="0.6"></circle>
    </svg>
  ),
  PropertyHouseRent: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M2.5 11L10 4.5l5.5 4.7"></path>
      <path d="M4.5 10v9a1 1 0 0 0 1 1h6.5"></path>
      <path d="M7.5 20v-5h3"></path>
      <circle cx="17.5" cy="9.5" r="2"></circle>
      <path d="M19 11l3 3-1.3 1.3"></path>
      <path d="M20.5 13.8l1.2 1.2"></path>
    </svg>
  ),
  PropertyLand: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M3 8l4-3 14 2-3 12-15-2z"></path>
      <path d="M7 5v3"></path>
      <path d="M17 7v3"></path>
      <path d="M18 19v-3"></path>
      <path d="M4 17v-3"></path>
    </svg>
  ),
  PropertyGarden: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M12 21v-7"></path>
      <path d="M12 14a5 5 0 0 0 5-5c0-.3 0-.6-.1-.9A4 4 0 0 0 12 3a4 4 0 0 0-4.9 5.1A5 5 0 0 0 12 14z"></path>
      <path d="M9 21h6"></path>
    </svg>
  ),
  PropertyShop: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M3 9l1-5h16l1 5"></path>
      <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"></path>
      <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"></path>
      <path d="M9.5 20v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5"></path>
    </svg>
  ),
  PropertyWarehouse: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M3 20V10a9 5 0 0 1 18 0v10"></path>
      <path d="M3 20h18"></path>
      <path d="M8 20v-6h3v6"></path>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۳ فاز ۰۶ — آیکون دکمه‌ی مشترک «گزارش تخلف»
  // (src/components/reports/ReportButton.tsx)، استفاده‌شده روی هر آگهی/پروفایل ---
  Flag: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
      <line x1="4" y1="22" x2="4" y2="3"></line>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۴ فاز ۰۶ — سه آیکون تازه برای انتخابگر «دلیل گزارش»
  // (src/lib/reports/reasons.ts)؛ برای گزینه‌ی «سایر» عمداً آیکون تازه ساخته نشد، دقیقاً هم‌الگو
  // با vehicleTypes.ts/propertyTypes.ts: همان Icons.CategoryOther موجود بازاستفاده شد ---
  ReportScam: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  ReportInappropriate: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  ),
  ReportFakeListing: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۱ فاز ۰۷ — آیکون قفل برای هدر صفحه‌ی مستقل ورود ادمین
  // (src/app/[lang]/admin/login/page.tsx) ---
  Lock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۲ فاز ۰۷ — آیکون‌های مسدودسازی/رفع مسدودی در بخش «مدیریت کاربران»
  // پنل ادمین (src/app/[lang]/admin/users/UsersTable.tsx). عمداً دو آیکون مجزا (نه یک آیکون
  // با رنگ متفاوت)، دقیقاً هم‌رویکرد با CheckCircle/AlertCircle موجود: تمایز باید هم از طریق
  // شکل و هم رنگ باشد، نه فقط رنگ (خوانایی بهتر روی صفحه‌های کوچک و کم‌کیفیت). ---
  UserX: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <line x1="18" y1="8" x2="23" y2="13"></line>
      <line x1="23" y1="8" x2="18" y2="13"></line>
    </svg>
  ),
  UserCheck: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <polyline points="17 11 19 13 23 9"></polyline>
    </svg>
  ),

  // --- افزوده‌شده در تسک ۵ فاز ۰۷ — آیکون ناوبری بخش «مدیریت اختصاصی رانندگان و متخصصین فنی»
  // (src/app/[lang]/admin/layout.tsx + admin/page.tsx). عمداً یک آیکون تازه و مستقل (نه بازاستفاده
  // از Truck یا Wrench موجود) چون این بخش هم رانندگان و هم متخصصین را با هم پوشش می‌دهد؛ یک نماد
  // «گروهی از افراد» (برخلاف Icons.User که تک‌نفره است) این دوگانگی را بهتر از هر دو نماد اختصاصی
  // (وسیله نقلیه/آچار) منتقل می‌کند. ---
  Users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),

  // --- افزوده‌شده در فاز ۰۷ (تسک ۸) — آیکون کارت «تهیه بک‌آپ» در داشبورد ادمین ---
  Download: (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
};