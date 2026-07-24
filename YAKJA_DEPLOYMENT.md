# سند دپلویمنت پروژه یکجا (YAKJA)
از صفر تا آنلاین‌شدن روی دامنه‌ی `yakja.top`

---

## ⚠️ یک نکته‌ی امنیتی مهم — قبل از هر چیز بخوانید

توکن گیت‌هاب، کلیدهای سوپابیس و `SESSION_SECRET` که فرستادی، همین الان داخل تاریخچه‌ی این چت ذخیره شده‌اند. این با نگه‌داشتن آن‌ها در `.env.local` روی کامپیوتر خودت فرق دارد — یعنی از این لحظه این‌ها را باید «دیده‌شده» در نظر بگیری، نه محرمانه.

پیشنهاد جدی من (نه یک تشریفات، یک اقدام واقعی):

1. **توکن گیت‌هاب را همین الان Revoke کن و یکی تازه بساز:**
   GitHub → Settings → Developer settings → Personal access tokens → پیدا کردن همین توکن → Delete/Revoke → Generate new token (با scope `repo`).
2. اگر امکانش هست، **کلید `SUPABASE_SERVICE_ROLE_KEY`** و `SUPABASE_SECRET_KEY` را هم از پنل Supabase (Project Settings → API) بازتولید (Rotate/Regenerate) کن، چون این کلید دسترسی کامل به دیتابیس را دور می‌زند (RLS را دور می‌زند).
3. **هیچ‌کدام از این مقادیر را داخل کد یا گیت‌هاب کامیت نکن.** خوشبختانه `.gitignore` پروژه‌ات از قبل `.env*` را نادیده می‌گیرد — همین‌طور نگه‌اش دار.

بعد از عوض‌کردن توکن گیت‌هاب و کلیدهای سوپابیس، مقادیر جدید را جای مقادیر قدیمی در `.env.local` و در مراحل پایین‌تر (تنظیم Environment Variables در Vercel) استفاده کن. حالا برویم سراغ مراحل.

---

## پیش‌نیازها

| ابزار | برای چی لازمه | لینک |
|---|---|---|
| Git | ارسال کد به گیت‌هاب | نصب‌شده فرض می‌شود (اگر نیست: git-scm.com) |
| Node.js | اجرای پروژه Next.js | نصب‌شده فرض می‌شود |
| حساب گیت‌هاب | میزبانی کد | همین ریپازیتوری `bkioto93-create/yakja-production` |
| حساب Vercel | هاست/دیپلوی | با همان اکانت گیت‌هاب می‌توانی بسازی |
| دسترسی به پنل دامنه `yakja.top` | تنظیم DNS | جایی که دامنه را خریدی (مثلاً Namecheap, GoDaddy, Cloudflare و…) |

همه‌ی دستورات زیر را در **PowerShell** یا **Git Bash** روی ویندوز، داخل مسیر پروژه اجرا کن:

```powershell
cd C:\projects\yakja
```

---

## مرحله ۱ — ارسال پروژه به گیت‌هاب

### ۱.۱ بررسی وضعیت گیت
اول ببین گیت روی این پوشه از قبل فعال هست یا نه:

```powershell
git status
```

اگر پیام `not a git repository` گرفتی، یعنی باید گیت را راه‌اندازی کنی:

```powershell
git init
```

### ۱.۲ اطمینان از اینکه `.env.local` کامیت نمی‌شود
فایل `.gitignore` پروژه‌ات از قبل خط `.env*` را دارد، یعنی `.env.local` خودکار نادیده گرفته می‌شود. برای اطمینان:

```powershell
git check-ignore -v .env.local
```

اگر خروجی نشان داد که `.gitignore` این فایل را پوشش می‌دهد، مشکلی نیست. **اگر هیچ خروجی‌ای نگرفتی، متوقف شو** و قبل از ادامه به من بگو، چون یعنی `.env.local` ممکن است کامیت شود.

### ۱.۳ تنظیم هویت گیت (فقط بار اول)

```powershell
git config --global user.name "نام تو"
git config --global user.email "ایمیل تو"
```

### ۱.۴ اضافه‌کردن فایل‌ها و کامیت اول

```powershell
git add .
git commit -m "Initial commit - YAKJA project"
```

### ۱.۵ تنظیم شاخه‌ی اصلی و اتصال به ریپازیتوری گیت‌هاب

```powershell
git branch -M main
git remote add origin https://github.com/bkioto93-create/yakja-production.git
```

