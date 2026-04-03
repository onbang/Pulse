"use client";

import { Languages } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="glass-strip flex items-center gap-1 px-2 py-2">
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-sky-50 text-sky-600">
        <Languages size={16} />
      </span>
      <div className="flex items-center gap-1 rounded-full bg-white/70 p-1">
        {SUPPORTED_LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code as AppLanguage)}
            aria-label={`${t("header.language")}: ${t(`language.${code}`)}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              language === code
                ? "bg-[linear-gradient(135deg,#0180FF,#7354F2)] text-white shadow-[0_12px_30px_-20px_rgba(1,128,255,0.55)]"
                : "text-slate-500 hover:bg-sky-50 hover:text-slate-900",
            )}
          >
            {t(`language.${code}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
