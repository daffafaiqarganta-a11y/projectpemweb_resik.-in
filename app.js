
'use strict';
const STORAGE_KEY = 'bersihin_reports_v1';
const STATUSES = {
    submitted: { label: 'Menunggu Verifikasi', step: 1 },
    verified: { label: 'Terverifikasi', step: 2 },
    forwarded: { label: 'Diteruskan', step: 3 },
    in_progress: { label: 'Dalam Penanganan', step: 4 },
    completed: { label: 'Selesai', step: 5 },
    rejected: { label: 'Ditolak', step: 0 }
};
const CATEGORY_NAMES = { sampah: 'Sampah Liar', saluran: 'Saluran Tersumbat' };
const $ = selector => document.querySelector(selector);
let reports = [];
const IS_ADMIN = document.body.dataset.page === 'admin';
const STOCK_PHOTOS = {
    jakarta: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Waste_dump_-_Jakarta_-_Indonesia.jpg/960px-Waste_dump_-_Jakarta_-_Indonesia.jpg',
    bali: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Waste_in_rain_gutter_near_school_Bali.jpg/960px-Waste_in_rain_gutter_near_school_Bali.jpg',
    yogya: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Pile_of_garbage_along_the_Code_River%2C_as_viewed_from_near_Prawirodirjan_-_North.jpg/960px-Pile_of_garbage_along_the_Code_River%2C_as_viewed_from_near_Prawirodirjan_-_North.jpg',
    cleanup: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Gotong_royong_membersihkan_sungai_dari_sampah._Gotong_royong_adalah_salah_satu_ciri_budaya_bangsa_Indonesia.jpg/960px-Gotong_royong_membersihkan_sungai_dari_sampah._Gotong_royong_adalah_salah_satu_ciri_budaya_bangsa_Indonesia.jpg'
};
let selectedCoordinate = null;
let beforePhotoData = '';
let adminAfterPhotoData = '';
let adminSelectedId = '';
let activeTrackingId = '';
let toastTimeout;
const DEMO_PHOTOS = {
    'BRH-DEMO01': STOCK_PHOTOS.jakarta,
    'BRH-DEMO02': STOCK_PHOTOS.bali,
    'BRH-DEMO03': STOCK_PHOTOS.yogya
};
function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeImageSource(src) {
    const s = String(src || '');
    return (/^data:image\/(jpeg|png|webp|svg\+xml);(?:base64,|utf8,|charset=utf-8,)/i.test(s) || /^https:\/\/thumb\.wikimedia\.org\/wikipedia\/commons\/thumb\//i.test(s)) ? escapeHTML(s) : '';
}
function formatDate(raw, withTime = false) {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime()))
        return 'Tanggal tidak tersedia';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(date);
}
function cut(text, max) { const str = String(text || ''); return str.length > max ? `${str.slice(0, max - 1)}…` : str; }
function statusBadge(status) { const s = STATUSES[status] || STATUSES.submitted; return `<span class="status-badge status-${escapeHTML(status)}">${escapeHTML(s.label)}</span>`; }
function categoryIcon(category) { return category === 'saluran' ? '💧' : '♻️'; }
function coordLink(r) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${Number(r.lat)},${Number(r.lng)}`)}`; }
function directionLink(r) { return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(r.lat)},${Number(r.lng)}`)}&travelmode=driving`; }
function mapEmbedURL(lat, lng) { return `https://maps.google.com/maps?q=${encodeURIComponent(lat + ',' + lng)}&z=17&output=embed`; }
function loadReports() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                // Migrasi gambar demo lama dari Pexels.
                // Jangan timpa foto hasil yang sudah diunggah admin sendiri.
                parsed.forEach(report => {
                    if (!report.sample) return;

                    const wasOldPhoto = photo =>
                        !photo || String(photo).startsWith('https://images.pexels.com/');

                    if (wasOldPhoto(report.beforePhoto)) {
                        report.beforePhoto = DEMO_PHOTOS[report.id] || STOCK_PHOTOS.jakarta;
                    }
                    if (report.status === 'completed' && wasOldPhoto(report.afterPhoto)) {
                        report.afterPhoto = STOCK_PHOTOS.cleanup;
                    }
                });
                return parsed;
            }
        }
    }
    catch (error) {
        console.warn('Penyimpanan browser tidak tersedia:', error);
    }
    const samples = sampleReports();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
    }
    catch (_) { }
    return samples;
}
function saveReports() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        return true;
    }
    catch (error) {
        console.error(error);
        return false;
    }
}
/*
 * Contoh tiket yang langsung muncul saat halaman pertama dibuka.
 * Foto nyata, tetapi tiket, koordinat perkiraan, dan statusnya DEMO.
 */
