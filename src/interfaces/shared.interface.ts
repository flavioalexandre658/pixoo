export type SupportedLocale = "pt" | "en" | "es";

export interface LocalizedContent {
  code: string;
  translations: Record<SupportedLocale, string>;
}
