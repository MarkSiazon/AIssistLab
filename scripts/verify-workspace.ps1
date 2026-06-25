param(
  [switch] $FullRelease
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$appRoot = Join-Path $repoRoot "rag-interface"
$textFileExtensions = @(".json", ".md", ".ps1", ".sh", ".txt", ".yaml", ".yml")
$extensionlessTextFiles = @(".gitignore")

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Label,
    [Parameter(Mandatory = $true)]
    [scriptblock] $Script
  )

  Write-Output ""
  Write-Output "==> $Label"
  & $Script
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE"
  }
}

Invoke-Step "Parent hook verification" {
  & (Join-Path $repoRoot "scripts/verify-hooks.ps1")
}

Invoke-Step "Parent diff whitespace check" {
  git -C $repoRoot diff --check
}

function Test-ParentTextFile {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  $name = [System.IO.Path]::GetFileName($Path)
  if ($extensionlessTextFiles -contains $name) {
    return $true
  }

  $extension = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  return $textFileExtensions -contains $extension
}

function Test-ParentTextHygiene {
  param(
    [Parameter(Mandatory = $true)]
    [AllowEmptyCollection()]
    [string[]] $Files,
    [Parameter(Mandatory = $true)]
    [string] $Scope,
    [switch] $RequireAscii
  )

  $issues = @()

  foreach ($file in $files) {
    $path = Join-Path $repoRoot $file
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      continue
    }

    $content = Get-Content -Raw -LiteralPath $path
    $lines = $content -split "`r?`n", -1

    for ($i = 0; $i -lt $lines.Count; $i++) {
      if ($lines[$i] -match '[ \t]+$') {
        $issues += "${file}:$($i + 1): trailing whitespace"
      }
      if ($lines[$i] -match '^(<<<<<<<|=======|>>>>>>>)(\s|$)') {
        $issues += "${file}:$($i + 1): conflict marker"
      }
    }

    if ($content.Length -gt 0 -and -not ($content.EndsWith("`n"))) {
      $issues += "${file}: missing final newline"
    }

    for ($i = 0; $i -lt $content.Length; $i++) {
      $code = [int][char]$content[$i]
      if (($code -lt 32) -and ($code -notin 9, 10, 13)) {
        $issues += "${file}: unexpected control char $code"
        break
      }
      if ($RequireAscii -and $code -gt 127) {
        $issues += "${file}: non-ASCII char $code"
        break
      }
    }
  }

  if ($issues.Count -gt 0) {
    $issues | ForEach-Object { Write-Error $_ }
    exit 1
  }

  Write-Output "Checked $($files.Count) $Scope text file(s)."
}

Invoke-Step "Parent untracked text hygiene" {
  $files = @(git -C $repoRoot ls-files --others --exclude-standard |
    Where-Object { Test-ParentTextFile $_ }
  )
  Test-ParentTextHygiene -Files $files -Scope "untracked"
}

Invoke-Step "Parent changed text ASCII hygiene" {
  $tracked = @(git -C $repoRoot diff --name-only --diff-filter=ACMRT)
  $untracked = @(git -C $repoRoot ls-files --others --exclude-standard)
  $files = @($tracked + $untracked |
    Where-Object { Test-ParentTextFile $_ } |
    Sort-Object -Unique
  )
  Test-ParentTextHygiene -Files $files -Scope "changed/untracked" -RequireAscii
}

if (Test-Path (Join-Path $appRoot "package.json")) {
  Invoke-Step "Nested app diff whitespace check" {
    git -C $appRoot diff --check
  }

  if ($FullRelease) {
    Invoke-Step "Nested app full release verification" {
      Push-Location $appRoot
      try {
        npm run verify:release
      } finally {
        Pop-Location
      }
    }
  } else {
    Invoke-Step "Nested app static smoke" {
      Push-Location $appRoot
      try {
        npx --yes tsx scripts/smoke/smoke-local-static.test.mjs
      } finally {
        Pop-Location
      }
    }
  }
} else {
  Write-Output ""
  Write-Output "==> Nested app checks"
  Write-Output "Skipped: rag-interface/package.json was not found."
}

Write-Output ""
Write-Output "Workspace verification passed."
