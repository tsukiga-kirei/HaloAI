"use client";

import { systemAdminDictionaries } from "@/lib/system-admin-i18n";
import { useShellPreferences } from "@/lib/shell-preferences";

export function useSystemAdminDictionary() {
  const { locale } = useShellPreferences();
  return { locale, dictionary: systemAdminDictionaries[locale] };
}