### ۱.۶ ارسال (Push) به گیت‌هاب

```powershell
git push -u origin main
```

اینجا گیت هویت می‌خواهد. گیت‌هاب دیگر رمز عبور معمولی قبول نمی‌کند؛ باید **Personal Access Token (PAT)** را به‌جای رمز عبور وارد کنی:

- **Username:** یوزرنیم گیت‌هابت (نه ایمیل)
- **Password:** همان توکنی که ساختی (طبق نکته‌ی امنیتی بالا، توکن **جدید**، نه توکن قبلی که در این چت فرستادی)

اگر پنجره‌ی گرافیکی ورود باز نشد و خطای احراز هویت گرفتی، این روش جایگزین را استفاده کن (فقط برای همین یک‌بار، توکن را مستقیم در آدرس ریموت بگذار):

```powershell
git remote set-url origin https://<TOKEN>@github.com/bkioto93-create/yakja-production.git
git push -u origin main
```

بعد از پوش موفق، پیشنهاد می‌کنم آدرس ریموت را دوباره تمیز کنی تا توکن روی دیسک شما ذخیره نماند:

```powershell
git remote set-url origin https://github.com/bkioto93-create/yakja-production.git
```

✅ الان کد روی گیت‌هاب است: `https://github.com/bkioto93-create/yakja-production`

---

## مرحله ۲ — ساخت پروژه در Vercel و دیپلوی

راحت‌ترین و رایج‌ترین روش، اتصال مستقیم گیت‌هاب به Vercel از طریق داشبورد است (نه CLI)، چون بعد از این هر `git push` به `main` خودکار یک نسخه‌ی جدید Deploy می‌شود.

