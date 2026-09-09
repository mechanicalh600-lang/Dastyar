// Historical note:
// Earlier Dastyar builds exposed a development-era bootstrap script from the
// connection-error dialog. That script created plaintext password columns and
// permissive allow-all RLS policies. Keeping it executable would preserve a
// technical defect rather than the historical product experience.
//
// The original script remains available in Git history for provenance. The
// operational legacy application is now maintained only through the versioned
// migrations under supabase/migrations/.

export const DB_SETUP_SQL = `-- Dastyar / NewRay Legacy
--
-- پایگاه داده این نسخه از طریق Migrationهای نسخه‌بندی‌شده نگهداری می‌شود.
-- برای جلوگیری از بازگرداندن تنظیمات ناامن نسخه‌های توسعه، SQL قدیمی راه‌اندازی
-- مستقیم دیگر نباید روی پایگاه داده عملیاتی اجرا شود.
--
-- مسیر مرجع:
-- supabase/migrations/
--
-- این متن عمداً هیچ دستور تغییردهنده‌ای اجرا نمی‌کند.
`;
