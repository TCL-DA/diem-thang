// Điểm tháng — mở khoá bằng mật khẩu, giải mã trong trình duyệt, dựng trang.
// Số liệu chỉ nằm trong du-lieu.enc.json (AES-GCM 256, khoá dẫn bằng Argon2id). File này không chứa số liệu nào.
const $ = (s) => document.querySelector(s);
const DO_DAI_TU_THU = 6;
const thuVien = new URL('lib/argon2.umd.min.js', location.href).href;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const so = (n, f = 1) => Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: f });
const tien = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ';
const tenThang = (m) => { const [y, t] = m.split('-'); return `Tháng ${Number(t)}/${y}`; };
const ngayVN = (d) => (d ? d.split('-').reverse().join('/') : '');

let goiMaHoa = null;
let dangMo = false;
let duLieu = null;

async function taiGoi() {
  if (goiMaHoa) return goiMaHoa;
  const r = await fetch('du-lieu.enc.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error(r.status === 404 ? 'Chưa có số liệu — chạy cập nhật lần đầu.' : 'Không tải được số liệu (' + r.status + ')');
  goiMaHoa = await r.json();
  return goiMaHoa;
}

// Argon2id tốn ~1 s CPU và 64 MB — chạy trong Worker để ô nhập không bị khựng.
function danKhoa(matKhau, goi) {
  const ma = `self.onmessage = async (e) => {
    const d = e.data;
    try {
      importScripts(d.lib);
      const raw = await self.hashwasm.argon2id({ password: d.mk, salt: new Uint8Array(d.salt),
        parallelism: d.p, iterations: d.t, memorySize: d.m, hashLength: 32, outputType: 'binary' });
      self.postMessage({ ok: true, raw }, [raw.buffer]);
    } catch (err) { self.postMessage({ ok: false, loi: String(err) }); }
  };`;
  const url = URL.createObjectURL(new Blob([ma], { type: 'text/javascript' }));
  const w = new Worker(url);
  return new Promise((res, rej) => {
    w.onmessage = (e) => { w.terminate(); URL.revokeObjectURL(url); e.data.ok ? res(e.data.raw) : rej(new Error(e.data.loi)); };
    w.onerror = (e) => { w.terminate(); URL.revokeObjectURL(url); rej(new Error(e.message || 'Worker lỗi')); };
    w.postMessage({ lib: thuVien, mk: matKhau, salt: [...unb64(goi.salt)], m: goi.m, t: goi.t, p: goi.p });
  });
}

// Ghi nhớ đăng nhập: chỉ lưu KHOÁ đã dẫn (không lưu mật khẩu), gắn với salt của gói số liệu.
const KHOA_NHO = 'diem-thang-khoa';
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const nhoKhoa = (raw, salt) => { try { localStorage.setItem(KHOA_NHO, JSON.stringify({ k: b64(raw), salt })); } catch { /* chế độ riêng tư */ } };
const quenKhoa = () => { try { localStorage.removeItem(KHOA_NHO); } catch { /* bỏ qua */ } };
const docKhoaNho = () => { try { return JSON.parse(localStorage.getItem(KHOA_NHO) || 'null'); } catch { return null; } };

async function moBangKhoa(raw, goi) {
  const khoa = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  try {
    const ro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(goi.iv) }, khoa, unb64(goi.ct));
    return JSON.parse(new TextDecoder().decode(ro));
  } catch {
    return null; // sai khoá -> thẻ xác thực GCM không khớp
  }
}

async function giaiMa(matKhau) {
  const goi = await taiGoi();
  const raw = new Uint8Array(await danKhoa(matKhau, goi));
  const d = await moBangKhoa(raw, goi);
  if (d) nhoKhoa(raw, goi.salt);
  return d;
}

// Vào thẳng nếu trình duyệt đã nhớ khoá và gói số liệu vẫn dùng cùng salt
async function tuMo() {
  const nho = docKhoaNho();
  if (!nho) return;
  const goi = await taiGoi();
  if (goi.salt !== nho.salt) { quenKhoa(); return; }
  const d = await moBangKhoa(unb64(nho.k), goi);
  if (d) moTrang(d); else quenKhoa();
}