### ۲.۱ ساخت حساب و Import پروژه
1. برو به [vercel.com](https://vercel.com) و با همان حساب گیت‌هاب وارد شو (Sign up / Log in with GitHub).
2. در داشبورد Vercel روی **Add New → Project** بزن.
3. ریپازیتوری `yakja-production` را از لیست پیدا کن و **Import** بزن.
4. Vercel خودش تشخیص می‌دهد این یک پروژه‌ی Next.js است — تنظیمات پیش‌فرض Build/Output را دست نزن.

### ۲.۲ تنظیم متغیرهای محیطی (Environment Variables)
**قبل از زدن دکمه‌ی Deploy**، در همان صفحه بخش **Environment Variables** را باز کن و این مقادیر را (با کلیدهای **جدید و بازتولیدشده**، طبق نکته‌ی امنیتی بالا) یکی‌یکی اضافه کن:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ergzfdprvseokjscgrin.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مقدار Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | مقدار Service Role Key (ترجیحاً بازتولیدشده) |
| `SUPABASE_PUBLISHABLE_KEY` | مقدار Publishable Key |
| `SUPABASE_SECRET_KEY` | مقدار Secret Key (ترجیحاً بازتولیدشده) |
| `SESSION_SECRET` | مقدار Session Secret |

نکته‌ها:
- محیط (Environment) را روی **Production, Preview, Development** هر سه تیک بزن، مگر بخواهی برای هرکدام مقدار جدا داشته باشی.
- **توکن گیت‌هاب را اینجا اضافه نکن** — پروژه‌ات به آن نیازی در Production ندارد؛ آن توکن فقط برای Push از کامپیوتر خودت به گیت‌هاب استفاده می‌شود.

### ۲.۳ زدن دکمه‌ی Deploy
روی **Deploy** بزن و صبر کن. چند دقیقه طول می‌کشد. در پایان یک آدرس موقت شبیه این می‌گیری:
`https://yakja-production.vercel.app`

اگر بعداً خواستی متغیری اضافه/ویرایش کنی: Project → Settings → Environment Variables، و بعد از هر تغییر یک **Redeploy** لازم است (از تب Deployments، سه‌نقطه کنار آخرین دیپلوی → Redeploy).

### ۲.۴ ⚠️ نکته‌ی مهم درباره‌ی Cron Job پروژه‌ات
فایل `vercel.json` پروژه یک Cron با زمان‌بندی `*/5 * * * *` دارد (هر ۵ دقیقه):

```json
{
  "crons": [
    { "path": "/api/cron/deactivate-stale-drivers", "schedule": "*/5 * * * *" }
  ]
}
```

روی پلن رایگان (**Hobby**) ورسل، Cron Job فقط اجازه دارد **حداکثر یک‌بار در روز** اجرا شود؛ هر زمان‌بندی مکرر‌تر از این باعث **شکست کامل Deploy** می‌شود (نه فقط نادیده‌گرفته‌شدن Cron). سه راه داری:

1. **ساده‌ترین راه:** اگر پلن رایگان کافی است، زمان‌بندی را به یک‌بار در روز تغییر بده، مثلاً:
   ```json
   "schedule": "0 3 * * *"
   ```
   (هر روز ساعت ۳ بامداد UTC)
2. آپگرید حساب Vercel به پلن **Pro** (۲۰ دلار/ماه) که زمان‌بندی هر چند دقیقه را پشتیبانی می‌کند.
3. حذف بخش `crons` از `vercel.json` و صدا زدن همان مسیر (`/api/cron/deactivate-stale-drivers`) هر ۵ دقیقه از یک سرویس بیرونی رایگان مثل cron-job.org یا EasyCron.

اگر همین الان تصمیم نگیری، Deploy با خطا متوقف می‌شود — پس این مورد را قبل از Deploy یا بلافاصله بعد از اولین شکست، حل کن.

---

## مرحله ۳ — اتصال دامنه‌ی رسمی `yakja.top`

### ۳.۱ اضافه‌کردن دامنه در Vercel
1. داخل پروژه در Vercel برو به **Settings → Domains**.
2. در کادر متن، `yakja.top` را بنویس و **Add** بزن.
3. Vercel یک یا چند رکورد DNS به تو نشان می‌دهد (معمولاً یکی از این دو حالت):
   - یک رکورد **A** با مقدار IP ثابت (مثلاً `76.76.21.21`)
   - یا یک رکورد **CNAME** با مقدار `cname.vercel-dns.com`

   عدد/مقدار دقیق را از همان صفحه‌ی Vercel کپی کن، چون ممکن است برای حساب تو کمی فرق کند.
4. اگر `www.yakja.top` را هم می‌خواهی، همان‌جا اضافه کن و Vercel پیشنهاد Redirect خودکار از `www` به ریشه (یا برعکس) را می‌دهد.

### ۳.۲ ثبت رکوردها در پنل دامنه
برو به همان جایی که `yakja.top` را خریدی (ثبت‌کننده‌ی دامنه) → بخش DNS Management / DNS Records، و رکوردهایی که Vercel نشان داد را دقیقاً همان‌طور اضافه کن:

| نوع | Host/Name | Value |
|---|---|---|
| A | `@` | (IP که Vercel داد) |
| CNAME | `www` | `cname.vercel-dns.com` |

### ۳.۳ صبر برای انتشار DNS
معمولاً بین چند دقیقه تا چند ساعت طول می‌کشد (گاهی تا ۲۴-۴۸ ساعت). وضعیت را از همان صفحه‌ی Domains در Vercel می‌بینی — وقتی کنار دامنه علامت ✅ سبز ظاهر شد یعنی وصل شده و گواهی SSL هم خودکار صادر شده.

می‌توانی از خط فرمان هم بررسی کنی:

```powershell
nslookup yakja.top
```

### ۳.۴ تست نهایی
مرورگر را باز کن و برو به:
```
https://yakja.top
```
باید همان سایتی که روی `yakja-production.vercel.app` می‌دیدی، این‌بار روی دامنه‌ی خودت بالا بیاید.

---

## چک‌لیست خلاصه

- [ ] توکن گیت‌هاب قدیمی Revoke و توکن تازه ساخته شد
- [ ] کلیدهای سوپابیس (Service Role / Secret) در صورت امکان بازتولید شدند
- [ ] `git init` / `git add` / `git commit` انجام شد
- [ ] `git push` به `github.com/bkioto93-create/yakja-production` موفق بود
- [ ] پروژه در Vercel از روی گیت‌هاب Import شد
- [ ] همه‌ی Environment Variableها (به‌جز توکن گیت‌هاب) در Vercel ثبت شدند
- [ ] زمان‌بندی Cron در `vercel.json` با پلن Vercel هم‌خوان شد
- [ ] Deploy اول موفق بود و آدرس `.vercel.app` کار می‌کرد
- [ ] `yakja.top` در Settings → Domains اضافه شد
- [ ] رکوردهای A/CNAME در پنل دامنه ثبت شدند
- [ ] `https://yakja.top` باز می‌شود و SSL سبز است

هر جای این مسیر گیر کردی یا پیام خطای خاصی گرفتی، متن دقیق خطا را برایم بفرست تا دقیقاً همان‌جا را حل کنیم.