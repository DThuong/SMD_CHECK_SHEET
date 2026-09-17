<#
    check-api-blocking.ps1
    ----------------------------------------------------------------------
    Kiểm tra xem một máy Windows có phần mềm nào đang chặn / soi / làm chậm
    request HTTP tới API của hệ thống SMD Check Sheet hay không.

    CÁCH DÙNG
        1. Copy file này sang máy cần kiểm tra (USB hoặc share).
        2. Mở PowerShell BẰNG QUYỀN ADMIN (chuột phải > Run as administrator).
        3. Chạy:
               Set-ExecutionPolicy -Scope Process Bypass -Force
               .\check-api-blocking.ps1 -Token "<dán token ở đây>"

           Lấy token: mở hệ thống trên Chrome > F12 > Application >
           Local Storage > khoá "token" > copy giá trị.

        4. Chạy Y HỆT trên một máy CHẠY BÌNH THƯỜNG để có mốc so sánh.
           Không có mốc so sánh thì các con số không nói lên điều gì.

    Script CHỈ ĐỌC thông tin, không thay đổi gì trên máy.
#>

[CmdletBinding()]
param(
    [string] $ApiHost = '172.16.162.123',
    [int]    $ApiPort = 5000,
    [string] $Token   = '',
    [int]    $Repeat  = 5
)

$ErrorActionPreference = 'Continue'

function Write-Head([string] $text) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor DarkCyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host ('=' * 70) -ForegroundColor DarkCyan
}
function Write-Note([string] $text) { Write-Host "    $text" -ForegroundColor DarkGray }
function Write-Hit ([string] $text) { Write-Host "  [!] $text" -ForegroundColor Yellow }
function Write-Ok  ([string] $text) { Write-Host "  [ok] $text" -ForegroundColor Green }

Write-Host ''
Write-Host "  BÁO CÁO CHẨN ĐOÁN MẠNG — $env:COMPUTERNAME — $(Get-Date -Format 'dd/MM/yyyy HH:mm')" -ForegroundColor White
Write-Host "  Đích: http://${ApiHost}:${ApiPort}" -ForegroundColor White

# ======================================================================
# PHẦN 1 — KIỂM KÊ PHẦN MỀM
#
# Lưu ý: máy nào trong nhà máy cũng có antivirus. Danh sách này TỰ NÓ
# không kết luận được gì — giá trị của nó là để SO SÁNH với máy chạy tốt,
# tìm ra thứ chỉ máy này có.
# ======================================================================

Write-Head '1. Antivirus / firewall mà Windows đang ghi nhận'
try {
    $av = Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction Stop
    if ($av) {
        foreach ($a in $av) {
            # productState là bitmask; byte giữa khác 00 nghĩa là real-time đang BẬT
            $state = '{0:X6}' -f $a.productState
            $realtime = if ($state.Substring(2, 2) -eq '00') { 'TẮT' } else { 'BẬT' }
            Write-Hit "$($a.displayName)  —  bảo vệ thời gian thực: $realtime"
            Write-Note $a.pathToSignedProductExe
        }
    } else { Write-Ok 'Không thấy antivirus nào đăng ký.' }
} catch { Write-Note 'Không đọc được SecurityCenter2 (bình thường trên Windows Server).' }

try {
    Get-CimInstance -Namespace root/SecurityCenter2 -ClassName FirewallProduct -ErrorAction Stop |
        ForEach-Object { Write-Hit "Firewall bên thứ ba: $($_.displayName)" }
} catch { }

Write-Head '2. Phần mềm bảo mật / proxy đã cài'
# Gồm cả các hãng Hàn Quốc hay gặp trong nhà máy Hàn: AhnLab V3, Hauri ViRobot.
$vendors = 'Kaspersky|Trend Micro|Symantec|McAfee|ESET|Bitdefender|Sophos|Avast|AVG|Norton|' +
           'F-Secure|Panda|Comodo|Webroot|Cylance|CrowdStrike|SentinelOne|Carbon Black|' +
           'Forcepoint|Zscaler|Netskope|Fortinet|FortiClient|Check Point|GlobalProtect|' +
           'AnyConnect|Umbrella|Quick Heal|K7|AhnLab|V3 Lite|V3 Endpoint|Hauri|ViRobot|' +
           'Bkav|CMC|Proxy|Fiddler|Charles|Burp|Wireshark|Netlimiter|Glasswire|SoftEther'

