# ===== COMMITS PERDIDOS =====
$commits = @(
  "1418ec9217266f640dd66ce31341032a95c33e80",
  "6ae03c27a281c2d6663233f4fb8e93c6139cde38"
)

# ===== BLOBS PERDIDOS =====
$blobs = @(
  "8951832a51a71d9eb98d06e922733bafcb875263",
  "1aba081d4084668583c738481a35da77f2b128fc",
  "5db7c4806c7370da3f4bccc0748fb3c5f42c41c2"
)

Write-Host "=== RECUPERANDO COMMITS ===" -ForegroundColor Cyan

foreach ($commit in $commits) {
  Write-Host "`n--- COMMIT $commit ---" -ForegroundColor Yellow
  git --no-pager show --stat $commit

  $branch = "recovery-$commit"
  git branch $branch $commit 2>$null

  if ($LASTEXITCODE -eq 0) {
    Write-Host "✔ Branch criada: $branch" -ForegroundColor Green
  } else {
    Write-Host "⚠ Branch já existe: $branch" -ForegroundColor DarkYellow
  }
}

Write-Host "`n=== RECUPERANDO BLOBS ===" -ForegroundColor Cyan

$dir = "recovered_blobs"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

foreach ($blob in $blobs) {
  $file = "$dir/blob_$blob.txt"
  git --no-pager show $blob > $file

  if ($LASTEXITCODE -eq 0) {
    Write-Host "✔ Blob salvo: $file" -ForegroundColor Green
  } else {
    Write-Host "✘ Erro ao salvar blob: $blob" -ForegroundColor Red
  }
}

Write-Host "`n🔥 Finalizado. Confere as branches recovery-* e a pasta recovered_blobs" -ForegroundColor Cyan