function sampleReports() {
    const day = offset => new Date(Date.now() - offset * 86400000).toISOString();
    const makeEvent = (status, offset, note, actor = 'Admin (demo)') => ({
        status,
        label: STATUSES[status].label,
        note,
        at: day(offset),
        actor
    });

    return [
        {
            id: 'BRH-DEMO01',
            sample: true,
            name: 'Warga Contoh',
            phone: '',
            category: 'sampah',
            title: 'Tumpukan sampah di kawasan Tanjung Priok',
            description: 'Dokumentasi nyata tumpukan sampah di kawasan Jakarta; laporan dan titik lokasi merupakan contoh simulasi.',
            address: 'Area simulasi Tanjung Priok, Jakarta (bukan koordinat pasti foto)',
            lat: -6.1182,
            lng: 106.8721,
            beforePhoto: STOCK_PHOTOS.jakarta,
            afterPhoto: '',
            createdAt: day(1),
            updatedAt: day(1),
            status: 'submitted',
            events: [
                makeEvent('submitted', 1, 'Laporan diterima melalui formulir website.', 'Sistem')
            ]
        },
        {
            id: 'BRH-DEMO02',
            sample: true,
            name: 'Warga Contoh',
            phone: '',
            category: 'saluran',
            title: 'Sampah plastik memenuhi selokan dekat sekolah',
            description: 'Selokan berisi sampah plastik di wilayah Buleleng, Bali. Lokasi pada tiket ini hanya perkiraan area ilustrasi.',
            address: 'Area simulasi Banjar, Buleleng, Bali (bukan koordinat pasti foto)',
            lat: -8.181,
            lng: 114.977,
            beforePhoto: STOCK_PHOTOS.bali,
            afterPhoto: '',
            createdAt: day(4),
            updatedAt: day(2),
            status: 'in_progress',
            events: [
                makeEvent('submitted', 4, 'Laporan diterima melalui formulir website.', 'Sistem'),
                makeEvent('verified', 3.8, 'Bukti dan lokasi telah diperiksa.'),
                makeEvent('forwarded', 3, 'Penerusan ke dinas terkait dicatat dalam simulasi.'),
                makeEvent('in_progress', 2, 'Petugas dijadwalkan melakukan pembersihan (simulasi).')
            ]
        },
        {
            id: 'BRH-DEMO03',
            sample: true,
            name: 'Warga Contoh',
            phone: '',
            category: 'sampah',
            title: 'Tumpukan sampah di bantaran Kali Code',
            description: 'Dokumentasi nyata sampah di bantaran Kali Code Yogyakarta. Tiket dan status penyelesaiannya hanyalah simulasi.',
            address: 'Area simulasi Kali Code, Yogyakarta (bukan koordinat pasti foto)',
            lat: -7.8038,
            lng: 110.3762,
            beforePhoto: STOCK_PHOTOS.yogya,
            afterPhoto: STOCK_PHOTOS.cleanup,
            createdAt: day(8),
            updatedAt: day(1),
            status: 'completed',
            events: [
                makeEvent('submitted', 8, 'Laporan tercatat di sistem.', 'Sistem'),
                makeEvent('verified', 7, 'Laporan diverifikasi.'),
                makeEvent('forwarded', 6, 'Penerusan ke instansi terkait dicatat (simulasi).'),
                makeEvent('in_progress', 4, 'Tim melakukan pembersihan (simulasi).'),
                makeEvent('completed', 1, 'Selesai (simulasi). Foto kegiatan gotong royong hanya ilustrasi, bukan bukti penanganan lokasi ini.')
            ]
        }
    ];
}
function notify(message, isError = false) {
    const toast = $('#toast');
    if (!toast)
        return;
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3400);
}
function updateStats() {
    const count = status => reports.filter(r => r.status === status).length;
    const active = ['verified', 'forwarded', 'in_progress'];
    const stats = { statAll: reports.length, statWaiting: count('submitted'), statOngoing: reports.filter(r => active.includes(r.status)).length, statCompleted: count('completed'), adminTotal: reports.length, adminPending: count('submitted'), adminActive: reports.filter(r => active.includes(r.status)).length, adminDone: count('completed') };
    Object.entries(stats).forEach(([id, value]) => { const el = document.getElementById(id); if (el)
        el.textContent = value; });
}
function evidence(photo, label) {
    const url = safeImageSource(photo);
    return `<div class="evidence-box">${url ? `<img class="evidence-image" src="${url}" alt="${escapeHTML(label)}" loading="lazy"/>` : `<div class="evidence-image">📷</div>`}<span>${escapeHTML(label)}</span></div>`;
}
function renderPublicReports() {
    if (!$('#reportSearch'))
        return;
    const query = $('#reportSearch').value.trim().toLowerCase();
    const status = $('#statusFilter').value;
    const category = $('#categoryFilter').value;
    const selected = reports.filter(r => (status === 'all' || r.status === status) && (category === 'all' || r.category === category) && `${r.id} ${r.title} ${r.address} ${r.description}`.toLowerCase().includes(query))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    $('#publicReportsGrid').innerHTML = selected.map(r => {
        const photo = safeImageSource(r.beforePhoto);
        return `<article class="report-card">
        <div class="report-image">${photo ? `<img src="${photo}" alt="Foto laporan ${escapeHTML(r.title)}" loading="lazy"/>` : `<span class="placeholder-image">${categoryIcon(r.category)}</span>`}<span class="image-chip">${escapeHTML(CATEGORY_NAMES[r.category] || 'Lingkungan')}</span>
        </div>
        <div class="report-body">
        <div class="report-meta">
        <span class="report-code">${escapeHTML(r.id)}</span>${statusBadge(r.status)}</div>
        <h3>${escapeHTML(r.title)}</h3>
        <p class="report-desc">${escapeHTML(cut(r.description, 99))}</p>
        <div class="report-address">
        <span>⌖</span>
        <span>${escapeHTML(cut(r.address, 80))}</span>
        </div>
        <div class="report-bottom">
        <span>${formatDate(r.createdAt)} ${r.sample ? '<span class="demo-mark">• DEMO</span>' : ''}</span>
        <button class="open-report" data-open-report="${escapeHTML(r.id)}" type="button">Lihat Detail ↗</button>
        </div>
        </div>
        </article>`;
    }).join('');
    $('#reportsEmpty').hidden = selected.length > 0;
}
function renderTimeline(r) {
    const events = Array.isArray(r.events) ? r.events : [];
    return `<div class="timeline">${[...events].reverse().map(e => `<div class="timeline-item"><strong>${escapeHTML(e.label || STATUSES[e.status]?.label || 'Pembaruan')}</strong><p>${escapeHTML(e.note || 'Status telah diperbarui.')}</p><time>${formatDate(e.at, true)} · ${escapeHTML(e.actor || 'Admin')}</time></div>`).join('')}</div>`;
}
function renderTrackingPanel(r, modal = false) {
    const isUploadedProof = String(r.afterPhoto || '').startsWith('data:image/');
    const afterLabel = r.sample && !isUploadedProof
        ? 'Foto kegiatan kebersihan (DEMO, bukan hasil lokasi ini)'
        : 'Foto hasil penanganan (unggahan admin)';
    return `<div class="tracking-panel">
        <div class="tracking-top">
        <div>
        <span class="detail-caption">${escapeHTML(r.id)} ${r.sample ? ' · DATA CONTOH' : ''}</span>
        <h3>${escapeHTML(r.title)}</h3>
        <p>${categoryIcon(r.category)} ${escapeHTML(CATEGORY_NAMES[r.category] || 'Lingkungan')} · ${escapeHTML(r.address)}</p>
        </div>${statusBadge(r.status)}</div>
        <div class="tracking-content">
        <div>
        <div class="detail-caption">RIWAYAT PROGRES & PESAN ADMIN</div>${renderTimeline(r)}</div>
        <div>
        <div class="detail-caption">BUKTI SEBELUM & SESUDAH</div>
        <div class="tracking-images">${evidence(r.beforePhoto, 'Foto awal' + (r.sample ? ' (foto stok demo)' : ''))}${evidence(r.afterPhoto, r.afterPhoto ? afterLabel : 'Foto hasil belum tersedia')}</div>
        <p class="tracking-info">
        <strong>Status terkini:</strong> ${escapeHTML(STATUSES[r.status]?.label || r.status)}<br/>
        <strong>Dibuat:</strong> ${formatDate(r.createdAt, true)}<br/>
        <strong>Diperbarui:</strong> ${formatDate(r.updatedAt, true)}</p>
        <a href="${coordLink(r)}" rel="noopener noreferrer" target="_blank" class="tracking-map-link">⌖ Lihat lokasi di Google Maps ↗</a>
        <a href="${directionLink(r)}" rel="noopener noreferrer" target="_blank" class="tracking-map-link" style="margin-top:8px">🧭 Rute menuju titik laporan ↗</a>
        <iframe class="ticket-map-mini" src="${mapEmbedURL(r.lat, r.lng)}" loading="lazy" title="Lokasi laporan pada Google Maps" referrerpolicy="no-referrer-when-downgrade">
        </iframe>${r.sample ? '<p class="demo-photo-disclaimer">Foto data contoh berasal dari Wikimedia Commons Indonesia. Lokasi dan waktu foto berbeda dari laporan demo; bukan bukti penanganan laporan ini.</p>' : ''}${!modal ? `<div style="margin-top:17px">
        <button type="button" class="btn btn-outline btn-sm" data-copy-code="${escapeHTML(r.id)}">Salin Kode Laporan</button>
        </div>` : ''}</div>
        </div>
        </div>`;
}
function openModal(markup) { $('#modalContent').innerHTML = markup; $('#modalBackdrop').hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal() { $('#modalBackdrop').hidden = true; document.body.style.overflow = ''; }
function showReportDetail(id) {
    const r = reports.find(v => v.id === id);
    if (!r)
        return notify('Laporan tidak ditemukan.', true);
    openModal(`<div class="modal-content-inner">${renderTrackingPanel(r, true)}<div style="margin-top:18px"><button class="btn btn-outline btn-sm" data-copy-code="${escapeHTML(r.id)}">Salin Kode Laporan</button></div></div>`);
}
function doTracking(id) {
    const query = String(id || '').trim().toUpperCase();
    const r = reports.find(x => x.id.toUpperCase() === query);
    activeTrackingId = r ? r.id : '';
    if (!$('#trackingResult'))
        return;
    $('#trackingResult').innerHTML = r ? renderTrackingPanel(r) : `<div class="tracking-fail">Laporan dengan kode <strong>${escapeHTML(query || '(kosong)')}</strong> tidak ditemukan di browser ini. Periksa kembali kodenya. Data tidak tersinkron dengan perangkat lain.</div>`;
    if (r)
        $('#trackingResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    else
        notify('Kode laporan tidak ditemukan.', true);
}
function renderAdminList() {
    if (!$('#adminSearch'))
        return;
    const query = $('#adminSearch').value.trim().toLowerCase();
    const status = $('#adminStatusFilter').value;
    const category = $('#adminCategoryFilter')?.value || 'all';
    const selected = reports.filter(r => (status === 'all' || r.status === status) && (category === 'all' || r.category === category) && `${r.id} ${r.title} ${r.address} ${r.name}`.toLowerCase().includes(query))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    $('#adminListCount').textContent = selected.length;
    if ($('#adminListCountBadge'))
        $('#adminListCountBadge').textContent = selected.length + ' tiket';
    $('#adminReportList').innerHTML = selected.length ? selected.map(r => `<button class="admin-ticket ${adminSelectedId === r.id ? 'active' : ''}" data-admin-select="${escapeHTML(r.id)}" type="button"><div class="ticket-row"><span class="ticket-code">${escapeHTML(r.id)}</span>${statusBadge(r.status)}</div><strong>${categoryIcon(r.category)} ${escapeHTML(r.title)}</strong><span class="ticket-location">⌖ ${escapeHTML(r.address)}</span></button>`).join('') : '<div class="admin-empty">Tidak ada laporan yang sesuai.</div>';
}
function renderAdminDetail() {
    if (!$('#adminDetail'))
        return;
    const r = reports.find(x => x.id === adminSelectedId);
    if (!r) {
        $('#adminDetail').innerHTML = '<div class="admin-placeholder"><span>✳</span><h3>Pilih laporan untuk dikelola</h3><p>Detail tiket, verifikasi, dan formulir pembaruan akan tampil di sini.</p></div>';
        return;
    }
    let actions = '';
    if (r.status === 'submitted')
        actions = `<button class="btn btn-primary btn-sm" data-admin-action="approve" type="button">✓ Verifikasi & ACC</button><button class="btn btn-danger btn-sm" data-admin-action="reject" type="button">✕ Tolak Laporan</button>`;
    if (r.status === 'verified')
        actions = `<button class="btn btn-primary btn-sm" data-admin-action="forward" type="button">↗ Catat Penerusan ke Pemerintah</button><button class="btn btn-success btn-sm" data-admin-action="complete" type="button">✓ Selesai & Kirim Hasil ke Pelapor</button>`;
    if (r.status === 'forwarded')
        actions = `<button class="btn btn-primary btn-sm" data-admin-action="start" type="button">↻ Mulai Penanganan</button><button class="btn btn-success btn-sm" data-admin-action="complete" type="button">✓ Selesai & Kirim Hasil ke Pelapor</button>`;
    if (r.status === 'in_progress')
        actions = `<button class="btn btn-success btn-sm" data-admin-action="complete" type="button">✓ Selesai & Kirim Hasil ke Pelapor</button>`;
    if (r.status === 'completed')
        actions = '<span class="status-badge status-completed">✓ Tiket sudah selesai</span>';
    if (r.status === 'rejected')
        actions = '<span class="status-badge status-rejected">Tiket telah ditolak</span>';
    const afterUploader = ['verified', 'forwarded', 'in_progress'].includes(r.status) ? '<label style="display:block;font-size:11px;font-weight:800;margin:12px 0 6px" for="adminAfterPhoto">Unggah foto hasil penanganan (wajib untuk selesai)</label><input type="file" accept="image/jpeg,image/png,image/webp,image/*" id="adminAfterPhoto"/><div id="adminAfterPreview" style="font-size:10px;color:#588369"></div>' : '';
    $('#adminDetail').innerHTML = `<div class="admin-detail-heading">
        <div>
        <span class="detail-caption">TIKET ${escapeHTML(r.id)} ${r.sample ? ' • DEMO' : ''}</span>
        <h3>${escapeHTML(r.title)}</h3>
        <small>Dibuat ${formatDate(r.createdAt, true)}</small>
        </div>${statusBadge(r.status)}</div>
        <div class="admin-info-grid">
        <div>
        <span>JENIS</span>
        <strong>${escapeHTML(CATEGORY_NAMES[r.category] || 'Lingkungan')}</strong>
        </div>
        <div>
        <span>PELAPOR (PRIVAT)</span>
        <strong>${escapeHTML(r.name || '-')}</strong>
        </div>
        <div>
        <span>KONTAK (PRIVAT)</span>
        <strong>${escapeHTML(r.phone || 'Tidak dicantumkan')}</strong>
        </div>
        <div>
        <span>KOORDINAT</span>
        <strong>${Number(r.lat).toFixed(6)}, ${Number(r.lng).toFixed(6)}</strong>
        </div>
        <div class="admin-info-wide">
        <span>LOKASI</span>
        <strong>${escapeHTML(r.address)} <a href="${coordLink(r)}" target="_blank" rel="noopener noreferrer" style="color:#2a9470">(Buka peta ↗)</a>
        </strong>
        </div>
        </div>
        <div class="admin-location-card">
        <div>
        <strong>📍 Lokasi kejadian di Google Maps</strong>
        <div class="admin-map-actions">
        <a href="${coordLink(r)}" target="_blank" rel="noopener noreferrer">Lihat pin ↗</a>
        <a href="${directionLink(r)}" target="_blank" rel="noopener noreferrer">Buka rute ↗</a>
        </div>
        </div>
        <iframe src="${mapEmbedURL(r.lat, r.lng)}" title="Titik laporan pada Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
        </iframe>
        </div>
        <div class="admin-description">${escapeHTML(r.description)}</div>
        <div class="admin-evidence">${evidence(r.beforePhoto, 'Foto laporan warga')}${evidence(r.afterPhoto, r.afterPhoto ? 'Hasil penanganan' : 'Belum ada foto hasil')}</div>
        <div class="admin-actions">
        <h4>Pembaruan & Tindak Lanjut</h4>
        <p>Catatan yang dikirim di sini akan langsung muncul pada riwayat publik dan pelacakan laporan.</p>
        <label for="adminNote" style="display:block;font-size:11px;font-weight:800;margin-bottom:7px">Keterangan admin untuk pelapor</label>
        <textarea id="adminNote" maxlength="1400" placeholder="Tulis keterangan verifikasi, instansi tujuan, perkiraan tindak lanjut, atau penjelasan hasil...">
        </textarea>${afterUploader}<div class="admin-action-buttons">${actions}<button type="button" class="btn btn-outline btn-sm" data-admin-action="message">✉ Kirim Pembaruan</button>
        </div>
        </div>
        <div class="admin-updates">
        <h4>Riwayat Aktivitas (${r.events?.length || 0})</h4>${[...(r.events || [])].reverse().map(e => `<div class="admin-update-row">
        <span>●</span>
        <div>
        <strong>${escapeHTML(e.label)}</strong>
        <small>${formatDate(e.at, true)} · ${escapeHTML(e.actor || 'Admin')}</small>
        <p>${escapeHTML(e.note)}</p>
        </div>
        </div>`).join('')}</div>`;
}
function renderAll() {
    updateStats();
    renderPublicReports();
    renderAdminList();
    renderAdminDetail();
    renderCharts();
    if (activeTrackingId) {
        const r = reports.find(x => x.id === activeTrackingId);
        if (r && $('#trackingResult'))
            $('#trackingResult').innerHTML = renderTrackingPanel(r);
    }
}
function appendEvent(r, status, label, note) {
    const time = new Date().toISOString();
    r.status = status;
    r.updatedAt = time;
    if (!Array.isArray(r.events))
        r.events = [];
    r.events.push({ status, label, note, at: time, actor: 'Admin (simulasi)' });
}
function performAdminAction(action) {
    const r = reports.find(x => x.id === adminSelectedId);
    if (!r)
        return;
    const input = $('#adminNote');
    const note = String(input?.value || '').trim();
    if (action === 'message') {
        if (!note)
            return notify('Tulis keterangan terlebih dahulu untuk mengirim pembaruan.', true);
        appendEvent(r, r.status, 'Pesan / Pembaruan Admin', note);
    }
    else if (action === 'approve' && r.status === 'submitted') {
        appendEvent(r, 'verified', 'Laporan Disetujui / Terverifikasi', note || 'Foto, kategori, dan lokasi telah diperiksa. Laporan disetujui untuk ditindaklanjuti.');
    }
    else if (action === 'reject' && r.status === 'submitted') {
        if (!note)
            return notify('Alasan penolakan wajib ditulis agar pelapor mengetahui penyebabnya.', true);
        if (!window.confirm('Tolak laporan ini? Alasan penolakan akan terlihat oleh pelapor.'))
            return;
        appendEvent(r, 'rejected', 'Laporan Ditolak', note);
    }
    else if (action === 'forward' && r.status === 'verified') {
        appendEvent(r, 'forwarded', 'Penerusan ke Pemerintah Dicatat (Simulasi)', note || 'Admin mencatat penerusan laporan kepada pemerintah / instansi terkait. Belum ada pengiriman otomatis ke instansi.');
    }
    else if (action === 'start' && r.status === 'forwarded') {
        appendEvent(r, 'in_progress', 'Penanganan Sedang Berjalan (Simulasi)', note || 'Admin memperbarui bahwa laporan memasuki tahap penanganan.');
    }
    else if (action === 'complete' && ['verified', 'forwarded', 'in_progress'].includes(r.status)) {
        if (!adminAfterPhotoData)
            return notify('Wajib unggah foto dokumentasi hasil penanganan.', true);
        if (note.length < 10)
            return notify('Tuliskan keterangan hasil penanganan minimal 10 karakter.', true);
        if (!window.confirm('Tandai laporan selesai dan tampilkan foto hasil kepada pelapor?'))
            return;
        r.afterPhoto = adminAfterPhotoData;
        appendEvent(r, 'completed', 'Penanganan Selesai, Bukti Foto Tersedia', note);
        adminAfterPhotoData = '';
    }
    else
        return notify('Aksi tidak sesuai tahap laporan saat ini.', true);
    if (!saveReports()) {
        reports = loadReports();
        notify('Penyimpanan browser penuh. Perubahan tidak tersimpan; gunakan foto lebih kecil.', true);
    }
    else
        notify('Pembaruan berhasil! Catatan dan foto hasil bisa dilihat warga lewat kode laporan pada browser ini.');
    renderAll();
}
/* Membaca gambar lalu mengecilkannya agar tidak cepat memenuhi localStorage. */
function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (!file)
            return reject(new Error('Pilih file foto terlebih dahulu.'));
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
            return reject(new Error('Gunakan foto berformat JPG, PNG, atau WebP.'));
        if (file.size > 8 * 1024 * 1024)
            return reject(new Error('Ukuran foto maksimal 8 MB.'));
        const fr = new FileReader();
        fr.onerror = () => reject(new Error('Foto gagal dibaca.'));
        fr.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Foto tidak valid atau rusak.'));
            img.onload = () => {
                try {
                    const max = 1050;
                    const scale = Math.min(1, max / Math.max(img.width, img.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', .70));
                }
                catch (e) {
                    reject(new Error('Foto gagal diproses.'));
                }
            };
            img.src = String(fr.result);
        };
        fr.readAsDataURL(file);
    });
}
async function setBeforePhoto(file) {
    try {
        const result = await compressImage(file);
        beforePhotoData = result;
        $('#beforePreview').src = result;
        $('#beforePlaceholder').hidden = true;
        $('#beforePreviewBox').hidden = false;
        notify('Foto bukti berhasil dipilih.');
    }
    catch (e) {
        notify(e.message, true);
        $('#reportPhoto').value = '';
    }
}
async function setAdminAfterPhoto(file) {
    try {
        const idAtStart = adminSelectedId;
        const result = await compressImage(file);
        if (adminSelectedId !== idAtStart)
            return;
        adminAfterPhotoData = result;
        const area = $('#adminAfterPreview');
        if (area)
            area.innerHTML = `<img src="${safeImageSource(result)}" alt="Pratinjau foto hasil" style="width:160px;max-height:100px;object-fit:cover;border-radius:8px;margin-top:5px"/><p>Foto hasil siap diunggah saat laporan diselesaikan.</p>`;
    }
    catch (e) {
        notify(e.message, true);
    }
}
/* Google Maps tanpa API key: pratinjau lokasi via iframe, GPS, tautan titik, dan koordinat manual. */
function initMap() {
    const iframe = $('#googleReportMap');
    if (!iframe)
        return;
    iframe.addEventListener('load', () => { iframe.dataset.loaded = 'true'; });
}
function setPin(lat, lng, fromInput = false) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
        return false;
    const latStr = lat.toFixed(6), lngStr = lng.toFixed(6);
    selectedCoordinate = { lat, lng };
    if (!fromInput) {
        $('#reportLat').value = latStr;
        $('#reportLng').value = lngStr;
    }
    const hint = $('#mapHint');
    if (hint)
        hint.textContent = `✓ Koordinat dipilih: ${latStr}, ${lngStr}`;
    const iframe = $('#googleReportMap');
    if (iframe)
        iframe.src = mapEmbedURL(latStr, lngStr);
    const selected = $('#selectedMapLink');
    if (selected) {
        selected.hidden = false;
        selected.href = coordLink({ lat, lng });
    }
    return true;
}
function parseGoogleMapsCoordinates(raw) {
    let url;
    try {
        url = new URL(String(raw || '').trim());
    } catch (_) {
        return null;
    }

    const host = url.hostname.toLowerCase();
    const allowed = ['maps.app.goo.gl', 'goo.gl', 'google.com', 'www.google.com',
        'maps.google.com', 'google.co.id', 'www.google.co.id', 'maps.google.co.id'];
    if (url.protocol !== 'https:' || !allowed.includes(host)) {
        return null;
    }

    let decoded = url.href;
    try {
        decoded = decodeURIComponent(decoded);
    } catch (_) {
        // Tautan dapat tetap diproses tanpa decode.
    }

    const matchCoordinates = (pattern, pickLast = false) => {
        const matches = [...decoded.matchAll(pattern)];
        if (!matches.length) return null;
        const match = pickLast ? matches[matches.length - 1] : matches[0];
        const lat = Number(match[1]);
        const lng = Number(match[2]);
        return Number.isFinite(lat) && Number.isFinite(lng) &&
            Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
    };

    // Penting: !3d...!4d... adalah lokasi PIN; @... adalah kamera!
    const pin = matchCoordinates(/!8m2!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/g, true)
        || matchCoordinates(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/g, true);
    if (pin) return { ...pin, source: 'pin' };

    const explicit = matchCoordinates(/[?&](?:q|query|ll|destination|daddr)=(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:[&#]|$)/g)
        || matchCoordinates(/\/(?:search|place)\/(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:[/?]|$)/g)
        || matchCoordinates(/[?&](?:q|query)=loc:(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:[&#]|$)/g);
    if (explicit) return { ...explicit, source: 'explicit' };

    // Jangan mengambil pusat kamera dari tautan tempat bernama.
    if (decoded.includes('/maps/place/')) return null;

    const camera = matchCoordinates(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/g);
    return camera ? { ...camera, source: 'camera', warning: 'Pusat peta, bukan pin tempat. Cek titik sebelum mengirim.' } : null;
}

async function useGoogleMapsLink() {
    const input = $('#googleMapsLink');
    const value = input?.value.trim() || '';
    const button = $('#useMapsLink');
    const feedback = $('#mapsLinkFeedback');
    if (!value) {
        notify('Masukkan tautan lokasi Google Maps dahulu.', true);
        return;
    }
    const direct = parseGoogleMapsCoordinates(value);
    if (direct) {
        setPin(direct.lat, direct.lng);
        if (feedback)
            feedback.textContent = direct.warning || '✓ Koordinat pin Google Maps berhasil digunakan.';
        notify(direct.warning || 'Lokasi pin Google Maps berhasil ditandai.', Boolean(direct.warning));
        return;
    }
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch (_) {
        notify('Link Google Maps tidak valid.', true);
        return;
    }
    if (parsed.protocol !== 'https:' || ![
        'maps.app.goo.gl', 'goo.gl', 'www.google.com', 'google.com',
        'maps.google.com', 'www.google.co.id', 'google.co.id', 'maps.google.co.id'
    ].includes(parsed.hostname.toLowerCase())) {
        notify('Hanya tautan Google Maps yang didukung.', true);
        return;
    }
    button.disabled = true;
    button.textContent = 'Membaca link...';
    if (feedback)
        feedback.textContent = 'Menghubungi pemroses link Google Maps di XAMPP...';

    // Selalu gunakan endpoint PHP di direktori yang sama dengan index.html.
    // Ini tetap benar meski folder website berada dua tingkat di dalam htdocs.
    const endpoint = new URL('./resolve_map.php', document.baseURI);
    endpoint.searchParams.set('url', value);
    const checker = new URL('./resolve_map.php?check=1', document.baseURI);

    try {
        if (location.protocol !== 'http:' && location.protocol !== 'https:') {
            throw new Error('Website dibuka sebagai file lokal. Buka lewat http://localhost/ pada XAMPP.');
        }
        if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
            // PHP di hosting lainnya masih mungkin berfungsi; tetap lanjut.
            console.info('BERSIHIN: pemroses Maps memakai host', location.hostname);
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        let response;
        try {
            response = await fetch(endpoint.toString(), {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });
        }
        finally {
            clearTimeout(timeout);
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            if (response.status === 404) {
                throw new Error('File resolve_map.php tidak ditemukan di alamat website ini. Pastikan index.html dan resolve_map.php berada dalam folder yang sama.');
            }
            throw new Error('PHP tidak memberikan respons JSON. Pastikan menggunakan Apache XAMPP, bukan Live Server VS Code.');
        }
        const result = await response.json();
        if (!response.ok || !result.ok) {
            throw new Error(result.message || 'Google Maps belum mengembalikan titik koordinat.');
        }
        const lat = Number(result.lat);
        const lng = Number(result.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
            Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            throw new Error('Respons koordinat tidak valid.');
        }
        setPin(lat, lng);
        if (feedback)
            feedback.textContent = result.warning || `✓ Koordinat ${result.source === 'pin' ? 'pin tempat' : 'lokasi'} ditemukan: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        notify(result.warning || 'Titik Google Maps berhasil ditandai. Cek kembali pin sebelum mengirim.', Boolean(result.warning));
    }
    catch (error) {
        let message = error.message || 'Gagal memproses tautan Google Maps.';
        if (error.name === 'AbortError') {
            message = 'Pemrosesan terlalu lama. Coba lagi, atau masukkan koordinat manual.';
        }
        else if (error instanceof TypeError && /fetch|network|load/i.test(message)) {
            message = `Browser tidak bisa menghubungi PHP lokal. Buka tes PHP: ${checker.href}. Jika gagal, periksa Apache dan URL localhost (bukan Live Server).`;
        }
        if (feedback)
            feedback.textContent = message;
        notify(message, true);
    }
    finally {
        button.disabled = false;
        button.textContent = 'Gunakan Titik';
    }
}
function createId() {
    // ID setiap laporan berbeda, termasuk bila dibuat di detik yang sama.
    const today = new Date();
    const dateTag = [
        String(today.getFullYear()).slice(-2),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('');
    let code;
    do {
        const bytes = new Uint8Array(4);
        if (globalThis.crypto && crypto.getRandomValues) {
            crypto.getRandomValues(bytes);
        }
        else {
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        const suffix = Array.from(bytes, value => value.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
        code = `BRH-${dateTag}-${suffix}`;
    } while (reports.some(report => report.id === code));
    return code;
}
function submitNewReport(event) {
    event.preventDefault();
    const name = $('#reporterName').value.trim(), phone = $('#reporterPhone').value.trim(), category = $('#reportCategory').value, title = $('#reportTitle').value.trim(), description = $('#reportDescription').value.trim(), address = $('#reportAddress').value.trim(), lat = Number($('#reportLat').value), lng = Number($('#reportLng').value);
    if (name.length < 2)
        return notify('Isi nama pelapor minimal 2 karakter.', true);
    if (!CATEGORY_NAMES[category])
        return notify('Pilih kategori laporan.', true);
    if (title.length < 5)
        return notify('Judul laporan minimal 5 karakter.', true);
    if (description.length < 15)
        return notify('Keterangan kondisi minimal 15 karakter.', true);
    if (!beforePhotoData)
        return notify('Unggah foto kondisi sebelum penanganan.', true);
    if (!$('#reportLat').value.trim() || !$('#reportLng').value.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
        return notify('Tentukan koordinat yang benar lewat peta atau kolom latitude / longitude.', true);
    if (address.length < 5)
        return notify('Isi patokan / alamat lokasi minimal 5 karakter.', true);
    const id = createId(), now = new Date().toISOString();
    const r = { id, sample: false, name, phone, category, title, description, address, lat, lng, beforePhoto: beforePhotoData, afterPhoto: '', createdAt: now, updatedAt: now, status: 'submitted', events: [{ status: 'submitted', label: 'Laporan Diterima, Menunggu Verifikasi', note: 'Laporan warga dan bukti foto telah masuk ke antrean verifikasi admin.', at: now, actor: 'Sistem' }] };
    reports.unshift(r);
    if (!saveReports()) {
        reports.shift();
        notify('Memori penyimpanan browser penuh. Gunakan foto lebih kecil atau bersihkan data lama sebelum mengirim.', true);
        return;
    }
    $('#reportForm').reset();
    beforePhotoData = '';
    $('#beforePreview').removeAttribute('src');
    $('#beforePlaceholder').hidden = false;
    $('#beforePreviewBox').hidden = true;
    selectedCoordinate = null;
    if ($('#googleReportMap'))
        $('#googleReportMap').src = 'https://maps.google.com/maps?q=Purwokerto%2C%20Jawa%20Tengah&z=13&output=embed';
    if ($('#selectedMapLink'))
        $('#selectedMapLink').hidden = true;
    if ($('#googleMapsLink'))
        $('#googleMapsLink').value = '';
    $('#mapHint').textContent = 'Masukkan koordinat atau tempel tautan Google Maps';
    renderAll();
    openModal(`<div class="modal-content-inner" style="text-align:center">
        <div class="modal-success-icon">✓</div>
        <div class="eyebrow">LAPORAN BERHASIL DIKIRIM</div>
        <h2 class="modal-title" id="modalTitle">Terima kasih sudah peduli!</h2>
        <p class="modal-copy">Laporan berhasil dicatat di browser ini dan masuk ke antrean admin demo. Simpan kode berikut untuk mengecek progresnya.</p>
        <div class="receipt-box">
        <span>KODE LAPORAN ANDA</span>
        <div class="receipt-code">${escapeHTML(id)}</div>
        <div style="font-size:11px;color:#668877">Status: Menunggu Verifikasi</div>
        </div>
        <div class="receipt-actions" style="justify-content:center">
        <button class="btn btn-outline" data-copy-code="${escapeHTML(id)}">Salin Kode</button>
        <button class="btn btn-primary" data-view-report="${escapeHTML(id)}">Lihat Progres →</button>
        </div>
        <p class="modal-copy" style="margin-top:14px">Catatan: Tidak ada pengiriman ke perangkat lain atau pemerintah pada prototipe ini.</p>
        </div>`);
}
function downloadData() {
    const blob = new Blob([JSON.stringify({ app: 'BERSIHIN Demo', exportedAt: new Date().toISOString(), reports }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bersihin-laporan-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    notify('Data laporan berhasil diekspor sebagai JSON.');
}
async function copyCode(code) {
    try {
        if (navigator.clipboard && window.isSecureContext)
            await navigator.clipboard.writeText(code);
        else {
            const el = document.createElement('textarea');
            el.value = code;
            el.style.position = 'fixed';
            el.style.opacity = '0';
            document.body.appendChild(el);
            el.select();
            const ok = document.execCommand('copy');
            el.remove();
            if (!ok)
                throw new Error('Gagal salin');
        }
        notify(`Kode ${code} berhasil disalin.`);
    }
    catch (_) {
        notify(`Kode laporan: ${code}. Salin secara manual.`, true);
    }
}
function attachEvents() {
    if ($('#menuToggle')) {
        $('#menuToggle').addEventListener('click', () => { const nav = $('#mainNav'); nav.classList.toggle('open'); $('#menuToggle').setAttribute('aria-expanded', String(nav.classList.contains('open'))); });
        document.querySelectorAll('.main-nav a').forEach(a => a.addEventListener('click', () => { $('#mainNav').classList.remove('open'); $('#menuToggle').setAttribute('aria-expanded', 'false'); }));
    }
    ['reportSearch', 'statusFilter', 'categoryFilter'].forEach(id => { const el = document.getElementById(id); if (el)
        el.addEventListener(id === 'reportSearch' ? 'input' : 'change', renderPublicReports); });
    ['adminSearch', 'adminStatusFilter', 'adminCategoryFilter'].forEach(id => { const el = document.getElementById(id); if (el)
        el.addEventListener(id === 'adminSearch' ? 'input' : 'change', renderAdminList); });
    if ($('#reportForm')) {
        $('#reportForm').addEventListener('submit', submitNewReport);
        $('#beforeDropzone').addEventListener('click', e => { if (e.target === $('#reportPhoto'))
            return; $('#reportPhoto').click(); });
        $('#beforeDropzone').addEventListener('dragover', e => { e.preventDefault(); $('#beforeDropzone').classList.add('dragover'); });
        $('#beforeDropzone').addEventListener('dragleave', () => $('#beforeDropzone').classList.remove('dragover'));
        $('#beforeDropzone').addEventListener('drop', e => { e.preventDefault(); $('#beforeDropzone').classList.remove('dragover'); const file = e.dataTransfer?.files?.[0]; if (file)
            setBeforePhoto(file); });
        $('#reportPhoto').addEventListener('change', e => { const file = e.target.files?.[0]; if (file)
            setBeforePhoto(file); });
        ['reportLat', 'reportLng'].forEach(id => document.getElementById(id).addEventListener('change', () => { const x = $('#reportLat').value, y = $('#reportLng').value; if (x && y)
            setPin(Number(x), Number(y), true); }));
        $('#useMapsLink').addEventListener('click', async () => {
            await useGoogleMapsLink();
        });
        $('#googleMapsLink').addEventListener('keydown', e => { if (e.key === 'Enter') {
            e.preventDefault();
            $('#useMapsLink').click();
        } });
        $('#locateMe').addEventListener('click', () => {
            if (!navigator.geolocation)
                return notify('Browser ini tidak mendukung akses lokasi.', true);
            const button = $('#locateMe');
            button.disabled = true;
            button.textContent = 'Mencari titik GPS...';
            navigator.geolocation.getCurrentPosition(p => { setPin(p.coords.latitude, p.coords.longitude); button.disabled = false; button.textContent = '⌖ Gunakan GPS Saya'; notify('GPS berhasil dibaca. Pastikan koordinat sesuai lokasi kejadian.'); }, e => { button.disabled = false; button.textContent = '⌖ Gunakan GPS Saya'; notify('Tidak dapat membaca lokasi. Izinkan akses lokasi di Live Server/HTTPS atau isi koordinat manual.', true); }, { enableHighAccuracy: true, timeout: 12000 });
        });
        $('#trackBtn').addEventListener('click', () => doTracking($('#trackingId').value));
        $('#trackingId').addEventListener('keydown', e => { if (e.key === 'Enter')
            doTracking($('#trackingId').value); });
    }
    if ($('#exportReports'))
        $('#exportReports').addEventListener('click', downloadData);
    $('#closeModal').addEventListener('click', closeModal);
    $('#modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop')
        closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modalBackdrop').hidden)
        closeModal(); });
    document.addEventListener('change', e => { if (e.target.id === 'adminAfterPhoto' && e.target.files?.[0])
        setAdminAfterPhoto(e.target.files[0]); });
    document.addEventListener('click', e => {
        const open = e.target.closest('[data-open-report]');
        if (open) {
            showReportDetail(open.dataset.openReport);
            return;
        }
        const select = e.target.closest('[data-admin-select]');
        if (select) {
            adminSelectedId = select.dataset.adminSelect;
            adminAfterPhotoData = '';
            renderAdminList();
            renderAdminDetail();
            return;
        }
        const act = e.target.closest('[data-admin-action]');
        if (act) {
            performAdminAction(act.dataset.adminAction);
            return;
        }
        const copy = e.target.closest('[data-copy-code]');
        if (copy) {
            copyCode(copy.dataset.copyCode);
            return;
        }
        const view = e.target.closest('[data-view-report]');
        if (view) {
            const id = view.dataset.viewReport;
            closeModal();
            if ($('#trackingId')) {
                $('#trackingId').value = id;
                location.hash = 'lacak';
                doTracking(id);
            }
            return;
        }
    });
    if ($('#adminSidebarToggle'))
        $('#adminSidebarToggle').addEventListener('click', () => $('#dashboardSidebar').classList.toggle('is-open'));
    document.querySelectorAll('.sidebar-item').forEach(el => el.addEventListener('click', () => { $('#dashboardSidebar').classList.remove('is-open'); document.querySelectorAll('.sidebar-item').forEach(a => a.classList.toggle('active', a === el)); }));
    /* localStorage event membuat semua tab pada origin yang sama sinkron otomatis. */
    window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) {
        reports = loadReports();
        renderAll();
        notify('Ada perubahan laporan dari tab lain. Dashboard diperbarui.');
    } });
    window.addEventListener('focus', () => { const fresh = loadReports(); if (JSON.stringify(fresh) !== JSON.stringify(reports)) {
        reports = fresh;
        renderAll();
    } });
}
function renderCharts() {
    if (!$('#trendChart'))
        return;
    const counts = status => reports.filter(r => r.status === status).length;
    const now = new Date(), days = [];
    for (let n = 6; n >= 0; n--) {
        const day = new Date(now);
        day.setDate(day.getDate() - n);
        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        const count = reports.filter(r => { const d = new Date(r.createdAt); return !Number.isNaN(d.valueOf()) && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === key; }).length;
        days.push({ label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(day), count });
    }
    const max = Math.max(4, Math.ceil(Math.max(...days.map(d => d.count)) / 4) * 4);
    const width = 700, height = 215, padX = 44, padTop = 17, plotHeight = 155, plotWidth = width - padX - 18;
    const px = i => padX + i * plotWidth / 6, py = v => padTop + plotHeight - v / max * plotHeight;
    const pts = days.map((d, i) => `${px(i).toFixed(2)},${py(d.count).toFixed(2)}`).join(' ');
    const polygon = `${px(0)},${padTop + plotHeight} ${pts} ${px(6)},${padTop + plotHeight}`;
    const grid = [0, .25, .5, .75, 1].map(f => `<line x1="${padX}" x2="${width - 18}" y1="${py(max * f)}" y2="${py(max * f)}" stroke="#edf4f0" stroke-dasharray="4 6"/><text x="${padX - 10}" y="${py(max * f) + 4}" font-size="11" text-anchor="end" fill="#8ea59a">${(max * f).toFixed(0)}</text>`).join('');
    $('#trendChart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Laporan 7 hari terakhir: ${days.map(d => d.count).join(', ')}">
        <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#39b87d" stop-opacity=".25"/>
        <stop offset="1" stop-color="#39b87d" stop-opacity="0"/>
        </linearGradient>
        </defs>${grid}<polygon points="${polygon}" fill="url(#lineFill)"/>
        <polyline class="chart-line" points="${pts}" fill="none" stroke="#188968" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>${days.map((d, i) => `<circle cx="${px(i)}" cy="${py(d.count)}" r="5" fill="#188968" stroke="#fff" stroke-width="3">
        <title>${d.label}: ${d.count} laporan</title>
        </circle>
        <text x="${px(i)}" y="${height - 12}" font-size="11" text-anchor="middle" fill="#6d847a">${d.label}</text>`).join('')}</svg>`;
    const statusGroups = [['submitted', 'Menunggu', '#f3ae52'], ['verified', 'Terverifikasi', '#57b6cc'], ['forwarded', 'Diteruskan', '#6d91e8'], ['in_progress', 'Ditangani', '#408eab'], ['completed', 'Selesai', '#32ad78'], ['rejected', 'Ditolak', '#ed8080']];
    let position = 0;
    const total = reports.length || 1;
    const slices = statusGroups.filter(([id]) => counts(id) > 0).map(([id, label, color]) => { const start = position; position += counts(id) / total * 100; return `${color} ${start.toFixed(3)}% ${position.toFixed(3)}%`; }).join(', ');
    $('#statusDonut').style.background = slices ? `conic-gradient(${slices})` : '#ecf2ed';
    $('#donutTotal').textContent = reports.length;
    $('#donutLegend').innerHTML = statusGroups.map(([id, label, color]) => `<div class="donut-legend-row"><span><i style="background:${color}"></i>${label}</span><b>${counts(id)}</b></div>`).join('');
    const garbage = reports.filter(r => r.category === 'sampah').length, drain = reports.filter(r => r.category === 'saluran').length;
    const maxcat = Math.max(1, garbage, drain);
    $('#categoryChart').innerHTML = [["♻️", "Sampah Liar", garbage, "#2caa77"], ["💧", "Saluran Tersumbat", drain, "#5d93d5"]].map(([emoji, label, count, color]) => `<div class="category-chart-row"><div><span>${emoji} ${label}</span><strong>${count} tiket</strong></div><div class="category-bar-bg"><span style="width:${(count / maxcat * 100).toFixed(2)}%;background:${color}"></span></div></div>`).join('');
    const rate = reports.length ? Math.round(counts('completed') / reports.length * 100) : 0;
    $('#resolutionRate').textContent = rate + '%';
    $('#resolutionBar').style.width = rate + '%';
    $('#insightDone').textContent = counts('completed');
    $('#insightRejected').textContent = counts('rejected');
    $('#insightPending').textContent = counts('submitted');
    if ($('#sidebarPendingCount'))
        $('#sidebarPendingCount').textContent = counts('submitted');
}
function initScrollAnimations() {
    if (!('IntersectionObserver' in window))
        return;
    const selectors = ['.step-card', '.report-card', '.side-tip', '.chart-card', '.metric-card', '.form-card'];
    const elements = document.querySelectorAll(selectors.join(','));
    const observer = new IntersectionObserver(items => { items.forEach(item => { if (item.isIntersecting) {
        item.target.classList.add('is-revealed');
        observer.unobserve(item.target);
    } }); }, { threshold: .08 });
    elements.forEach(el => { el.classList.add('reveal-on-scroll'); observer.observe(el); });
}
function init() {
    reports = loadReports();
    if ($('#footerYear'))
        $('#footerYear').textContent = new Date().getFullYear();
    if ($('#currentDay'))
        $('#currentDay').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    adminSelectedId = reports[0]?.id || '';
    attachEvents();
    renderAll();
    initMap();
    initScrollAnimations();
    if (!IS_ADMIN && location.hash === '#lacak' && new URLSearchParams(location.search).get('kode')) {
        const id = new URLSearchParams(location.search).get('kode');
        $('#trackingId').value = id;
        doTracking(id);
    }
}
document.addEventListener('DOMContentLoaded', init);

