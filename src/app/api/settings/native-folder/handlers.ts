import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { withLocalDeviceGuard } from "@/lib/local-access";
import {
  buildWindowsFolderPickerArgs,
  nativeFolderPickerResultToResponse,
  type NativeFolderPickerResult,
} from "@/lib/settings/native-folder-picker";

type FolderPickerRunner = (
  initialPath: string,
  title: string,
) => Promise<NativeFolderPickerResult>;

interface NativeFolderRouteDependencies {
  platform?: NodeJS.Platform;
  runWindowsFolderPicker?: FolderPickerRunner;
}

function runWindowsFolderPicker(
  initialPath: string,
  title: string,
): Promise<NativeFolderPickerResult> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const child = spawn(
      "powershell.exe",
      buildWindowsFolderPickerArgs(initialPath, title),
      {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: false,
      },
    );

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 300_000);

    const settle = (result: NativeFolderPickerResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      settle({
        code: null,
        stdout,
        stderr,
        timedOut,
        error: error.message,
      });
    });

    child.on("close", (code) => {
      settle({ code, stdout, stderr, timedOut });
    });
  });
}

export function createNativeFolderRouteHandlers(
  dependencies: NativeFolderRouteDependencies = {},
) {
  const platform = dependencies.platform ?? process.platform;
  const runPicker = dependencies.runWindowsFolderPicker ?? runWindowsFolderPicker;

  return {
    GET: withLocalDeviceGuard(async (request: Request) => {
      if (platform !== "win32") {
        return NextResponse.json(
          {
            error: "Native folder picker is currently available on Windows only.",
          },
          { status: 501 },
        );
      }

      const { searchParams } = new URL(request.url);
      const initialPath = searchParams.get("path")?.trim() ?? "";
      const title = searchParams.get("title")?.trim() || "Select folder";

      const result = await runPicker(initialPath, title);
      const response = nativeFolderPickerResultToResponse(result);
      return NextResponse.json(response.body, { status: response.status });
    }),
  };
}
