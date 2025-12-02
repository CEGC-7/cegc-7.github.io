$inputFile  = "index.html"
$outputFile = "sidebar.html"
$html = Get-Content $inputFile -Raw
$matches = [regex]::Matches($html, '<h([1-3])[^>]*id="([^"]+)"[^>]*>(.*?)</h\1>', 
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$sidebar = @()
$sidebar += "<nav id='sidebar'>"
$sidebar += "  <h2>Contents</h2>"
$levelStack = @()
$prevLevel = 0
foreach ($m in $matches) {
    $level = [int]$m.Groups[1].Value
    $id    = $m.Groups[2].Value
    $text  = ($m.Groups[3].Value -replace '<.*?>','').Trim()
    while ($level -gt $prevLevel) {
        $sidebar += "  <ul>"
        $levelStack += $level
        $prevLevel++
    }
    while ($level -lt $prevLevel) {
        $sidebar += "  </ul>"
        $levelStack = $levelStack[0..($levelStack.Count - 2)]
        $prevLevel--
    }
    $sidebar += "    <li><a href='#$id'>$text</a></li>"
}
while ($prevLevel -gt 0) {
    $sidebar += "  </ul>"
    $prevLevel--
}
$sidebar += "</nav>"
$sidebar | Out-File $outputFile -Encoding UTF8