// tay = true: bấm Enter / nút -> sai thì báo. tay = false: thử ngầm khi đang gõ -> sai thì im lặng.
let choThu = null;
const baoSai = (o) => { $('#bao').textContent = 'Sai mật khẩu.'; o.select(); };

async function thuMo(tay = false) {
  // Trang đã mở: bỏ qua. Chrome có thể tự điền mật khẩu đã lưu vào ô (đang ẩn) bất cứ lúc nào,
  // trước đây làm trang dựng lại + nhảy lên đầu.
  if (duLieu) return;
  const o = $('#mat-khau');
  const mk = o.value.trim();
  if (mk.length < DO_DAI_TU_THU) {
    if (tay) $('#bao').textContent = 'Mật khẩu có ít nhất 6 ký tự.';
    return;
  }
  if (dangMo) {
    choThu = { tay: tay || !!choThu?.tay };
    if (tay) $('#bao').textContent = 'Đang mở…';
    return;
  }
  dangMo = true;
  if (tay) { $('#nut-mo').disabled = true; $('#bao').textContent = 'Đang mở…'; }
  let moDuoc = false;
  try {
    const d = await giaiMa(mk);
    if (d) {
      moDuoc = true;
      o.value = '';
      $('#bao').textContent = '';
      moTrang(d);
    } else if (tay) {
      baoSai(o);
    }
  } catch (err) {
    $('#bao').textContent = err.message;
  } finally {
    dangMo = false;
    $('#nut-mo').disabled = false;
    const cho = choThu;
    choThu = null;
    if (!moDuoc && cho) {
      if (o.value.trim() !== mk) thuMo(cho.tay);
      else if (cho.tay) baoSai(o);
    }
  }
}

// ---------- Dựng trang ----------
function vong(phanTram) {
  const r = 52, cv = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(phanTram, 100)) / 100;
  const mau = phanTram >= 100 ? 'var(--xanh)' : phanTram >= 60 ? 'var(--vang)' : 'var(--do)';
  return `<div class="vong" aria-label="Đạt ${so(phanTram)}% ngưỡng">
    <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--vien)" stroke-width="10"/>
      <circle class="chay" cx="60" cy="60" r="${r}" fill="none" stroke="${mau}" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${cv}" stroke-dashoffset="${cv}" data-den="${cv * (1 - p)}"/></svg>
    <div class="giua"><div><b>${so(phanTram)}%</b><span>của ngưỡng</span></div></div>
  </div>`;
}

function dong(x, phai, phu = '') {
  return `<a class="dong" href="${esc(x.link)}" target="_blank" rel="noopener">
    <span class="ngay">${ngayVN(x.ngay)}</span>
    <span class="ten">${esc(x.ten || x.viec)}${x.xong ? '<span class="the-xong">✓ xong</span>' : ''}<small>${esc(phu)}</small></span>
    ${phai}
  </a>`;
}

function nhomTheoBoard(ds) {
  const m = new Map();
  ds.forEach((x) => { if (!m.has(x.board)) m.set(x.board, []); m.get(x.board).push(x); });
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}

