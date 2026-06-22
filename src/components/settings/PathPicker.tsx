"use client";

import { PathPickerControl } from "@/components/settings/PathPickerControl";
import { PathPickerDialog } from "@/components/settings/PathPickerDialog";
import { usePathPickerController } from "@/hooks/usePathPickerController";

interface Props {
  value: string;
  onChange: (path: string) => void;
  label: string;
  browseFrom?: string;
  inputId?: string;
  describedBy?: string;
}

export function PathPicker({
  value,
  onChange,
  label,
  browseFrom,
  inputId,
  describedBy,
}: Props) {
  const controller = usePathPickerController({
    value,
    onChange,
    label,
    browseFrom,
    inputId,
    describedBy,
  });

  return (
    <>
      <PathPickerControl {...controller.controlProps} />

      {controller.open && <PathPickerDialog {...controller.dialogProps} />}
    </>
  );
}
