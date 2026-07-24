// مسیر فایل: src/dictionaries/ps.ts
//
// **رفع یافته‌ی ممیزی تسک ۲ فاز ۰۹:** سه مقدار درون کلید admin.services.icons («نجار»، «جوښکار»،
// «خیاط») همان سه ترجمه‌ی ناقصی بودند که در تسک ۱ همین فاز، در ستون name_ps جدول
// service_categories اصلاح شدند («نجار»→«ترکاڼ»، «جوښکار»→«جوشکار» رفع غلط تایپی، «خیاط»→«درزي»)
// اما در این فایل دیکشنری (که مستقل و بدون ارتباط با آن ستون دیتابیس است — این‌جا صرفاً برچسب
// زیر هر آیکون در انتخابگر «کتابخانه‌ی آیکون» پنل مدیریتِ تخصص‌های خدماتی است) فراموش شده بودند.
// اکنون با همان سه مقدار اصلاح‌شده هماهنگ شدند. یادآوری: طبق src/proxy.ts (تسک ۱۱ فاز ۰۷)، کل
// پنل مدیریت فعلاً به دری قفل است، پس این مقادیر پشتو در عمل امروز به هیچ ادمینی نمایش داده
// نمی‌شوند؛ این اصلاح صرفاً برای صحت و آماده‌بودن فایل در صورت بازشدن احتمالی زبان پنل مدیریت در
// آینده انجام شد. مثل تسک ۱، این هم بازبینی هوش مصنوعی است نه مترجم گواهی‌شده/بومی‌گوی پشتو.
export default {
  "meta": {
    "title": "یکجا | هر څه، یو ځای!",
    "description": "د افغانستان جامع سوپر اپلیکیشن. د توکو پېر او پلور، موټر چلوونکي غوښتنه، تخنیکي کارکوونکي او املاک. ګړندی، سپک او بې واسطې. ستا ټولې اړتیاوې، یو ځای!"
  },
  "home": {
    "welcome": "یکجا ته ښه راغلاست",
    "slogan": "هر څه، یو ځای!"
  },
  "nav": {
    "home": "کور",
    "listings": "توکي",
    "transport": "لیږدونه",
    "services": "خدمتونه",
    "profile": "زه"
  },
  "common": {
    "loading": "لږ صبر وکړئ...",
    "success": "په بریالیتوب سره ترسره شو!",
    "error": "یوه ستونزه شوه، بیا هڅه وکړئ.",
    "back": "شاته",
    "next": "مخکې ځه",
    "submit": "ثبتول",
    "retry": "بیا",
    "cancel": "پریږده",
    "stepOf": "پړاو {current} له {total} څخه"
  },
  "dashboard": {
    "quickAccess": "چټک لاسرسی",
    "categories": {
      "listings": "د توکو پېر او پلور",
      "transport": "موټر چلوونکي غوښتنه",
      "services": "تخنیکي کارکوونکي او خدمات",
      "realEstate": "املاک"
    }
  },
  "marketplace": {
    "categories": {
      "food": "خوراکي توکي",
      "buildingMaterials": "د ودانۍ توکي",
      "clothing": "کالي",
      "homeGoods": "د کور توکي",
      "motorcycle": "موټرسایکل",
      "car": "موټر",
      "livestock": "څاروي",
      "agriculture": "کرنیز محصولات",
      "other": "نور"
    },
    "index": {
      "title": "د توکو پېر او پلور",
      "postAdButton": "نوی اعلان ثبت کړئ",
      "allCategoriesLabel": "ټول",
      "searchPlaceholder": "د ښار یا سیمې په نوم لټون وکړئ...",
      "useMyLocationButton": "نږدې اعلانونه وښایاست",
      "locatingButton": "ستاسو ځای موندل کیږي...",
      "locationDeniedNotice": "ستاسو ځای ته لاسرسی ونشو؛ تاسو کولی شئ د ښار یا سیمې په نوم لټون وکړئ.",
      "sortedByDistanceNotice": "ستاسو نږدې اعلانونو پر بنسټ",
      "sortedByNewestNotice": "وروستیو اعلانونو پر بنسټ",
      "distanceKm": "{distance} کیلومتره لرې دی",
      "distanceM": "{distance} متره لرې دی",
      "emptyTitle": "هیڅ اعلان و نه موندل شو",
      "emptyDesc": "ډله یا د لټون عبارت بدل کړئ.",
      "loadMoreButton": "نور موارد وښایاست",
      "loadingButton": "لوډ کیږي..."
    },
    "wizard": {
      "title": "نوی اعلان ثبتول",
      "step1Title": "د خپل توکي ډله وټاکئ",
      "step2Title": "د توکي انځورونه ورزیات کړئ",
      "step2Hint": "له ۱ تر ۵ انځورونه؛ انځورونه په خپله توګه چمتو او فشرده کیږي.",
      "addPhotoButton": "انځور ورزیاتول",
      "removePhotoLabel": "دغه انځور ړنګول",
      "step3Title": "بیه او لنډه توضیح",
      "titleLabel": "د اعلان لنډ سرلیک",
      "titlePlaceholder": "لکه: لومړی درجه وریجې",
      "priceLabel": "بیه (افغانۍ)",
      "pricePlaceholder": "لکه: ۵۰۰",
      "addressLabel": "پته یا سیمه",
      "addressPlaceholder": "لکه: کابل، شهر نو",
      "contactPhoneLabel": "د پیرودونکي لپاره اړیکې شمېره",
      "descriptionLabel": "لنډه توضیح (اختیاري)",
      "descriptionPlaceholder": "د توکي په اړه لنډه توضیح ولیکئ...",
      "step4Title": "وروستی کتنه او خپرول",
      "step4Hint": "له خپرولو مخکې، لاندې معلومات یو ځل وګورئ.",
      "locationNote": "که تاسو اجازه ورکړئ، ستاسو ځای په خپله توګه ثبت کیږي ترڅو نږدې پیرودونکي ستاسو اعلان په اسانۍ سره ومومي.",
      "publishSuccess": "ستاسو اعلان ثبت شو او د مدیر تایید وروسته به وښودل شي.",
      "loginRequiredTitle": "لومړی ننوځئ",
      "loginRequiredDesc": "د اعلان ثبتولو لپاره، لومړی باید د خپل موبایل شمېرې سره حساب ته ننوځئ.",
      "loginRequiredButton": "حساب ته ننوتل",
      "errors": {
        "unauthenticated": "لومړی باید خپل حساب ته ننوځئ.",
        "invalidCategory": "مهرباني وکړئ یوه ډله وټاکئ.",
        "invalidImageCount": "باید له ۱ تر ۵ انځورونه ورزیات کړئ.",
        "invalidTitle": "مهرباني وکړئ د اعلان سرلیک ولیکئ.",
        "invalidPrice": "ورکړل شوې بیه سمه نه ده.",
        "invalidAddress": "مهرباني وکړئ پته یا سیمه ولیکئ.",
        "invalidPhone": "ورکړل شوې اړیکې شمېره سمه نه ده.",
        "invalidImageData": "یو انځور نه شي پروسس کیدای.",
        "uploadFailed": "د انځورونو لېږل ونشول؛ بیا هڅه وکړئ.",
        "dbError": "د اعلان ثبتول ونشول؛ بیا هڅه وکړئ.",
        "compressionFailed": "دغه انځور نه شي چمتو کیدای؛ بل انځور هڅه کړئ.",
        "generic": "یوه ستونزه رامنځته شوه؛ بیا هڅه وکړئ."
      }
    },
    "detail": {
      "backButton": "لړلیک ته ستنېدل",
      "currencyLabel": "افغانۍ",
      "addressLabel": "پته",
      "descriptionTitle": "توضیحات",
      "noDescription": "د دغه اعلان لپاره هیڅ توضیح نه ده ثبت شوې.",
      "callButton": "له پلورونکي سره اړیکه",
      "similarTitle": "ورته اعلانونه",
      "similarEmpty": "اوس مهال بل ورته اعلان و نه موندل شو.",
      "notFoundTitle": "دغه اعلان و نه موندل شو",
      "notFoundDesc": "ممکن دغه اعلان ړنګ شوی وي یا لا تر اوسه د مدیر لخوا تایید شوی نه وي.",
      "backToListingsButton": "د اعلانونو لړلیک ته ستنېدل",
      "sellerSectionTitle": "پلورونکی",
      "viewSellerProfileButton": "د پلورونکي پروفایل کتل"
    }
  },
  "transport": {
    "vehicleTypes": {
      "taxi": "ټکسي",
      "zaranj": "زرنج",
      "rickshaw": "رکشا",
      "tractor": "ټراکتور",
      "pickup": "پیکاپ",
      "truck": "لاری",
      "other": "نور"
    },
    "list": {
      "title": "د موټر چلوونکي غوښتنه",
      "subtitle": "هغه موټر چلوونکي چې اوس مهال «فعال» دي وګورئ؛ لړلیک په ژوندۍ توګه نوی پاتې کیږي.",
      "becomeDriverButton": "زه موټر چلوونکی یم",
      "useMyLocationButton": "نږدې موټر چلوونکي وښایاست",
      "locatingButton": "ستاسو ځای موندل کیږي...",
      "locationDeniedNotice": "ستاسو ځای ته لاسرسی ونشو؛ لړلیک د تازه فعالو موټر چلوونکو پر بنسټ ښودل کیږي.",
      "sortedByDistanceNotice": "ستاسو نږدې موټر چلوونکو پر بنسټ",
      "sortedByNewestNotice": "تازه فعالو موټر چلوونکو پر بنسټ",
      "distanceKm": "{distance} کیلومتره لرې دی",
      "distanceM": "{distance} متره لرې دی",
      "emptyTitle": "اوس مهال هیڅ فعال موټر چلوونکی و نه موندل شو",
      "emptyDesc": "لږ وروسته بیا هڅه وکړئ یا پخپله د موټر چلوونکي په توګه ثبت شئ.",
      "loadMoreButton": "نور موارد وښایاست",
      "loadingButton": "لوډ کیږي...",
      "callButton": "له موټر چلوونکي سره اړیکه"
    },
    "driverProfile": {
      "title": "د موټر چلوونکي پروفایل",
      "subtitle": "لاندې معلومات هغو غوښتونکو ته ښودل کیږي چې د موټر چلوونکي په لټه کې دي.",
      "vehicleTypeSectionTitle": "د خپل موټر ډول وټاکئ",
      "vehicleDetailsLabel": "د موټر مشخصات (اختیاري)",
      "vehicleDetailsPlaceholder": "لکه: پلیټ ۱۲۳۴۵، سپین ټویوټا کرولا",
      "contactPhoneLabel": "د غوښتونکو لپاره اړیکې شمېره",
      "submitButtonCreate": "د موټر چلوونکي پروفایل ثبتول",
      "submitButtonUpdate": "معلومات نوي کول",
      "saveSuccessCreate": "ستاسو د موټر چلوونکي پروفایل ثبت شو.",
      "saveSuccessUpdate": "ستاسو معلومات نوي شول.",
      "inactiveByDefaultNotice": "ستاسو پروفایل به له ثبتولو وروسته غیرفعال وي؛ د غوښتونکو ته د ښودلو لپاره باید وروسته د «فعال» سویچ روښانه کړئ.",
      "activeToggleLabel": "غوښتونکو ته د ښودلو حالت",
      "currentlyActiveNotice": "ستاسو حالت اوس مهال «فعال» دی او غوښتونکي تاسو لیدلی شي.",
      "currentlyInactiveNotice": "ستاسو حالت اوس مهال «غیرفعال» دی او غوښتونکو ته نه ښودل کیږئ.",
      "activeToggleSuccessOn": "ستاسو حالت «فعال» شو.",
      "activeToggleSuccessOff": "ستاسو حالت «غیرفعال» شو.",
      "locationTrackingActiveNotice": "ستاسو ځای هر ۳۰ تر ۶۰ ثانیو په خپله توګه نوی کیږي ترڅو نږدې غوښتونکي تاسو وویني.",
      "locationTrackingDeniedNotice": "ستاسو ځای ته لاسرسی ونشو؛ د غوښتونکو لخوا لیدلو لپاره، مهرباني وکړئ د براوزر تنظیماتو څخه GPS ته لاسرسی فعال کړئ.",
      "locationTrackingUnsupportedNotice": "ستاسو براوزر د ځای موندنې ملاتړ نه کوي.",
      "loginRequiredTitle": "لومړی ننوځئ",
      "loginRequiredDesc": "د موټر چلوونکي پروفایل ثبتولو یا بدلولو لپاره، لومړی باید د خپل موبایل شمېرې سره حساب ته ننوځئ.",
      "loginRequiredButton": "حساب ته ننوتل",
      "photosSectionTitle": "انځورونه (اختیاري)",
      "photosHint": "تاسو کولی شئ تر ۵ انځورونو پورې د ځان یا خپل موټر اضافه کړئ ترڅو د غوښتونکو باور زیات شي.",
      "addPhotoButton": "انځور اضافه کول",
      "removePhotoLabel": "انځور ړنګول",
      "errors": {
        "unauthenticated": "لومړی باید خپل حساب ته ننوځئ.",
        "invalidVehicleType": "مهرباني وکړئ د خپل موټر ډول وټاکئ.",
        "invalidPhone": "ورکړل شوې اړیکې شمېره سمه نه ده.",
        "dbError": "د معلوماتو ثبتول ونشول؛ بیا هڅه وکړئ.",
        "profileNotFound": "لومړی باید د موټر چلوونکي خپل پروفایل ثبت کړئ.",
        "invalidLocation": "د ځای مختصات سم نه دي.",
        "invalidImageCount": "د انځورونو شمېر له اجازه شوي حد څخه ډېر دی.",
        "invalidImageData": "یو انځور سم نه دی؛ بیا هڅه وکړئ.",
        "compressionFailed": "د انځور فشرده کول ونشول؛ بل انځور وازمویئ.",
        "uploadFailed": "د انځور اپلوډ ونشو؛ بیا هڅه وکړئ.",
        "generic": "یوه ستونزه رامنځته شوه؛ بیا هڅه وکړئ."
      }
    }
  },
  "services": {
    "providerProfile": {
      "title": "د متخصص پروفایل",
      "subtitle": "لاندې معلومات هغو کاربرانو ته ښودل کیږي چې د تخنیکي کارکوونکي په لټه کې دي.",
      "categorySectionTitle": "خپل تخصص وټاکئ",
      "categoryEmptyNotice": "اوس مهال هیڅ تخصص د ټاکلو لپاره نه دی ثبت شوی؛ مهرباني وکړئ لږ وروسته بیا سر ورکړئ.",
      "addressLabel": "پته یا سیمه",
      "addressPlaceholder": "لکه: کابل، شهر نو",
      "contactPhoneLabel": "د مشتریانو لپاره اړیکې شمېره",
      "descriptionLabel": "د خپل کار په اړه لنډه توضیح (اختیاري)",
      "descriptionPlaceholder": "لکه: د کار سابقه، ځانګړي مهارتونه، د کار ساعتونه...",
      "submitButtonCreate": "د متخصص پروفایل ثبتول",
      "submitButtonUpdate": "معلومات نوي کول",
      "saveSuccessCreate": "ستاسو د متخصص پروفایل ثبت شو او اوس مهال ټولو لپاره لیدل کیدونکی دی.",
      "saveSuccessUpdate": "ستاسو معلومات نوي شول.",
      "visibleImmediatelyNotice": "د موټر چلوونکي پروفایل برعکس، د متخصص پروفایل هیڅ فعال/غیرفعال سویچ نه لري؛ سملاسی له ثبتولو وروسته به ټولو ته ښکاره یاست.",
      "hiddenByAdminNotice": "ستاسو پروفایل اوس مهال د مدیریت له لوري پټ شوی او په عمومي لیست کې نه ښکاري؛ که تاسو دا تېروتنه ګڼئ، له ملاتړ سره اړیکه ونیسئ.",
      "loginRequiredTitle": "لومړی ننوځئ",
      "loginRequiredDesc": "د متخصص پروفایل ثبتولو یا بدلولو لپاره، لومړی باید د خپل موبایل شمېرې سره حساب ته ننوځئ.",
      "loginRequiredButton": "حساب ته ننوتل",
      "photosSectionTitle": "د نمونې کارونو ګالري (اختیاري)",
      "photosHint": "تاسو کولی شئ تر ۵ انځورونو پورې د خپلو نمونه کارونو اضافه کړئ ترڅو مشتریان مخکې له اړیکې ستاسو د کار کیفیت وویني.",
      "addPhotoButton": "انځور اضافه کول",
      "removePhotoLabel": "انځور ړنګول",
      "errors": {
        "unauthenticated": "لومړی باید خپل حساب ته ننوځئ.",
        "invalidCategory": "مهرباني وکړئ یو تخصص وټاکئ.",
        "invalidAddress": "مهرباني وکړئ پته یا سیمه ولیکئ.",
        "invalidPhone": "ورکړل شوې اړیکې شمېره سمه نه ده.",
        "dbError": "د معلوماتو ثبتول ونشول؛ بیا هڅه وکړئ.",
        "invalidImageCount": "د انځورونو شمېر له اجازه شوي حد څخه ډېر دی.",
        "invalidImageData": "یو انځور سم نه دی؛ بیا هڅه وکړئ.",
        "compressionFailed": "د انځور فشرده کول ونشول؛ بل انځور وازمویئ.",
        "uploadFailed": "د انځور اپلوډ ونشو؛ بیا هڅه وکړئ.",
        "generic": "یوه ستونزه رامنځته شوه؛ بیا هڅه وکړئ."
      }
    },
    "list": {
      "title": "خدمات او تخنیکي کارکوونکي",
      "subtitle": "ثبت شوي متخصصین وګورئ یا یې د تخصص ډول او نږدېوالي پر بنسټ فلټر کړئ.",
      "becomeProviderButton": "زه متخصص یم",
      "searchPlaceholder": "د ښار یا سیمې په نوم لټون...",
      "useMyLocationButton": "نږدې متخصصین وښایاست",
      "locatingButton": "ستاسو ځای موندل کیږي...",
      "locationDeniedNotice": "ستاسو ځای ته لاسرسی ونشو؛ تاسو کولی شئ پرځای یې د ښار یا سیمې نوم په لټون کادر کې ولیکئ.",
      "sortedByDistanceNotice": "ستاسو نږدې متخصصینو پر بنسټ",
      "sortedByNewestNotice": "ټولو ثبت شویو متخصصینو پر بنسټ",
      "allCategoriesLabel": "ټول",
      "distanceKm": "{distance} کیلومتره لرې دی",
      "distanceM": "{distance} متره لرې دی",
      "emptyTitle": "له دې مشخصاتو سره متخصص و نه موندل شو",
      "emptyDesc": "بل فلټر وازمویاست یا لږ وروسته بیا سر ورکړئ.",
      "loadMoreButton": "نور موارد وښایاست",
      "loadingButton": "لوډ کیږي...",
      "callButton": "له متخصص سره اړیکه"
    }
  },
  "realEstate": {
    "propertyTypes": {
      "houseSale": "د کور پلورل",
      "houseRent": "د کور کرایه",
      "landSale": "د ځمکې پلورل",
      "garden": "باغ",
      "shop": "دوکان",
      "warehouse": "ګدام",
      "other": "نور"
    },
    "dealTypes": {
      "sale": "پلورل",
      "rent": "کرایه"
    },
    "index": {
      "title": "املاک",
      "postAdButton": "د ملکیت اعلان ثبتول",
      "allPropertyTypesLabel": "ټول",
      "allDealTypesLabel": "ټول",
      "searchPlaceholder": "د ښار یا سیمې په نوم لټون وکړئ...",
      "useMyLocationButton": "نږدې اعلانونه وښایاست",
      "locatingButton": "ستاسو ځای موندل کیږي...",
      "locationDeniedNotice": "ستاسو ځای ته لاسرسی ونشو؛ تاسو کولی شئ د ښار یا سیمې په نوم لټون وکړئ.",
      "sortedByDistanceNotice": "ستاسو نږدې د ملکیت اعلانونو پر بنسټ",
      "sortedByNewestNotice": "وروستیو د ملکیت اعلانونو پر بنسټ",
      "distanceKm": "{distance} کیلومتره لرې دی",
      "distanceM": "{distance} متره لرې دی",
      "emptyTitle": "هیڅ د ملکیت اعلان و نه موندل شو",
      "emptyDesc": "د ملکیت ډول، د معاملې ډول یا د لټون عبارت بدل کړئ.",
      "loadMoreButton": "نور موارد وښایاست",
      "loadingButton": "لوډ کیږي..."
    },
    "wizard": {
      "title": "د ملکیت اعلان ثبتول",
      "step1Title": "د خپل ملکیت ډول وټاکئ",
      "dealTypeQuestion": "دغه ملک د پلورلو دی که کرایې لپاره؟",
      "dealTypeSale": "پلورل",
      "dealTypeRent": "کرایه",
      "step2Title": "د ملکیت انځورونه ورزیات کړئ",
      "step2Hint": "له ۱ تر ۵ انځورونه.",
      "addPhotoButton": "انځور ورزیاتول",
      "removePhotoLabel": "دغه انځور ړنګول",
      "step3Title": "بیه او لنډه توضیح",
      "propertyTypeLabel": "د ملکیت ډول",
      "dealTypeLabel": "د معاملې ډول",
      "priceLabel": "بیه (افغانۍ)",
      "pricePlaceholder": "لکه: ۵۰۰۰۰۰",
      "addressLabel": "پته یا سیمه",
      "addressPlaceholder": "لکه: کابل، شهر نو",
      "descriptionLabel": "لنډه توضیح (اختیاري)",
      "descriptionPlaceholder": "د ملکیت په اړه لنډه توضیح ولیکئ...",
      "step4Title": "وروستی کتنه او خپرول",
      "step4Hint": "له خپرولو مخکې، لاندې معلومات یو ځل وګورئ.",
      "locationNote": "که تاسو اجازه ورکړئ، ستاسو ځای په خپله توګه ثبت کیږي ترڅو نږدې پیرودونکي ستاسو اعلان په اسانۍ سره ومومي.",
      "publishSuccess": "ستاسو د ملکیت اعلان ثبت شو او د مدیر تایید وروسته به وښودل شي.",
      "loginRequiredTitle": "لومړی ننوځئ",
      "loginRequiredDesc": "د ملکیت اعلان ثبتولو لپاره، لومړی باید د خپل موبایل شمېرې سره حساب ته ننوځئ.",
      "loginRequiredButton": "حساب ته ننوتل",
      "errors": {
        "unauthenticated": "لومړی باید خپل حساب ته ننوځئ.",
        "invalidPropertyType": "مهرباني وکړئ د ملکیت ډول وټاکئ.",
        "invalidDealType": "مهرباني وکړئ د معاملې ډول (پلورل/کرایه) وټاکئ.",
        "invalidImageCount": "باید له ۱ تر ۵ انځورونه ورزیات کړئ.",
        "invalidPrice": "ورکړل شوې بیه سمه نه ده.",
        "invalidAddress": "مهرباني وکړئ پته یا سیمه ولیکئ.",
        "invalidImageData": "یو انځور نه شي پروسس کیدای.",
        "compressionFailed": "دغه انځور نه شي چمتو کیدای؛ بل انځور هڅه کړئ.",
        "uploadFailed": "د انځورونو لېږل ونشول؛ بیا هڅه وکړئ.",
        "dbError": "د ملکیت اعلان ثبتول ونشول؛ بیا هڅه وکړئ.",
        "generic": "یوه ستونزه رامنځته شوه؛ بیا هڅه وکړئ."
      }
    },
    "detail": {
      "backButton": "لړلیک ته ستنېدل",
      "currencyLabel": "افغانۍ",
      "addressLabel": "پته",
      "propertyTypeLabel": "د ملکیت ډول",
      "dealTypeLabel": "د معاملې ډول",
      "descriptionTitle": "توضیحات",
      "noDescription": "د دغه اعلان لپاره هیڅ توضیح نه ده ثبت شوې.",
      "callButton": "له اعلان ورکوونکي سره اړیکه",
      "similarTitle": "ورته اعلانونه",
      "similarEmpty": "اوس مهال بل ورته اعلان و نه موندل شو.",
      "notFoundTitle": "دغه اعلان و نه موندل شو",
      "notFoundDesc": "ممکن دغه اعلان ړنګ شوی وي یا لا تر اوسه د مدیر لخوا تایید شوی نه وي.",
      "backToListingsButton": "د ملکیت اعلانونو لړلیک ته ستنېدل",
      "ownerSectionTitle": "اعلان ورکوونکی",
      "viewOwnerProfileButton": "د اعلان ورکوونکي پروفایل کتل"
    }
  },
  "disclaimer": {
    "title": "د کارونې مخکې مهم یادونه",
    "message": "ټولې معاملې او تادیات په یکجا کې مخامخ او د دې اپلیکیشن څخه بهر ترسره کیږي. یکجا د پیسو لیږد، د توکي کیفیت یا د معاملې سموالي په اړه هیڅ مسوولیت نه لري؛ مهرباني وکړئ له هرې معاملې مخکې، بل اړخ او توکی په دقت سره وګورئ.",
    "acknowledgeButton": "پوه شوم"
  },
  "contact": {
    "title": "له موږ سره اړیکه",
    "phoneLabel": "د ملاتړ شمیره",
    "addressLabel": "مرکزي دفتر پته",
    "domainLabel": "رسمي ویب پاڼه",
    "phoneVal": "+93 78 663 3322",
    "addressVal": "افغانستان، کابل، شهر نو، انصاري څلور لارې، یکجا سوداګریز کمپلکس، دریم پوړ",
    "domainVal": "yakja.top",
    "brandVal": "یکجا | YAKJA"
  },
  "footer": {
    "copyright": "ټول حقونه د یکجا پلیټ فارم سره خوندي دي.",
    "aboutUs": "زموږ په اړه",
    "contact": "اپلیکیشن ملاتړ اړیکه"
  },
  "auth": {
    "login": {
      "title": "یکجا ته ننوتل",
      "subtitle": "خپل د موبایل شمېره ولیکئ ترڅو د ننوتلو کوډ درته واستول شي.",
      "phoneLabel": "د موبایل شمېره",
      "phonePlaceholder": "07XXXXXXXX",
      "submit": "کوډ ولېږه",
      "sending": "کوډ لېږل کیږي..."
    },
    "verify": {
      "title": "کوډ ولیکئ",
      "subtitle": "هغه کوډ چې درته لېږل شوی دلته ولیکئ.",
      "codeLabel": "۶ رقمي کوډ",
      "codePlaceholder": "------",
      "submit": "تایید او ننوتل",
      "verifying": "کتل کیږي...",
      "changeNumber": "د شمېرې بدلول",
      "resend": "بیا لېږل",
      "resendIn": "بیا لېږل تر {seconds} ثانیو وروسته",
      "codeSent": "نوی کوډ ولېږل شو.",
      "loginSuccess": "ښه راغلاست!"
    },
    "errors": {
      "invalidPhone": "د موبایل شمېره سمه نه ده؛ بیا یې وګورئ.",
      "cooldown": "مهرباني وکړئ {seconds} ثانیې وروسته بیا هڅه وکړئ.",
      "rateLimited": "ستاسو غوښتنې ډېرې شوې؛ لږ وروسته بیا هڅه وکړئ.",
      "dbError": "یوه تخنیکي ستونزه رامنځته شوه؛ بیا هڅه وکړئ.",
      "notFound": "لومړی باید کوډ ترلاسه کړئ.",
      "expired": "دغه کوډ پای ته رسېدلی؛ نوی کوډ واخلئ.",
      "tooManyAttempts": "ستاسو هڅې ډېرې شوې؛ نوی کوډ واخلئ.",
      "wrongCode": "کوډ سم نه دی.",
      "blocked": "ستاسو حساب بند شوی؛ له ملاتړ سره اړیکه ونیسئ.",
      "generic": "یوه ستونزه رامنځته شوه؛ بیا هڅه وکړئ."
    }
  },
  "admin": {
    "login": {
      "title": "د مدیر ننوتل",
      "subtitle": "دا برخه یوازې د یکجا مدیر لپاره ده؛ د خپل کارن‌نوم او پټنوم سره ننوځئ.",
      "usernameLabel": "کارن‌نوم",
      "usernamePlaceholder": "د مدیر کارن‌نوم",
      "passwordLabel": "پټنوم",
      "passwordPlaceholder": "د مدیر پټنوم",
      "submit": "پینل ته ننوتل",
      "submitting": "کتل کیږي...",
      "errors": {
        "invalidCredentials": "کارن‌نوم یا پټنوم سم نه دی.",
        "blocked": "د دې حساب لاسرسی بند شوی دی.",
        "locked": "د پرله‌پسې ناکامو هڅو له امله، ننوتل لنډمهاله بند شوی؛ څو دقیقې وروسته بیا هڅه وکړئ.",
        "dbError": "یوه تخنیکي ستونزه رامنځته شوه؛ بیا هڅه وکړئ.",
        "generic": "یوه ستونزه رامنځته شوه؛ بیا هڅه وکړئ."
      }
    },
    "nav": {
      "dashboard": "کورپاڼه",
      "users": "کاروونکي",
      "listings": "اعلانونه",
      "sms": "پیغامونه",
      "services": "خدمتونه",
      "reports": "راپورونه",
      "providers": "موټر چلوونکي او متخصصین",
      "logout": "وتل"
    },
    "users": {
      "title": "د کاروونکو مدیریت",
      "subtitle": "په یکجا کې ثبت شوي کاروونکي وګورئ او که اړتیا وي یې بند یا خلاص کړئ.",
      "searchPlaceholder": "د نوم یا موبایل شمېرې په مرسته لټون...",
      "searchButton": "لټون",
      "empty": "له دې مشخصاتو سره کاروونکی و نه موندل شو.",
      "colName": "نوم",
      "colPhone": "د موبایل شمېره",
      "colRole": "رول",
      "colJoined": "د غړیتوب نېټه",
      "colStatus": "حالت",
      "noNameLabel": "بې نومه",
      "roleLabels": {
        "user": "عادي کاروونکی",
        "admin": "د سیسټم مدیر"
      },
      "statusActive": "فعال",
      "statusBlocked": "بند شوی",
      "blockButton": "بندول",
      "unblockButton": "خلاصول",
      "updateError": "د حالت نوي کول ونشول؛ بیا هڅه وکړئ."
    },
    "listings": {
      "title": "د اعلانونو تایید یا ړنګول",
      "subtitle": "د توکو او ملکیت اعلانونه وګورئ او د دوی حالت تایید یا ړنګ کړئ.",
      "moduleLabels": {
        "marketplace": "د توکو اعلانونه",
        "realEstate": "د ملکیت اعلانونه"
      },
      "statusOptions": {
        "pending": "په انتظار کې د تایید",
        "approved": "تاییدشوی",
        "deleted": "ړنګ شوی"
      },
      "empty": "په دې برخه کې هیڅ اعلان نشته.",
      "ownerLabel": "ثبت‌کوونکی",
      "unknownOwner": "نامعلوم",
      "currencyLabel": "افغانۍ",
      "updateError": "د حالت نوي کول ونشول؛ بیا هڅه وکړئ."
    },
    "sms": {
      "title": "د پیغام کوډونه (ازمېښتي حالت)",
      "notice": "ځکه چې تر اوسه اصلي د پیغام پینل نه دی اخیستل شوی، د ننوتلو کوډونه دلته ښودل کیږي ترڅو تاسو یې دوستانو او ازمویونکو ته ووایاست.",
      "colPhone": "د موبایل شمېره",
      "colCode": "کوډ",
      "colCreated": "د غوښتنې وخت",
      "colExpires": "پای موده",
      "colStatus": "حالت",
      "colAttempts": "هڅې",
      "statusActive": "فعال",
      "statusExpired": "پای ته رسېدلی",
      "statusUsed": "کارول شوی",
      "empty": "تر اوسه هیڅ کوډ نه دی غوښتل شوی."
    },
    "services": {
      "title": "د خدمتونو د تخصصونو مدیریت",
      "subtitle": "د «خدمتونو» برخه کې ښودل‌شویو تخصصونو ورزیاتول، سمول او فعال/غیرفعالول.",
      "addButton": "نوی تخصص ورزیاتول",
      "empty": "تر اوسه هیڅ تخصص نه دی ثبت شوی.",
      "statusActive": "فعال",
      "statusInactive": "غیرفعال",
      "statusChangeSuccess": "د تخصص حالت نوی شو.",
      "editButton": "سمول",
      "formTitleCreate": "نوی تخصص ورزیاتول",
      "formTitleEdit": "د تخصص سمول",
      "nameFaLabel": "نوم (دري)",
      "nameFaPlaceholder": "لکه: برقکار",
      "namePsLabel": "نوم (پښتو)",
      "namePsPlaceholder": "لکه: برېښنا کار",
      "iconSectionTitle": "د تخصص انځور",
      "iconTabLibrary": "له کتابتون څخه ټاکل",
      "iconTabCustom": "دلخواه لېږل",
      "uploadButton": "فایل ټاکل",
      "uploadHint": "PNG، JPG، WEBP یا SVG فایل، تر ۳۰۰ کیلوبایتو پورې.",
      "saveButton": "خوندي کول",
      "saveSuccessCreate": "نوی تخصص په بریالیتوب سره ورزیات شو.",
      "saveSuccessUpdate": "تخصص په بریالیتوب سره نوی شو.",
      "errors": {
        "unauthorized": "تاسو دې برخې ته لاسرسی نه لرئ.",
        "invalidName": "مهرباني وکړئ دري او پښتو نومونه ولیکئ.",
        "invalidIcon": "مهرباني وکړئ یو انځور وټاکئ یا ولېږئ.",
        "invalidFileType": "د ټاکل شوي فایل ډول اجازه نه لري.",
        "fileTooLarge": "د فایل اندازه له اجازه شوي حد څخه زیاته ده.",
        "uploadFailed": "د انځور لېږل ونشول؛ بیا هڅه وکړئ.",
        "dbError": "خوندي کول ونشول؛ بیا هڅه وکړئ.",
        "generic": "یوه ستونزه رامنځته شوه؛ بیا هڅه وکړئ."
      },
      "icons": {
        "builder": "بنا",
        "electrician": "برېښنا کار",
        "plumber": "نلدوان",
        "carpenter": "ترکاڼ",
        "painter": "رنګمال",
        "welder": "جوشکار",
        "mechanic": "مېخانیک",
        "dailyWorker": "ورځنی کارګر",
        "tailor": "درزي",
        "other": "نور",
        "wrench": "پانا",
        "user": "کس",
        "box": "بکس",
        "truck": "لاری"
      }
    },
    "reports": {
      "title": "د تخلف راپورونو د بررسۍ کتار",
      "subtitle": "د کارونکو لخوا ثبت شوي راپورونه وګورئ او د دوی حالت نوی کړئ.",
      "empty": "په دې برخه کې هیڅ راپور نشته.",
      "targetMissing": "دا مورد نور په سیسټم کې و نه موندل شو (شاید ړنګ شوی وي).",
      "targetTypes": {
        "listing": "د توکو اعلان",
        "driver": "موټروان",
        "service_provider": "د خدمت متخصص",
        "real_estate": "د ملکیت اعلان",
        "user": "د کارن پروفایل"
      },
      "reasonLabel": "د راپور دلیل",
      "reporterLabel": "راپور ورکوونکی",
      "unknownReporter": "نامعلوم",
      "statusOptions": {
        "pending": "په انتظار کې",
        "reviewed": "کتل شوی",
        "resolved": "حل شوی"
      },
      "updateError": "د حالت نوي کول ونشول؛ بیا هڅه وکړئ."
    },
    "providers": {
      "title": "د موټر چلوونکو او تخنیکي متخصصینو ځانګړی مدیریت",
      "subtitle": "د ثبت شویو موټر چلوونکو او متخصصینو لیست وګورئ او که اړتیا وي، د هرچا پروفایل له عامه لیست نه پټ یا بیا فعال کړئ.",
      "moduleLabels": {
        "drivers": "موټر چلوونکي",
        "services": "خدمتي متخصصین"
      },
      "searchPlaceholder": "د تلیفون شمېرې یا پتې پر بنسټ لټون...",
      "searchButton": "لټون",
      "empty": "په دې برخه کې هیڅ پروفایل و نه موندل شو.",
      "ownerLabel": "ثبت کوونکی",
      "unknownOwner": "نامعلوم",
      "statusActive": "فعال",
      "statusInactive": "غیرفعال",
      "updateError": "د حالت نوي کول ونشول؛ بیا هڅه وکړئ."
    },
    "dashboard": {
      "welcome": "د یکجا مدیریتي پینل ته ښه راغلاست.",
      "statsSectionTitle": "احصایوي پینل",
      "statsTotalUsersLabel": "ټول کاروونکي",
      "statsActiveDriversLabel": "فعال موټر چلوونکي",
      "statsPendingReportsLabel": "په انتظار کې راپورونه",
      "statsListingsByCategoryTitle": "د توکو اعلانونه د ډلې پر بنسټ",
      "listingsCardTitle": "د اعلانونو تایید",
      "listingsCardDesc": "د توکو او ملکیت هغه اعلانونه چې په انتظار کې دي وګورئ او تایید یا ړنګ یې کړئ.",
      "listingsPendingBadge": "{count} په انتظار کې",
      "smsCardTitle": "پیغامونه",
      "smsCardDesc": "د دوستانو او ازمویونکو د ننوتلو کوډونه وګورئ، تر هغه چې اصلي پینل واخیستل شي.",
      "reportsCardTitle": "د تخلف راپورونه",
      "reportsCardDesc": "د کارونکو لخوا ثبت شویو راپورونو کتل او رسیدگي.",
      "reportsPendingBadge": "{count} په انتظار کې",
      "providersCardTitle": "موټر چلوونکي او متخصصین",
      "providersCardDesc": "د ټولو ثبت شویو موټر چلوونکو او خدمتي متخصصینو لیست او د هر پروفایل فعال/غیرفعالول.",
      "backupCardTitle": "د بیک‌اپ اخیستل",
      "backupCardDesc": "د کاروونکو د معلوماتو بشپړ بیک‌اپ نسخه سمدلاسه د یوې فایل په بڼه ترلاسه کړئ.",
      "backupHelpText": "چې دې تڼۍ باندې کلیک وکړئ، یوه کوچنۍ فایل به په اتوماتیک ډول ستاسو په ګرځنده تلیفون یا کمپیوټر کې ډاونلوډ شي؛ هماغه فایل چې معمولاً د «Downloads» یا «ډاونلوډونه» په فولډر کې خوندي کیږي. دا فایل د سایټ د ټولو کاروونکو د معلوماتو یو بیک‌اپ نسخه ده، سمدلاسه تر همدې شیبې پورې. اړتیا نشته چې فایل خلاص کړئ یا په دننه کې د څه شي پوه شئ؛ یوازې کافي ده چې دا کار هره ډېره موده (لکه هره اونۍ یو ځل) وکړئ او ډاونلوډ شوې فایل په یوه خوندي ځای کې (لکه ستاسو ایمیل یا یوه جلا فلش/هارډ) وساتئ، تر څو د هر ډول ستونزې په صورت کې معلومات له لاسه ونه ورکړل شي."
    },
    "unauthorized": "تاسو د مدیریت پینل ته لاسرسی نه لرئ."
  },
  "profile": {
    "title": "زما پروفایل",
    "guestTitle": "تر اوسه یې نه یاست ننوتلي",
    "guestDesc": "د حساب معلوماتو لیدو او تنظیماتو بدلولو لپاره، لومړی ننوځئ.",
    "loginButton": "حساب ته ننوتل",
    "phoneLabel": "ستاسو د موبایل شمېره",
    "roleAdmin": "د سیسټم مدیر",
    "adminPanelLink": "مدیریت پینل ته لاړ شئ",
    "languageTitle": "د اپلیکیشن ژبه",
    "languageDesc": "د ټولو پاڼو ژبه له دې ځایه بدله کړئ.",
    "languageFa": "دري",
    "languagePs": "پښتو",
    "logout": "له حساب څخه وتل"
  },
  "reports": {
    "reportButtonLabel": "د تخلف راپور",
    "newPage": {
      "title": "د تخلف راپور",
      "subtitle": "زموږ سره مرسته وکړئ چې یکجا ټولو لپاره خوندي وساتو.",
      "invalidTargetDesc": "دا غوښتنه سمه نه ده. مهرباني وکړئ له همدې اعلان یا پروفایل څخه، بیا په «د تخلف راپور» کلیک وکړئ.",
      "backButton": "شاته",
      "loginRequiredTitle": "لومړی ننوځئ",
      "loginRequiredDesc": "د راپور ثبتولو لپاره، لازمه ده چې لومړی د خپل موبایل شمېرې سره خپل حساب ته ننوځئ.",
      "loginRequiredButton": "حساب ته ننوتل",
      "reasonSectionTitle": "د خپل راپور دلیل وټاکئ",
      "reasons": {
        "scam": "درغلي",
        "inappropriateContent": "ناسمه منځپانګه",
        "fakeListing": "جعلي اعلان",
        "other": "نور"
      },
      "descriptionLabel": "نور توضیحات (اختیاري)",
      "descriptionPlaceholder": "که نور توضیحات لرئ، دلته یې ولیکئ...",
      "noPunitiveNotice": "دا راپور مستقیماً یکجا د بررسۍ ټیم ته لیږل کیږي؛ پرته له انساني بررسۍ هیڅ اقدام (لکه بندول یا ړنګول) نه ترسره کیږي.",
      "submitButton": "د راپور لیږل",
      "successTitle": "ستاسو راپور ثبت شو",
      "successDesc": "ستاسو له همکارۍ مننه؛ د یکجا بررسي ټیم به دا مورد ژر تر ژره وګوري.",
      "successButton": "بیرته اصلي پاڼې ته",
      "errors": {
        "unauthenticated": "لومړی باید خپل حساب ته ننوځئ.",
        "invalidTarget": "دا غوښتنه سمه نه ده.",
        "invalidReason": "مهرباني وکړئ د راپور دلیل وټاکئ.",
        "targetNotFound": "هغه مورد چې غواړئ یې راپور ورکړئ ونه موندل شو؛ کیدای شي حذف شوی وي.",
        "cannotReportSelf": "تاسو نشئ کولی خپل پروفایل ته راپور ورکړئ.",
        "dbError": "د راپور ثبتول ستونزمن شول؛ بیا هڅه وکړئ.",
        "generic": "یوه ستونزه رامنځته شوه؛ بیا هڅه وکړئ."
      }
    }
  },
  "users": {
    "publicProfile": {
      "backButton": "شاته",
      "fallbackName": "د یکجا کارن",
      "memberSinceLabel": "د یکجا غړی له {year} کال راهیسې",
      "listingsCountLabel": "فعال د توکو اعلانونه",
      "realEstateCountLabel": "فعال د ملکیت اعلانونه",
      "notFoundTitle": "دغه کارن و نه موندل شو",
      "notFoundDesc": "کیدای شي دغه حساب ړنګ شوی یا بند شوی وي.",
      "backToHomeButton": "اصلي پاڼې ته ستنېدل"
    }
  }
};