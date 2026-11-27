<?php
/**
 * BERSIHIN — Resolusi link pendek Google Maps, tanpa database.
 *
 * Tugas endpoint:
 *   1. Memeriksa bahwa input adalah URL Google Maps HTTPS.
 *   2. Mengikuti redirect yang HOST-NYA TETAP Google, maksimal 8 hop.
 *   3. Membaca latitude / longitude dari tautan tujuan.
 *
 * Jalankan melalui PHP (XAMPP / Apache). Tidak berjalan di Live Server.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function isAllowedGoogleMapsURL(string $url): bool
{
    $parts = parse_url($url);
    if ($parts === false || strtolower($parts['scheme'] ?? '') !== 'https') {
        return false;
    }

    // Jangan menjadi open proxy/SSRF ke domain arbitrary.
    // Host tujuan mesti sepenuhnya cocok dengan salah satu host di bawah.
    $allowed = [
        'maps.app.goo.gl',
        'goo.gl',
        'www.google.com',
        'google.com',
        'maps.google.com',
        'www.google.co.id',
        'google.co.id',
        'maps.google.co.id'
    ];
    $host = strtolower($parts['host'] ?? '');
    if (!in_array($host, $allowed, true)) {
        return false;
    }

    if (isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])) {
        return false;
    }

    $path = $parts['path'] ?? '/';
    if ($host === 'goo.gl') {
        return str_starts_with($path, '/maps/');
    }
    if ($host === 'maps.app.goo.gl') {
        return $path !== '/';
    }
    return str_contains($path, '/maps') || $path === '/';
}

/**
 * Google Maps memuat DUA macam koordinat:
 * - !3dLAT!4dLNG (umumnya pin tempat di /maps/place/)
 * - @LAT,LNG (titik TENGAH kamera/peta, bukan selalu pin!)
 *
 * Dahulukan koordinat PIN. Jika URL merupakan /maps/place/ tapi hanya
 * mengandung @, JANGAN menganggap pusat kamera sebagai lokasi tempat.
 */
function coordinatesFromURL(string $url): ?array
{
    $decoded = html_entity_decode(rawurldecode($url), ENT_QUOTES, 'UTF-8');

    // Pin tempat: koordinat !8m2!3d...!4d... lebih spesifik daripada @.
    $pinPatterns = [
        '/!8m2!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/',
        '/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/'
    ];
    foreach ($pinPatterns as $pattern) {
        if (preg_match_all($pattern, $decoded, $matches, PREG_SET_ORDER)) {
            // Pada URL Maps kompleks dapat ada beberapa koordinat.
            // Pin tempat lazimnya berada pada blok data lokasi paling akhir.
            for ($i = count($matches) - 1; $i >= 0; $i--) {
                $point = validCoordinates($matches[$i][1], $matches[$i][2]);
                if ($point !== null) {
                    return $point + ['source' => 'pin'];
                }
            }
        }
    }

    // Koordinat yang secara eksplisit dibagikan lewat query/search.
    $explicitPatterns = [
        '/[?&](?:q|query|ll|destination|daddr)=(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:[&#]|$)/',
        '~/(?:search|place)/(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:[/?]|$)~',
        '/[?&](?:q|query)=loc:(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:[&#]|$)/'
    ];
    foreach ($explicitPatterns as $pattern) {
        if (preg_match($pattern, $decoded, $matches)) {
            $point = validCoordinates($matches[1], $matches[2]);
            if ($point !== null) {
                return $point + ['source' => 'explicit'];
            }
        }
    }

    // Halaman tempat (/maps/place/) bisa berada di posisi kamera yang BERBEDA
    // dengan pin yang dicari. Jangan mengirim posisi kamera sebagai pin.
    if (str_contains($decoded, '/maps/place/')) {
        return null;
    }

    // Tautan peta umum (/maps/@lat,lng) tidak menunjuk tempat tertentu.
    // Titik ini hanya merupakan pusat kamera; beri warning ke frontend.
    if (preg_match('/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/', $decoded, $matches)) {
        $point = validCoordinates($matches[1], $matches[2]);
        if ($point !== null) {
            return $point + [
                'source' => 'camera',
                'warning' => 'Ini pusat tampilan peta, bukan pin tempat. Pastikan titik benar sebelum mengirim laporan.'
            ];
        }
    }

    return null;
}

function validCoordinates($latValue, $lngValue): ?array
{
    $lat = (float) $latValue;
    $lng = (float) $lngValue;
    if (is_finite($lat) && is_finite($lng) && abs($lat) <= 90 && abs($lng) <= 180) {
        return ['lat' => $lat, 'lng' => $lng];
    }
    return null;
}

function absoluteLocation(string $current, string $location): ?string
{
    $location = trim($location);
    if (str_starts_with($location, 'https://')) {
        return $location;
    }
    if (str_starts_with($location, '//')) {
        return 'https:' . $location;
    }

    $base = parse_url($current);
    if (!$base || empty($base['host'])) {
        return null;
    }

    $origin = 'https://' . $base['host'];
    if (str_starts_with($location, '/')) {
        return $origin . $location;
    }

    $folder = preg_replace('~/[^/]*$~', '/', $base['path'] ?? '/');
    return $origin . $folder . $location;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    reply(405, ['ok' => false, 'message' => 'Metode tidak didukung.']);
}

