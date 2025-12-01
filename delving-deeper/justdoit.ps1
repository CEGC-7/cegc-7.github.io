Get-ChildItem -Path . -Recurse -File | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw
    $newContent = $content -replace 'ighting-men', 'ighting-men'
    Set-Content -Path $_.FullName -Value $newContent
}

