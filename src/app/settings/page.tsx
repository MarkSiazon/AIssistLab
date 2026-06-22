"use client";

import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsMainPane } from "@/components/settings/SettingsMainPane";
import { SettingsRuntimeNote } from "@/components/settings/SettingsRuntimeNote";
import { SettingsSidePane } from "@/components/settings/SettingsSidePane";
import { SettingsStatusBanner } from "@/components/settings/SettingsStatusBanner";
import { useSettingsPageController } from "@/hooks/useSettingsPageController";

export default function SettingsPage() {
  const controller = useSettingsPageController();

  return (
    <div className="flex flex-col h-full">
      <SettingsHeader {...controller.headerProps} />

      <SettingsRuntimeNote {...controller.runtimeNoteProps} />

      <SettingsStatusBanner {...controller.statusBannerProps} />

      <div className="settings-workspace">
        <SettingsMainPane {...controller.mainPaneProps} />

        <SettingsSidePane {...controller.sidePaneProps} />
      </div>
    </div>
  );
}
