Add-Type -AssemblyName System.IO.Compression.FileSystem
$file = Get-ChildItem 'd:\GameNoob\GameShop\' -Filter '*.docx' | Select-Object -First 1
$docx = $file.FullName
Write-Host "File: $docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($docx)
$entry = $zip.GetEntry('word/document.xml')
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = $xml -replace '<[^>]+>', ' '
$text = $text -replace '\s+', ' '
$text.Trim() | Out-File -FilePath 'd:\GameNoob\GameShop\docx_text.txt' -Encoding UTF8
Write-Host "Done - saved to docx_text.txt"