function dungThang(t, d) {
  const p = d.tham_so;
  const n = d.nguoi;
  const tru = Math.min(t.gio_quan_ly * Math.min(p.he_so_quan_ly_K, 1), 96);
  const mayTheoList = new Map();
  t.may.forEach((x) => {
    const g = mayTheoList.get(x.list) || { list: x.list, so: 0, diem: 0, diemMay: x.diem_may, tong: x.tong_dong };
    g.so += 1; g.diem += x.diem; mayTheoList.set(x.list, g);
  });
  return `
  <section class="hero">
    <div>
      <p class="nhan">${tenThang(t.thang)} · ${esc(n.vi_tri)} · ngạch ${esc(n.ngach)} – ${esc(n.bac)}</p>
      <h1 class="diem-lon">${so(t.diem, 2)}<small>/ ${so(t.nguong)} điểm</small></h1>
      <p class="than">Tiền điểm ước tính <b>${tien(t.tien.tong)}</b>${t.tien.vuot ? ` (gồm ${tien(t.tien.vuot)} phần vượt ngưỡng)` : ''}.
        ${t.thieu_gio.length ? `Còn <b style="color:var(--vang)">${t.thieu_gio.length} thẻ chưa có giờ</b> — điền GIỜ ƯỚC là được tính điểm.` : ''}</p>
    </div>
    ${vong(t.phan_tram)}
  </section>

  <div class="o-so">
    <div class="o xanh"><b>${so(t.diem_viec, 2)}</b><span>Điểm việc · ${t.viec.length} thẻ đã xong</span></div>
    <div class="o tim"><b>${so(t.diem_may, 2)}</b><span>Điểm máy · ${t.may.length} dòng việc tick</span></div>
    <div class="o"><b>${so(t.gio_quan_ly)} giờ</b><span>Giờ quản lý (trần ${n.so_nguoi_quan} người × 8 giờ)</span></div>
    <div class="o vang"><b>${t.thieu_gio.length}</b><span>Thẻ chưa có giờ</span></div>
  </div>

  <section class="khoi">
    <h2>Cách tính</h2>
    <p class="mo-ta">Theo Quy chế lương, khoán và thưởng (ban hành 01/11/2026). Ngưỡng chỉ dùng để tính tiền điểm và xét bậc, không trừ lương cấp bậc.</p>
    <div class="cong-thuc">
      <div><span>Điểm việc = giờ thẻ (GIỜ ƯỚC, không có thì định mức theo loại thẻ) ÷ số người × ${p.he_so_gio_sang_diem}</span><b>${so(t.diem_viec, 2)}</b></div>
      <div><span>Điểm máy = Σ điểm điện của máy ÷ số dòng việc của list × dòng mình tick</span><b>${so(t.diem_may, 2)}</b></div>
      <div><span>Ngưỡng = (${p.gio_chuan_thang} − ${so(tru)} giờ QL) × ${p.ty_le_gio_san_xuat} × ${p.he_so_gio_sang_diem} × ${p.he_so_bac} (bậc) × ${p.he_so_ngach} (ngạch)</span><b>${so(t.nguong)}</b></div>
      <div><span>Tiền tới ngưỡng = MIN(điểm; ngưỡng) × ${tien(p.don_gia_diem)}</span><b>${tien(t.tien.toi_nguong)}</b></div>
      <div><span>Tiền vượt ngưỡng (đến 140% × 205%, 140–160% × 275%, trên 160% × 300%)</span><b>${tien(t.tien.vuot)}</b></div>
    </div>
  </section>

  <section class="khoi">
    <h2>Thẻ chưa có giờ (${t.thieu_gio.length})</h2>
    <p class="mo-ta">Thẻ thiết kế, lập trình… không có định mức sẵn, chỉ được tính điểm khi có ô <b>GIỜ ƯỚC</b>. Bảo trì, gửi hàng, mua hàng, việc phát sinh, gia công đã tự có định mức. Bấm vào thẻ để mở trên Trello và điền.</p>
    ${t.thieu_gio.length ? nhomTheoBoard(t.thieu_gio).map(([b, ds]) => `<div class="nhom">
      <h3>${esc(b)}<small>${ds.length} thẻ</small></h3>
      ${ds.map((x) => dong(x, `<span class="so">—</span>`, x.list)).join('')}
    </div>`).join('') : '<p class="rong">Không còn thẻ nào thiếu giờ.</p>'}
  </section>

  <section class="khoi">
    <h2>Điểm việc (${t.viec.length})</h2>
    ${t.viec.length ? t.viec.map((x) => dong(x, `<span class="so co">${so(x.gio ?? x.gio_thuc, 2)} giờ → ${so(x.diem, 2)}</span>`, `${x.board} · ${x.list}${x.nguon_gio ? ' · ' + x.nguon_gio : ''}`)).join('') : '<p class="rong">Chưa có thẻ nào xong trong tháng.</p>'}
  </section>

  <section class="khoi">
    <h2>Điểm máy (${t.may.length} dòng)</h2>
    ${mayTheoList.size ? [...mayTheoList.values()].map((g) => `<div class="nhom">
      <h3>${esc(g.list)}<small>${g.so}/${g.tong} dòng × ${so(g.diemMay)} điểm điện → ${so(g.diem, 2)}</small></h3>
    </div>`).join('') : '<p class="rong">Không tick dòng việc nào trên list dự án trong tháng.</p>'}
  </section>

  ${t.quan_ly.length || t.bao_tri.length ? `<section class="khoi">
    <h2>Quản lý và bảo trì</h2>
    <p class="mo-ta">Giờ quản lý làm giảm ngưỡng, không cộng điểm. Bảo trì có thưởng riêng (20% lãi của việc), ở đây chỉ ghi số ngày đi.</p>
    ${t.quan_ly.map((x) => dong(x, `<span class="so">${so(x.gio_thuc)} giờ QL</span>`, x.board)).join('')}
    ${t.bao_tri.map((x) => dong(x, `<span class="so">${so(x.ngay_di)} ngày đi</span>`, x.board)).join('')}
  </section>` : ''}`;
}

