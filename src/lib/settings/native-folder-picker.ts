export interface NativeFolderPickerResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  error?: string;
}

export type NativeFolderPickerResponse =
  | { status: 200; body: { path: string } }
  | { status: 200; body: { cancelled: true } }
  | { status: 408; body: { error: string } }
  | { status: 500; body: { error: string } };

export const WINDOWS_FOLDER_PICKER_SCRIPT = `
& {
  param([string]$InitialPath, [string]$Title)
  Add-Type -AssemblyName System.Windows.Forms
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

  $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
  $dialog.Description = $Title
  $dialog.ShowNewFolderButton = $true

  if ($InitialPath -and (Test-Path -LiteralPath $InitialPath)) {
    $dialog.SelectedPath = $InitialPath
  }

  $result = $dialog.ShowDialog()
  if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.SelectedPath
    exit 0
  }

  exit 2
}
`;

export function buildWindowsFolderPickerArgs(
  initialPath: string,
  title: string,
): string[] {
  return [
    "-NoProfile",
    "-STA",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    WINDOWS_FOLDER_PICKER_SCRIPT,
    initialPath,
    title,
  ];
}

export function nativeFolderPickerResultToResponse(
  result: NativeFolderPickerResult,
): NativeFolderPickerResponse {
  if (result.timedOut) {
    return {
      status: 408,
      body: { error: "Native folder picker timed out." },
    };
  }

  if (result.code === 2) {
    return { status: 200, body: { cancelled: true } };
  }

  if (result.code !== 0) {
    return {
      status: 500,
      body: {
        error: result.error
          ? "Native folder picker could not start."
          : "Native folder picker could not open.",
      },
    };
  }

  const selectedPath = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  if (!selectedPath) {
    return {
      status: 500,
      body: { error: "Native folder picker returned an empty path." },
    };
  }

  return { status: 200, body: { path: selectedPath } };
}
