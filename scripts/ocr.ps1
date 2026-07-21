# Windows OCR via Windows.Media.Ocr (built-in, no install required, Windows 10+)
# Usage: powershell -ExecutionPolicy Bypass -File ocr.ps1 <image-path>
param([string]$ImagePath)

Add-Type -AssemblyName System.Runtime.WindowsRuntime

$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType=WindowsRuntime]

function Await($WinRtTask, $ResultType) {
    $asTask = [System.WindowsRuntimeSystemExtensions]::AsTask($WinRtTask)
    $asTask.Wait() | Out-Null
    $asTask.Result
}

$file = Await([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path $ImagePath).Path)) [Windows.Storage.StorageFile]
$stream = Await($file.OpenReadAsync()) [Windows.Storage.Streams.IRandomAccessStream]
$decoder = Await([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) [Windows.Graphics.Imaging.BitmapDecoder]
$bitmap = Await($decoder.GetSoftwareBitmapAsync()) [Windows.Graphics.Imaging.SoftwareBitmap]

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$result = Await($engine.RecognizeAsync($bitmap)) [Windows.Media.Ocr.OcrResult]

$result.Lines | ForEach-Object { $_.Text }