$uninstallPaths = @(
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
$found = Get-ItemProperty $uninstallPaths -ErrorAction SilentlyContinue |
         Where-Object { $_.DisplayName -match $vendors } |
         Select-Object DisplayName, Publisher -Unique

if ($found) { $found | ForEach-Object { Write-Hit "$($_.DisplayName)   [$($_.Publisher)]" } }
else        { Write-Ok 'Không thấy phần mềm bảo mật/proxy nào trong danh sách đã biết.' }

Write-Head '3. Service của phần mềm bảo mật đang CHẠY'
$svc = Get-Service -ErrorAction SilentlyContinue |
       Where-Object { $_.Status -eq 'Running' -and ($_.DisplayName -match $vendors -or $_.Name -match $vendors) }
if ($svc) { $svc | ForEach-Object { Write-Hit "$($_.Name)  —  $($_.DisplayName)" } }
else      { Write-Ok 'Không có service bảo mật bên thứ ba nào đang chạy.' }

Write-Head '4. LSP — phần mềm chen vào tầng socket của Windows'
Write-Note 'LSP lạ là cách kinh điển để soi mọi traffic HTTP mà trình duyệt không hay biết.'
$lsp = (netsh winsock show catalog 2>$null | Select-String -Pattern 'Description|Mô tả') -replace '.*:\s*', ''
$lspOther = $lsp | Where-Object { $_ -notmatch 'MSAFD|RSVP|Microsoft|Hyper-V' } | Select-Object -Unique
if ($lspOther) { $lspOther | ForEach-Object { Write-Hit "LSP bên thứ ba: $_" } }
else           { Write-Ok 'Chỉ có LSP mặc định của Microsoft.' }

Write-Head '5. Cấu hình proxy'
Write-Note '--- WinHTTP (dùng bởi service và nhiều app nền) ---'
netsh winhttp show proxy 2>$null | ForEach-Object { Write-Note $_ }

Write-Note '--- Internet Settings của người dùng (Chrome/Edge dùng cái này) ---'
$ie = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -ErrorAction SilentlyContinue
if ($ie.ProxyEnable -eq 1) { Write-Hit "Proxy ĐANG BẬT: $($ie.ProxyServer)" } else { Write-Ok 'Proxy tắt.' }
if ($ie.AutoConfigURL)     { Write-Hit "PAC script: $($ie.AutoConfigURL)" }

foreach ($b in @('Microsoft\Edge', 'Google\Chrome')) {
    $p = Get-ItemProperty "HKLM:\SOFTWARE\Policies\$b" -ErrorAction SilentlyContinue
    if ($p.ProxyMode -or $p.ProxyServer -or $p.ProxyPacUrl) {
        Write-Hit "Policy proxy cho ${b}: mode=$($p.ProxyMode) server=$($p.ProxyServer) pac=$($p.ProxyPacUrl)"
    }
}

# ======================================================================
# PHẦN 2 — ĐO THẬT
#
# Đây mới là phần quyết định. Kiểm kê chỉ cho biết có cái gì trên máy;
# đo mới cho biết cái gì đang LÀM CHẬM.
# ======================================================================

Write-Head '6. TCP thuần — bắt tay kết nối có nhanh không'
Write-Note 'Chỉ mở kết nối, chưa gửi HTTP. Chậm ở đây = lỗi đường mạng/firewall.'
foreach ($port in @($ApiPort, 80)) {
    $ms = (Measure-Command {
        Test-NetConnection -ComputerName $ApiHost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue | Out-Null
    }).TotalMilliseconds
    $tag = if ($ms -gt 500) { 'CHẬM' } else { 'ok' }
    Write-Host ("    cổng {0,-5} : {1,7:N0} ms   [{2}]" -f $port, $ms, $tag)
}

Write-Head '7. Ping gói lớn — kiểm tra mất gói / sai MTU'
Write-Note 'Gói 1400 byte, cấm phân mảnh. Response lớn treo trong khi login chạy được là dấu hiệu MTU.'
$ping = ping -n 20 -l 1400 -f $ApiHost 2>$null
$ping | Select-String -Pattern 'Lost|Mất|Minimum|Trung bình|Average' | ForEach-Object { Write-Note $_.ToString().Trim() }

Write-Head '8. Bấm giờ HTTP thật — phần quan trọng nhất'
if (-not $Token) {
    Write-Hit 'Chưa truyền -Token nên bỏ qua. Chạy lại kèm token để có số liệu này.'
} else {
    $fmt = 'dns=%{time_namelookup}  connect=%{time_connect}  ttfb=%{time_starttransfer}  total=%{time_total}  bytes=%{size_download}  http=%{http_code}'
    $targets = [ordered]@{
        'API danh sách (nghi ngờ)' = "http://${ApiHost}:${ApiPort}/api/ChangeModel/filterAll?status=PQCDone&pageNumber=1&pageSize=20"
        'API Patrol cùng server'   = "http://${ApiHost}:5003/api/Category"
        'Frontend tĩnh cổng 80'    = "http://172.16.162.124/index.html"
    }

    foreach ($name in $targets.Keys) {
        Write-Host ''
        Write-Host "    >> $name" -ForegroundColor White
        Write-Note $targets[$name]
        for ($i = 1; $i -le $Repeat; $i++) {
            $out = curl.exe -s -o NUL --max-time 60 -H "Authorization: Bearer $Token" -w $fmt $targets[$name] 2>&1
            Write-Host ("       lần {0}: {1}" -f $i, $out)
        }
    }

    Write-Host ''
    Write-Note 'ĐỌC KẾT QUẢ:'
    Write-Note '  connect chậm            -> đường mạng / firewall chặn cổng.'
    Write-Note '  connect nhanh, ttfb chậm-> server nghĩ lâu, HOẶC có proxy/antivirus giữ'
    Write-Note '                             trọn response để quét rồi mới thả byte đầu tiên.'
    Write-Note '  ttfb nhanh, total chậm  -> thân response bị bóp: mất gói, sai MTU, hoặc bị quét.'
    Write-Note '  chỉ cổng 5000 chậm      -> lỗi ở service API đó, không phải máy này.'
    Write-Note '  mọi cổng đều chậm       -> lỗi ở máy này / đường mạng của nó.'
}

Write-Head 'XONG'
Write-Note 'Chụp lại toàn bộ cửa sổ này, rồi chạy y hệt trên một máy chạy tốt để so sánh.'
Write-Host ''
