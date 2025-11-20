Get-ChildItem -Path "." -Recurse -File |
    ForEach-Object {
        (Get-Content $_.FullName) -replace '', '' |
            Set-Content $_.FullName
    }