function bieuDo(d) {
  const max = Math.max(...d.thang.map((t) => Math.max(t.diem, t.nguong)), 1);
  return `<section class="khoi">
    <h2>Các tháng</h2>
    <div class="bieu-do">
      ${d.thang.map((t) => `<div class="cot">
        <span class="so-cot">${so(t.diem)}</span>
        <div class="thanh-diem" style="height:0" data-cao="${(t.diem / max) * 100}%"></div>
        <i class="vach" style="bottom:${(t.nguong / max) * 100}%"></i>
        <span class="nhan-cot">${tenThang(t.thang).replace('Tháng ', 'T')}</span>
      </div>`).join('')}
    </div>
    <p class="chu-giai"><span><i style="background:var(--xanh)"></i>Điểm</span><span><i style="background:var(--vang)"></i>Ngưỡng</span></p>
  </section>`;
}

function chonThang(i) {
  const d = duLieu;
  const t = d.thang[i];
  $('#chon-thang').querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
  const nd = $('#noi-dung');
  nd.innerHTML = dungThang(t, d) + bieuDo(d) + `<footer class="chan">
    <span>Cập nhật ${esc(d.cap_nhat)} · tự kéo từ Trello</span>
    <button class="ghost" type="button" id="nut-khoa-2">Khoá lại</button></footer>`;
  $('#nut-khoa-2').addEventListener('click', khoaLai);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    nd.querySelectorAll('circle.chay').forEach((c) => { c.style.strokeDashoffset = c.dataset.den; });
    nd.querySelectorAll('.thanh-diem').forEach((c) => { c.style.height = c.dataset.cao; });
  }));
}

function moTrang(d) {
  if (duLieu) return; // đã mở rồi — không dựng lại, không cuộn
  duLieu = d;
  $('#mat-khau').value = '';
  $('#chon-thang').innerHTML = d.thang.map((t, i) => `<button type="button" data-i="${i}">${tenThang(t.thang).replace('Tháng ', 'T')}</button>`).join('');
  $('#chon-thang').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => chonThang(Number(b.dataset.i))));
  $('#man-khoa').hidden = true;
  $('#noi-dung').hidden = false;
  $('#nut-khoa').hidden = false;
  chonThang(d.thang.length - 1);
  window.scrollTo({ top: 0 });
}

function khoaLai() {
  quenKhoa();
  duLieu = null;
  $('#noi-dung').innerHTML = '';
  $('#noi-dung').hidden = true;
  $('#chon-thang').innerHTML = '';
  $('#man-khoa').hidden = false;
  $('#nut-khoa').hidden = true;
  window.scrollTo({ top: 0 });
  $('#mat-khau').focus();
}

$('#form-mo').addEventListener('submit', (e) => { e.preventDefault(); thuMo(true); });
$('#mat-khau').addEventListener('input', (e) => {
  $('#bao').textContent = '';
  if (e.target.value.trim().length >= DO_DAI_TU_THU) thuMo(false);
});
$('#nut-khoa').addEventListener('click', khoaLai);
tuMo().catch((e) => {
  // Chưa có file số liệu: nói rõ là mật khẩu đặt trên máy, không phải trên web
  $('#bao').textContent = e.message.startsWith('Chưa có')
    ? 'Chưa có số liệu. Mật khẩu được đặt trên máy tính (chạy bat-dau.ps1), web chỉ dùng để mở.'
    : e.message;
});