// Tes kesehatan: http://localhost/.../resolve_map.php?check=1
// Buka link ini langsung di browser ketika tombol lokasi menampilkan kesalahan.
if (isset($_GET['check']) && $_GET['check'] === '1') {
    reply(200, [
        'ok' => true,
        'message' => 'PHP BERSIHIN aktif dan file resolve_map.php bisa dijangkau.',
        'curl' => extension_loaded('curl') ? 'aktif' : 'tidak aktif',
        'php_version' => PHP_VERSION
    ]);
}

$url = trim((string) ($_GET['url'] ?? ''));
if (strlen($url) > 2000 || !isAllowedGoogleMapsURL($url)) {
    reply(400, ['ok' => false, 'message' => 'Masukkan link HTTPS Google Maps yang valid.']);
}

$direct = coordinatesFromURL($url);
if ($direct !== null) {
    reply(200, ['ok' => true] + $direct);
}

if (!extension_loaded('curl')) {
    reply(500, [
        'ok' => false,
        'message' => 'Ekstensi cURL PHP belum aktif. Aktifkan extension=curl di php.ini XAMPP.'
    ]);
}

$current = $url;
for ($hop = 0; $hop < 8; $hop++) {
    if (!isAllowedGoogleMapsURL($current)) {
        reply(422, ['ok' => false, 'message' => 'Google mengarahkan tautan ke alamat tidak didukung.']);
    }

    $point = coordinatesFromURL($current);
    if ($point !== null) {
        reply(200, ['ok' => true] + $point);
    }

    $redirect = null;
    $handle = curl_init($current);
    curl_setopt_array($handle, [
        CURLOPT_NOBODY => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 BERSIHIN-Local-Map-Resolver/1.0',
        CURLOPT_HEADERFUNCTION => static function ($curl, string $line) use (&$redirect): int {
            if (stripos($line, 'Location:') === 0) {
                $redirect = trim(substr($line, strlen('Location:')));
            }
            return strlen($line);
        }
    ]);

    curl_exec($handle);
    $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $error = curl_error($handle);
    curl_close($handle);

    if ($error !== '') {
        reply(502, [
            'ok' => false,
            'message' => str_contains(strtolower($error), 'certificate')
                ? 'Sertifikat SSL PHP belum benar. Atur curl.cainfo di php.ini XAMPP menggunakan CA bundle resmi, lalu restart Apache.'
                : 'PHP tidak bisa menghubungi Google Maps. Periksa internet, proxy/firewall, dan pengaturan cURL XAMPP.'
        ]);
    }

    if ($status >= 300 && $status < 400 && $redirect !== null) {
        $next = absoluteLocation($current, $redirect);
        if ($next === null || !isAllowedGoogleMapsURL($next)) {
            reply(422, ['ok' => false, 'message' => 'Tautan dialihkan ke domain di luar Google Maps.']);
        }
        $current = $next;
        continue;
    }

    // Sejumlah server mengembalikan respons berbeda untuk HEAD vs GET.
    // Bila HEAD tidak memberikan Location, coba GET satu kali (tanpa
    // mengikuti redirect otomatis agar domain selalu bisa divalidasi).
    $getRedirect = null;
    $getHandle = curl_init($current);
    curl_setopt_array($getHandle, [
        CURLOPT_HTTPGET => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_RANGE => '0-200000',
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; BERSIHIN-Local-Map-Resolver/1.0)',
        CURLOPT_HEADERFUNCTION => static function ($curl, string $line) use (&$getRedirect): int {
            if (stripos($line, 'Location:') === 0) {
                $getRedirect = trim(substr($line, strlen('Location:')));
            }
            return strlen($line);
        }
    ]);
    $body = curl_exec($getHandle);
    $getStatus = curl_getinfo($getHandle, CURLINFO_RESPONSE_CODE);
    curl_close($getHandle);

    if ($getStatus >= 300 && $getStatus < 400 && $getRedirect !== null) {
        $next = absoluteLocation($current, $getRedirect);
        if ($next === null || !isAllowedGoogleMapsURL($next)) {
            reply(422, ['ok' => false, 'message' => 'Link diarahkan ke alamat di luar Google Maps.']);
        }
        $current = $next;
        continue;
    }

    // Halaman Google kadang menyisipkan URL tujuan dalam meta refresh.
    if (is_string($body) && preg_match(
        '/http-equiv=["\']refresh["\'][^>]*content=["\'][^>]*url=([^"\'> ]+)/i',
        substr($body, 0, 200000),
        $match
    )) {
        $next = html_entity_decode($match[1], ENT_QUOTES, 'UTF-8');
        if (isAllowedGoogleMapsURL($next)) {
            $current = $next;
            continue;
        }
    }

    // Google kadang berhenti di halaman tanpa koordinat pada URL.
    // Jangan menebak pin: minta pengguna memilih titik yang lebih spesifik.
    break;
}

reply(422, [
    'ok' => false,
    'message' => 'Tidak ditemukan koordinat pin tempat pada tautan ini. Titik tengah peta tidak dipakai karena bisa meleset. Buka Google Maps, klik kanan tepat pada pin merah, salin koordinat, lalu isi Latitude dan Longitude secara manual.'
]);
