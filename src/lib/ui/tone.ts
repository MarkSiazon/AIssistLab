export type UiTone = "ok" | "warn" | "error" | "neutral";
export type UiAlertTone = Exclude<UiTone, "neutral">;
export type UiIssueTone = Extract<UiTone, "warn" | "error">;
