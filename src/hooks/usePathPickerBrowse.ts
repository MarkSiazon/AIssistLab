"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { readResponseJson } from "@/lib/api/client";
import {
  apiSettingsBrowseRoute,
  apiSettingsNativeFolderRoute,
} from "@/lib/routes/api-routes";
import {
  normalizeInputPath,
  splitBreadcrumbs,
  type BrowseResult,
  type PathPickerNotice,
} from "@/lib/ui/path-picker-model";

interface UsePathPickerBrowseInput {
  value: string;
  onChange: (path: string) => void;
  label: string;
  browseFrom?: string;
  listRef: RefObject<HTMLDivElement | null>;
  onSelectedPath: () => void;
}

interface NativeFolderResponse {
  path?: string;
  cancelled?: boolean;
  error?: string;
}

export function usePathPickerBrowse({
  value,
  onChange,
  label,
  browseFrom,
  listRef,
  onSelectedPath,
}: UsePathPickerBrowseInput) {
  const browseRequestId = useRef(0);
  const [current, setCurrent] = useState<BrowseResult | null>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [nativePicking, setNativePicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controlNotice, setControlNotice] =
    useState<PathPickerNotice | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  const selectedPath = current && !current.isRoot && !current.error ? current.path : "";
  const crumbs = useMemo(
    () => (selectedPath ? splitBreadcrumbs(selectedPath) : []),
    [selectedPath],
  );

  const browse = useCallback(
    async (rawPath: string) => {
      const requestId = browseRequestId.current + 1;
      browseRequestId.current = requestId;
      const isCurrentRequest = () => browseRequestId.current === requestId;
      const path = normalizeInputPath(rawPath);
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(apiSettingsBrowseRoute(path));
        const data = (await readResponseJson(res)) as BrowseResult;

        if (!isCurrentRequest()) return;

        if (!res.ok || data.error) {
          setError(data.error ?? "Path not found");
          if (data.error) {
            setCurrent(data);
            setAddress(data.path);
          }
          return;
        }

        setCurrent(data);
        setAddress(data.path);
        listRef.current?.scrollTo(0, 0);
      } catch {
        if (!isCurrentRequest()) return;
        setError("Failed to browse path");
      } finally {
        if (isCurrentRequest()) {
          setLoading(false);
        }
      }
    },
    [listRef],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cancelBrowse = useCallback(() => {
    browseRequestId.current += 1;
    setLoading(false);
  }, []);

  const choosePath = useCallback(
    (path: string) => {
      const cleanPath = normalizeInputPath(path);
      if (!cleanPath) return;

      onChange(cleanPath);
      setError(null);
      setControlNotice({
        tone: "info",
        message: "Path selected. Save Settings to persist this value.",
      });
      setRecent((prev) =>
        [
          cleanPath,
          ...prev.filter(
            (item) => item.toLowerCase() !== cleanPath.toLowerCase(),
          ),
        ].slice(0, 5),
      );
      onSelectedPath();
    },
    [onChange, onSelectedPath],
  );

  const openNativePicker = useCallback(async () => {
    if (nativePicking) return;

    setNativePicking(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        path: normalizeInputPath(value || browseFrom || ""),
        title: label,
      });
      const res = await fetch(apiSettingsNativeFolderRoute(params));
      const data = (await readResponseJson(res)) as NativeFolderResponse;

      if (data.path) {
        choosePath(data.path);
        return;
      }

      if (!data.cancelled) {
        const message =
          data.error ??
          "Native folder picker is unavailable. Use Browse app instead.";
        setError(message);
        setControlNotice({ tone: "error", message });
      }
    } catch {
      const message =
        "Failed to open native folder picker. Use Browse app instead.";
      setError(message);
      setControlNotice({ tone: "error", message });
    } finally {
      setNativePicking(false);
    }
  }, [browseFrom, choosePath, label, nativePicking, value]);

  const goParent = useCallback(() => {
    if (loading) return;
    if (current?.parent !== undefined && current?.parent !== null) {
      browse(current.parent);
      return;
    }
    browse("");
  }, [browse, current?.parent, loading]);

  const handleAddressSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (loading) return;
      browse(address);
    },
    [address, browse, loading],
  );

  const useTypedPath = useCallback(() => {
    if (nativePicking) return;
    choosePath(value);
  }, [choosePath, nativePicking, value]);

  return {
    address,
    controlNotice,
    crumbs,
    currentEntries: current?.entries ?? null,
    currentIsRoot: current?.isRoot ?? true,
    error,
    loading,
    nativePicking,
    recent,
    selectedPath,
    browse,
    choosePath,
    clearError,
    cancelBrowse,
    goParent,
    handleAddressSubmit,
    openNativePicker,
    setAddress,
    setControlNotice,
    useTypedPath,
  };
}
