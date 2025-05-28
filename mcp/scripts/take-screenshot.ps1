param(
    [string]$filename = "my-crypto-screenshot"
)

Add-Type -AssemblyName System.Windows.Forms,System.Drawing

# Ensure output directory exists
$outputDir = "d:\Github\crypto-tracker\static\data\screenshots"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

$screens = [Windows.Forms.Screen]::AllScreens
$top = $left = [System.Int32]::MaxValue
$width = $height = 0

$screens | ForEach-Object {
    $bounds = $_.Bounds
    if ($bounds.X -lt $left) { $left = $bounds.X }
    if ($bounds.Y -lt $top) { $top = $bounds.Y }
    if ($bounds.Right -gt $width) { $width = $bounds.Right }
    if ($bounds.Bottom -gt $height) { $height = $bounds.Bottom }
}

$bitmap = New-Object System.Drawing.Bitmap ($width - $left), ($height - $top)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

$screens | ForEach-Object {
    $bounds = $_.Bounds
    $graphics.CopyFromScreen($bounds.X, $bounds.Y, $bounds.X - $left, $bounds.Y - $top, $bounds.Size)
}

$outputPath = "$outputDir\$filename.png"
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Screenshot saved to $outputPath"

$bitmap.Dispose()
$graphics.Dispose()
