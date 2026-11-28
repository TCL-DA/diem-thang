// Điểm tháng · Tổ điện — mở khoá bằng mật khẩu, giải mã trong trình duyệt, dựng trang Home + 4 tab người.
// Số liệu chỉ nằm trong du-lieu.enc.json (AES-GCM 256, khoá Argon2id). Tự kiểm số liệu mới mỗi 5 phút / khi quay lại tab,
// cập nhật tại chỗ và GIỮ NGUYÊN vị trí đang xem (neo theo phần tử đầu màn hình, không chạy lại hiệu ứng vào cảnh).
import * as H from './hieu-ung.js?v=7';
import { xuatPDF } from './ban-in.js?v=1';

const $ = (s, g = document) => g.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const so = (n, f = 1) => Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: f });
const tien = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ';
const tenThang = (m) => { const [y, t] = m.split('-'); return `Tháng ${Number(t)}/${y}`; };
const ngayVN = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) : '');
const DO_DAI = 6;
const MAU = { thanh: '#3ddc97', sy: '#6ea8fe', nam: '#f5b93b', sang: '#c792ea' };
const THU_TU = ['home', 'thanh', 'sy', 'nam', 'sang'];
const KHOA_NHO = 'diem-thang-khoa';
const HU_NHO = 'diem-thang-hieu-ung';

// ---------------- Biểu tượng (SVG nét 1.8) ----------------
const I = (d, w = 24) => `<svg viewBox="0 0 ${w} ${w}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  nha: I('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  nguoi: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  set: I('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  cup: I('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>'),
  mien: I('<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>'),
  sao: I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  lua: I('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z"/>'),
  the: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/>'),
  gio: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  tien: I('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v4M18 10v4"/>'),
  dich: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
  cot: I('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
  lich: I('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'),
  co_le: I('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  ten_lua: I('<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 13l-2-2c1-4 5-8 13-8 0 8-4 12-8 13zM14 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>'),
  huy: I('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>'),
  luoi: I('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'),
  len: I('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  xuong: I('<path d="M12 5v14M5 12l7 7 7-7"/>'),
  ngang: I('<path d="M5 12h14"/>'),
  muiten: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
};
const TRANG_TRI = ['<circle cx="12" cy="12" r="5"/>', '<rect x="7" y="7" width="10" height="10"/>', '<path d="M12 5l7 12H5z"/>',
  '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', '<path d="M5 12h14M12 5v14"/>',
  '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>', '<path d="M4 18L12 6l8 12"/>'];

// ---------------- Trạng thái ----------------
let goiMaHoa = null, khoaRaw = null, duLieu = null, dangMo = false, choThu = null;
let view = 'home', thangI = 0;
const cuon = {};             // vị trí cuộn từng tab
const moRong = {};           // số dòng thẻ đã mở từng tab
const loc = {};              // bộ lọc board từng tab
let soCu = new Map();        // giá trị số lần vẽ trước -> chớp khi đổi

// ---------------- Giải mã ----------------
async function taiGoi(moi = false) {
  if (goiMaHoa && !moi) return goiMaHoa;
  const r = await fetch('du-lieu.enc.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error(r.status === 404 ? 'Chưa có số liệu — chạy cập nhật lần đầu.' : 'Không tải được số liệu (' + r.status + ')');
  return r.json();
}
function danKhoa(mk, goi) {
  const ma = `self.onmessage=async(e)=>{const d=e.data;try{importScripts(d.lib);const raw=await self.hashwasm.argon2id({password:d.mk,salt:new Uint8Array(d.salt),parallelism:d.p,iterations:d.t,memorySize:d.m,hashLength:32,outputType:'binary'});self.postMessage({ok:true,raw},[raw.buffer]);}catch(err){self.postMessage({ok:false,loi:String(err)});}};`;
  const url = URL.createObjectURL(new Blob([ma], { type: 'text/javascript' }));
  const w = new Worker(url);
  return new Promise((res, rej) => {
    w.onmessage = (e) => { w.terminate(); URL.revokeObjectURL(url); e.data.ok ? res(e.data.raw) : rej(new Error(e.data.loi)); };
    w.onerror = (e) => { w.terminate(); URL.revokeObjectURL(url); rej(new Error(e.message || 'Worker lỗi')); };
    w.postMessage({ lib: new URL('lib/argon2.umd.min.js', location.href).href, mk, salt: [...unb64(goi.salt)], m: goi.m, t: goi.t, p: goi.p });
  });
}
async function moBangKhoa(raw, goi) {
  const k = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(goi.iv) }, k, unb64(goi.ct)))); }
  catch { return null; }
}
const nhoKhoa = (raw, salt) => { try { localStorage.setItem(KHOA_NHO, JSON.stringify({ k: b64(raw), salt })); } catch { /* riêng tư */ } };
const quenKhoa = () => { try { localStorage.removeItem(KHOA_NHO); } catch { /* bỏ qua */ } };
const docKhoaNho = () => { try { return JSON.parse(localStorage.getItem(KHOA_NHO) || 'null'); } catch { return null; } };

async function tuMo() {
  const nho = docKhoaNho();
  if (!nho) return;
  const goi = await taiGoi();
  if (goi.salt !== nho.salt) { quenKhoa(); return; }
  const raw = unb64(nho.k);
  const d = await moBangKhoa(raw, goi);
  if (d) { goiMaHoa = goi; khoaRaw = raw; moTrang(d); } else quenKhoa();
}

async function thuMo(tay = false) {
  if (duLieu) return; // đã mở: bỏ qua ô mật khẩu bị trình duyệt tự điền
  const o = $('#mat-khau');
  const mk = o.value.trim();
  if (mk.length < DO_DAI) { if (tay) $('#bao').textContent = 'Mật khẩu có ít nhất 6 ký tự.'; return; }
  if (dangMo) { choThu = { tay: tay || !!choThu?.tay }; return; }
  dangMo = true;
  const nut = $('#nut-mo');
  if (tay) { nut.disabled = true; nut.innerHTML = '<span class="hl-vong-xoay" style="display:inline-block">◌</span>'; $('#bao').textContent = 'Đang mở…'; }
  let moDuoc = false;
  try {
    const goi = await taiGoi();
    const raw = new Uint8Array(await danKhoa(mk, goi));
    const d = await moBangKhoa(raw, goi);
    if (d) {
      moDuoc = true; goiMaHoa = goi; khoaRaw = raw; nhoKhoa(raw, goi.salt);
      o.value = ''; $('#bao').textContent = '';
      $('.khoa-icon')?.classList.add('mo-quai');
      setTimeout(() => moTrang(d), H.batHieuUng() ? 380 : 0);
    } else if (tay) {
      $('#bao').textContent = 'Sai mật khẩu.';
      const f = $('#form-mo'); f.classList.remove('lac'); void f.offsetWidth; f.classList.add('lac');
      o.select();
    }
  } catch (e) {
    $('#bao').textContent = e.message;
  } finally {
    dangMo = false; nut.disabled = false; nut.innerHTML = '<span>Mở</span>';
    const cho = choThu; choThu = null;
    if (!moDuoc && cho && o.value.trim() !== mk) thuMo(cho.tay);
  }
}

// ---------------- Khung trang ----------------
function moTrang(d) {
  if (duLieu) return;
  duLieu = d;
  $('#mat-khau').value = '';
  document.body.classList.add('da-mo');
  $('#man-khoa').hidden = true;
  $('#noi-dung').hidden = false;
  ['#tab', '#tab-duoi', '#cong-cu'].forEach((s) => { $(s).hidden = false; });
  if (!d.nguoi) { $('#noi-dung').innerHTML = '<p class="rong">Số liệu đang ở định dạng cũ — chờ lần cập nhật tới (20:00) hoặc chạy cap-nhat.ps1.</p>'; return; }
  thangI = d.thang.length - 1;
  dungTab();
  dungThang();
  view = THU_TU.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  ve({ vao: true });
  setInterval(kiemMoi, 5 * 60 * 1000);
}

function dungTab() {
  const muc = [['home', 'Home', IC.nha]].concat(duLieu.nguoi.map((p) => [p.ma, p.ten, IC.nguoi]));
  const a = (m, t, ic, duoi) => `<a href="#${m}" data-v="${m}" class="tab-o" ${duoi ? '' : 'data-hut'}>${duoi ? ic : (m === 'home' ? ic.replace('<svg', '<svg style="width:18px;height:18px"') : `<i class="cham" style="background:${MAU[m]}"></i>`)}<span>${t}</span></a>`;
  $('#tab').innerHTML = muc.map(([m, t, ic]) => a(m, t, ic, false)).join('');
  $('#tab-duoi').innerHTML = muc.map(([m, t, ic]) => a(m, t, m === 'home' ? ic : ic.replace('currentColor', MAU[m]), true)).join('');
}
function danhDauTab() {
  document.querySelectorAll('.tab-o').forEach((a) => {
    const on = a.dataset.v === view;
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    if (on && H.batHieuUng()) { a.classList.remove('hv-bat'); void a.offsetWidth; a.classList.add('hv-bat'); }
  });
}
function dungThang() {
  $('#chon-thang').innerHTML = duLieu.thang.map((m, i) => `<button type="button" data-i="${i}" aria-pressed="${i === thangI}">${'T' + Number(m.slice(5))}</button>`).join('');
}

// ---------------- Tính thành tích ----------------
const tThang = (p, m) => p.thang.find((t) => t.thang === m);
function chuoiNgay(viec) {
  const ngay = [...new Set(viec.map((x) => x.ngay))].sort();
  let max = 0, cur = 0, truoc = null;
  for (const n of ngay) {
    const d = new Date(n + 'T00:00:00');
    cur = truoc && (d - truoc) / 864e5 === 1 ? cur + 1 : 1;
    max = Math.max(max, cur); truoc = d;
  }
  return max;
}
function thanhTichTo(m, i) {
  const d = duLieu, ra = [];
  const ds = d.nguoi.map((p) => ({ p, t: tThang(p, m), tr: i > 0 ? tThang(p, d.thang[i - 1]) : null }));
  const vuot = ds.filter((x) => x.t.phan_tram >= 100);
  if (vuot.length) ra.push({ ic: IC.cup, mau: '#f5b93b', ten: 'Vượt ngưỡng', chu: vuot.map((x) => `${x.p.ten} ${so(x.t.phan_tram)}%`).join(' · '), phu: `${vuot.length}/${ds.length} người đạt` });
  const nhieu = [...ds].sort((a, b) => b.t.viec.length - a.t.viec.length)[0];
  if (nhieu?.t.viec.length) ra.push({ ic: IC.the, mau: MAU[nhieu.p.ma], ten: 'Nhiều thẻ nhất', chu: `${nhieu.p.ten} — ${nhieu.t.viec.length} thẻ xong`, phu: 'đếm thẻ đã hoàn tất trong tháng' });
  const nang = ds.flatMap((x) => x.t.viec.map((v) => ({ ...v, ai: x.p }))).sort((a, b) => b.diem - a.diem)[0];
  if (nang) ra.push({ ic: IC.ten_lua, mau: MAU[nang.ai.ma], ten: 'Thẻ nặng ký nhất', chu: `${nang.ai.ten} — ${so(nang.diem, 2)} điểm`, phu: nang.ten.slice(0, 70) });
  const bt = [...ds].sort((a, b) => b.t.bao_tri.length - a.t.bao_tri.length)[0];
  if (bt?.t.bao_tri.length) ra.push({ ic: IC.co_le, mau: MAU[bt.p.ma], ten: 'Chăm đi bảo trì', chu: `${bt.p.ten} — ${bt.t.bao_tri.length} ca`, phu: 'thẻ board Bảo trì đã xong' });
  if (i > 0) {
    const tb = ds.map((x) => ({ ...x, tang: x.t.phan_tram - (x.tr?.phan_tram || 0) })).sort((a, b) => b.tang - a.tang)[0];
    if (tb.tang > 0) ra.push({ ic: IC.len, mau: MAU[tb.p.ma], ten: 'Tiến bộ nhất', chu: `${tb.p.ten} +${so(tb.tang)} điểm %`, phu: `so với ${tenThang(d.thang[i - 1]).toLowerCase()}` });
  }
  const ch = ds.map((x) => ({ ...x, c: chuoiNgay(x.t.viec) })).sort((a, b) => b.c - a.c)[0];
  if (ch?.c > 1) ra.push({ ic: IC.lua, mau: MAU[ch.p.ma], ten: 'Chuỗi ngày dài nhất', chu: `${ch.p.ten} — ${ch.c} ngày liền`, phu: 'ngày liên tiếp có thẻ xong' });
  const da = ds.map((x) => ({ ...x, n: new Set(x.t.viec.map((v) => v.board)).size })).sort((a, b) => b.n - a.n)[0];
  if (da?.n > 1) ra.push({ ic: IC.luoi, mau: MAU[da.p.ma], ten: 'Đa năng', chu: `${da.p.ten} — ${da.n} board`, phu: 'làm việc trên nhiều board nhất' });
  const theoNgay = {};
  ds.forEach((x) => x.t.viec.forEach((v) => { theoNgay[v.ngay] = (theoNgay[v.ngay] || 0) + v.diem; }));
  const ngayDinh = Object.entries(theoNgay).sort((a, b) => b[1] - a[1])[0];
  if (ngayDinh) ra.push({ ic: IC.set, mau: '#6ea8fe', ten: 'Ngày năng suất của tổ', chu: `${ngayVN(ngayDinh[0])} — ${so(ngayDinh[1])} điểm`, phu: 'cộng điểm cả tổ trong một ngày' });
  return ra;
}
function thanhTichNguoi(p, m, i) {
  const t = tThang(p, m), ra = [];
  const moc = [[160, 'Siêu vượt ngưỡng', '#f5b93b'], [140, 'Vượt 140%', '#f5b93b'], [100, 'Đạt ngưỡng', '#3ddc97'], [80, 'Gần ngưỡng (≥ 80%)', '#6ea8fe'], [50, 'Nửa chặng (≥ 50%)', '#9aa3ad']];
  const mc = moc.find(([v]) => t.phan_tram >= v);
  if (mc) ra.push({ ic: IC.cup, mau: mc[2], ten: mc[1], chu: `${so(t.phan_tram)}% ngưỡng`, phu: `${so(t.diem, 2)} / ${so(t.nguong)} điểm` });
  const top = [...t.viec].sort((a, b) => b.diem - a.diem)[0];
  if (top) ra.push({ ic: IC.ten_lua, mau: MAU[p.ma], ten: 'Thẻ lớn nhất', chu: `${so(top.diem, 2)} điểm`, phu: top.ten.slice(0, 70) });
  const c = chuoiNgay(t.viec);
  if (c > 1) ra.push({ ic: IC.lua, mau: '#f5b93b', ten: 'Chuỗi ngày', chu: `${c} ngày liền có thẻ xong`, phu: 'ngày liên tiếp' });
  if (t.bao_tri.length) ra.push({ ic: IC.co_le, mau: MAU[p.ma], ten: 'Bảo trì / lắp đặt', chu: `${t.bao_tri.length} ca`, phu: 'thẻ board Bảo trì đã xong' });
  const nb = new Set(t.viec.map((v) => v.board)).size;
  if (nb > 1) ra.push({ ic: IC.luoi, mau: '#6ea8fe', ten: 'Đa năng', chu: `${nb} board`, phu: 'làm trên nhiều mảng' });
  if (i > 0) {
    const tr = tThang(p, duLieu.thang[i - 1]);
    const tang = t.phan_tram - (tr?.phan_tram || 0);
    ra.push({ ic: tang >= 0 ? IC.len : IC.xuong, mau: tang >= 0 ? '#3ddc97' : '#f5b93b', ten: tang >= 0 ? 'Đi lên' : 'Đi xuống', chu: `${tang >= 0 ? '+' : ''}${so(tang)} điểm %`, phu: `so với ${tenThang(duLieu.thang[i - 1]).toLowerCase()}` });
  }
  return ra;
}

// ---------------- Mảnh giao diện ----------------
function vong(pt, mau = '#3ddc97', k = 'v') {
  const r = 52, cv = 2 * Math.PI * r, p = Math.min(pt, 200) / 100;
  const dau = cv * (1 - Math.min(p, 1));
  const vuot = p > 1 ? `<circle cx="60" cy="60" r="${r - 12}" fill="none" stroke="#f5b93b" stroke-width="6" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * (r - 12)}" stroke-dashoffset="${2 * Math.PI * (r - 12) * (1 - Math.min(p - 1, 1))}" class="chay"/>` : '';
  return `<div class="vong-wrap ${H.vao(120)}" data-k="${k}-vong">
    <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" fill="none" stroke-width="10" class="nen-vong"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="${mau}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${cv}" stroke-dashoffset="${cv}" data-den="${dau}" class="chay"/>${vuot}
    <g class="kim hl-tho" style="transform-origin:60px 60px"><circle cx="${60 + r * Math.cos(2 * Math.PI * Math.min(p, 1))}" cy="${60 + r * Math.sin(2 * Math.PI * Math.min(p, 1))}" r="4" fill="#eceef0"/></g></svg>
    <div class="vong-giua"><div><b class="so" data-dem="${pt}" data-sau="%">${so(pt)}%</b><span>của ngưỡng</span></div></div></div>`;
}
function bullet(pt, mau) {
  const max = Math.max(100, Math.min(200, Math.ceil(pt / 20) * 20 + 10));
  const rong = Math.min(pt, max) / max, moc = 100 / max;
  return `<div class="bullet" title="${so(pt)}% ngưỡng"><i class="dat ${pt >= 100 ? 'soc' : ''}" style="background:${mau};width:100%;transform:scaleX(0)" data-scale="${rong}"></i><i class="moc ${pt >= 100 ? 'hl-dap' : ''}" style="left:${moc * 100}%"></i><span class="nhan-moc" style="left:${moc * 100}%">100%</span></div>`;
}
const oSo = (k, gt, nhan, ic, opt = {}) => `<div class="o ${H.vao()} ${H.re()}" data-k="${k}" data-nghieng><i class="den-roi"></i><span class="icon ${H.lap()}">${ic}</span><b class="so" data-dem="${gt}" data-so="${opt.so ?? 1}" ${opt.tien ? 'data-tien' : ''}>${opt.tien ? tien(gt) : so(gt, opt.so ?? 1)}</b><span>${nhan}</span></div>`;
const tieuDe = (ic, t, phu = '') => `<h2><span class="${H.lap()}" style="display:inline-block;width:22px;height:22px;color:var(--mo)">${ic}</span>${t}${phu ? `<small>${phu}</small>` : ''}</h2>`;
const trangTri = (n = 15) => `<div class="trang-tri" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<span class="${H.lap(i * 120)}">${I(TRANG_TRI[i % TRANG_TRI.length])}</span>`).join('')}</div>`;
function huyHieu(ds, kp) {
  if (!ds.length) return '<p class="rong">Chưa có thành tích trong tháng này.</p>';
  return `<div class="tich">${ds.map((h, i) => `<div class="huy ${H.vao(i * 60)} ${H.re()}" data-k="${kp}-h${i}" data-sao><div class="bieu ${H.lap()}" style="color:${h.mau}">${h.ic}</div><div><b>${esc(h.ten)}</b><span>${esc(h.chu)}</span><small>${esc(h.phu)}</small></div></div>`).join('')}</div>`;
}
function bieuDoCot(nhom, chuoi) { // nhom: [{nhan, gia:[{ma, gt, mau}]}]
  const max = Math.max(1, ...nhom.flatMap((g) => g.gia.map((x) => x.gt)));
  return `<div class="bieu-do ${H.vao()}" data-k="bd"><div class="cot-khu">${nhom.map((g, gi) => `<div class="nhom-cot"><div class="cot-hang">${g.gia.map((x, i) => `<div class="cot" style="height:${Math.max(2, (x.gt / max) * 100)}%;background:${x.mau};transform:scaleY(0)" data-tre="${gi * 120 + i * 60}" title="${esc(x.ten)}: ${so(x.gt)}"><span class="gt">${so(x.gt, 0)}</span></div>`).join('')}</div><div class="nhan-cot">${g.nhan}</div></div>`).join('')}</div>
    <p class="chu-giai">${chuoi.map((c) => `<span><i style="background:${c.mau}"></i>${c.ten}</span>`).join('')}</p></div>`;
}
function lichNhiet(m, viec, kp) {
  const [y, t] = m.split('-').map(Number);
  const so_ngay = new Date(y, t, 0).getDate(), dau = (new Date(y, t - 1, 1).getDay() + 6) % 7;
  const dem = {}; viec.forEach((v) => { dem[v.ngay] = (dem[v.ngay] || 0) + v.diem; });
  const max = Math.max(1, ...Object.values(dem));
  const o = [];
  for (let i = 0; i < dau; i++) o.push('<i class="ngay trong"></i>');
  for (let n = 1; n <= so_ngay; n++) {
    const k = `${m}-${String(n).padStart(2, '0')}`, v = dem[k] || 0;
    const c = v ? Math.min(4, 1 + Math.floor((v / max) * 3.999)) : 0;
    o.push(`<i class="ngay ${c ? 'c' + c : ''} ${H.re()} ${H.vao(n * 18)}" title="${ngayVN(k)}: ${so(v)} điểm">${n}</i>`);
  }
  return `<div data-k="${kp}-lich"><div class="lich-dau">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x) => `<span>${x}</span>`).join('')}</div><div class="lich">${o.join('')}</div></div>`;
}
const dongThe = (x, i, mau) => `<a class="dong ${i < 12 ? H.vao(i * 35) : ''} ${H.re()}" data-k="t-${esc(x.link)}" href="${esc(x.link)}" target="_blank" rel="noopener">
  <span class="ngay-the">${ngayVN(x.ngay)}${(Date.now() - new Date(x.ngay)) < 2 * 864e5 ? ' <i class="moi hl-phat"></i>' : ''}</span>
  <span class="ten-the"><b>${mau ? `<i class="cham-nho" style="background:${mau}"></i>` : ''}${esc(x.ten)}</b><span>${esc(x.board)} · ${esc(x.list)}${x.nguon_gio ? ' · ' + esc(String(x.nguon_gio).startsWith('cong-doan-chua-dinh-muc') ? 'chưa có định mức công đoạn' : x.nguon_gio) : ''}</span></span>
  <span class="diem-the">${so(x.diem, 2)}<small>${so(x.gio ?? x.gio_thuc, 2)} giờ</small></span></a>`;

// ---------------- Trang Home ----------------
function veHome() {
  const d = duLieu, m = d.thang[thangI], T = d.to[thangI];
  const ds = d.nguoi.map((p) => ({ p, t: tThang(p, m) })).sort((a, b) => b.t.phan_tram - a.t.phan_tram);
  const hangTruoc = thangI > 0 ? d.nguoi.map((p) => ({ ma: p.ma, pt: tThang(p, d.thang[thangI - 1]).phan_tram })).sort((a, b) => b.pt - a.pt).map((x) => x.ma) : null;
  const tatCa = ds.flatMap((x) => x.t.viec.map((v) => ({ ...v, ai: x.p }))).sort((a, b) => b.diem - a.diem);
  return `
  <section class="hero ${H.vao()}" data-k="h-hero"><i class="luoi-nen" aria-hidden="true"></i>
    <div><p class="nhan"><span class="go-may" data-go="${tenThang(m)} · Tổ điện · ${d.nguoi.length} người"></span><span class="hl-con-tro">▍</span></p>
      <h1><span class="so" data-dem="${T.diem}">${so(T.diem)}</span><small>/ ${so(T.nguong)} điểm</small></h1>
      <p class="than">${T.dat_nguong}/${d.nguoi.length} người đạt ngưỡng · ${T.so_the} thẻ xong · tiền điểm cả tổ <b class="so" data-dem="${T.tien}" data-tien>${tien(T.tien)}</b></p>
      ${trangTri(30)}</div>
    ${vong(T.phan_tram, '#3ddc97', 'home')}
  </section>
  <div class="o-so">
    ${oSo('h-o1', T.diem, 'Điểm cả tổ', IC.set)}${oSo('h-o2', T.so_the, 'Thẻ đã xong', IC.the, { so: 0 })}
    ${oSo('h-o3', T.gio, 'Giờ quy đổi', IC.gio)}${oSo('h-o4', T.tien, 'Tiền điểm cả tổ', IC.tien, { tien: true })}
  </div>

  <section class="vung" data-lo data-k="h-bxh">${tieuDe(IC.cup, 'Bảng xếp hạng', 'theo % ngưỡng')}
    <p class="mo-ta">Vạch trắng là ngưỡng (100%). Bấm một người để xem chi tiết.</p>
    <div class="bxh" id="bxh">${ds.map((x, i) => {
      const tr = hangTruoc ? hangTruoc.indexOf(x.p.ma) - i : 0;
      return `<a class="hang ${H.vao(i * 80)} ${H.re()}" href="#${x.p.ma}" data-k="h-hang-${x.p.ma}" data-ma="${x.p.ma}" data-nghieng><i class="den-roi"></i>
        <span class="vi-tri ${i < 3 ? 'h' + (i + 1) : ''}">${i === 0 ? `<span class="mien hl-noi">${IC.mien}</span>` : ''}${i + 1}</span>
        <span class="ten"><b><i class="cham-nho" style="background:${MAU[x.p.ma]}"></i>${esc(x.p.ten)} ${tr ? `<em class="doi-hang ${tr > 0 ? 'xanh' : 'vang'} hl-nhay">${tr > 0 ? IC.len : IC.xuong}${Math.abs(tr)}</em>` : ''}</b><span>${esc(x.p.ngach)}–${esc(x.p.bac)} · ${x.t.viec.length} thẻ</span></span>
        ${bullet(x.t.phan_tram, MAU[x.p.ma])}
        <span class="phai"><b class="so">${so(x.t.phan_tram)}%</b><span>${so(x.t.diem)} / ${so(x.t.nguong)}</span></span></a>`;
    }).join('')}</div></section>

  <section class="vung" data-lo data-k="h-tich">${tieuDe(IC.huy, 'Thành tích tổ điện', tenThang(m))}${huyHieu(thanhTichTo(m, thangI), 'h')}</section>

  <section class="vung" data-lo data-k="h-bd">${tieuDe(IC.cot, 'Điểm từng người qua các tháng')}
    ${bieuDoCot(d.thang.map((mm) => ({ nhan: 'T' + Number(mm.slice(5)), gia: d.nguoi.map((p) => ({ ma: p.ma, ten: p.ten, gt: tThang(p, mm).diem, mau: MAU[p.ma] })) })), d.nguoi.map((p) => ({ ten: p.ten, mau: MAU[p.ma] })))}</section>

  <section class="vung" data-lo data-k="h-lich">${tieuDe(IC.lich, 'Lịch điểm của tổ', 'đậm = nhiều điểm')}${lichNhiet(m, ds.flatMap((x) => x.t.viec), 'h')}</section>

  <section class="vung" data-lo data-k="h-top">${tieuDe(IC.sao, 'Top 10 thẻ điểm cao', tenThang(m))}
    <div class="ds">${tatCa.slice(0, 10).map((x, i) => dongThe(x, i, MAU[x.ai.ma])).join('') || '<p class="rong">Chưa có thẻ xong.</p>'}</div></section>`;
}

// ---------------- Trang 1 người ----------------
function veNguoi(p) {
  const d = duLieu, m = d.thang[thangI], t = tThang(p, m), ps = d.tham_so;
  const tru = Math.min((t.gio_quan_ly || 0) * Math.min(ps.he_so_quan_ly_K, 1), 96);
  const boards = [...new Set(t.viec.map((x) => x.board))];
  const chon = loc[p.ma] && boards.includes(loc[p.ma]) ? loc[p.ma] : '';
  const ds = [...t.viec].filter((x) => !chon || x.board === chon).sort((a, b) => b.ngay.localeCompare(a.ngay));
  const n = moRong[p.ma] || 30;
  return `
  <section class="hero ${H.vao()}" data-k="${p.ma}-hero" style="--mau:${MAU[p.ma]}"><i class="luoi-nen" aria-hidden="true"></i>
    <div><p class="nhan"><span class="go-may" data-go="${tenThang(m)} · ${p.vi_tri} · ngạch ${p.ngach} – ${p.bac}"></span><span class="hl-con-tro">▍</span></p>
      <h1><span class="so" data-dem="${t.diem}" data-so="2">${so(t.diem, 2)}</span><small>/ ${so(t.nguong)} điểm</small></h1>
      <p class="than">${esc(p.ho_ten)} · tiền điểm ước tính <b class="so" data-dem="${t.tien.tong}" data-tien>${tien(t.tien.tong)}</b>${t.tien.vuot ? ` (gồm ${tien(t.tien.vuot)} vượt ngưỡng)` : ''}${t.thieu_gio.length ? ` · <span class="vang">${t.thieu_gio.length} thẻ đã xong chưa tính được điểm</span>` : ''}</p>
      ${trangTri(12)}</div>
    ${vong(t.phan_tram, MAU[p.ma], p.ma)}
  </section>
  <div class="o-so">
    ${oSo(p.ma + '-o1', t.diem_viec, 'Điểm việc', IC.set, { so: 2 })}${oSo(p.ma + '-o2', t.viec.length, 'Thẻ đã xong', IC.the, { so: 0 })}
    ${oSo(p.ma + '-o3', t.gio, 'Giờ quy đổi', IC.gio)}${oSo(p.ma + '-o4', t.dang_lam || 0, 'Thẻ đang làm', IC.dich, { so: 0 })}
  </div>
  <section class="vung" data-lo data-k="${p.ma}-bl">${tieuDe(IC.dich, 'So với ngưỡng')}<div style="padding-top:26px">${bullet(t.phan_tram, MAU[p.ma])}</div></section>
  <section class="vung" data-lo data-k="${p.ma}-tich">${tieuDe(IC.huy, 'Thành tích', tenThang(m))}${huyHieu(thanhTichNguoi(p, m, thangI), p.ma)}</section>
  <section class="vung" data-lo data-k="${p.ma}-bd">${tieuDe(IC.cot, 'Điểm và ngưỡng qua các tháng')}
    ${bieuDoCot(d.thang.map((mm) => { const x = tThang(p, mm); return { nhan: 'T' + Number(mm.slice(5)), gia: [{ ten: 'Điểm', gt: x.diem, mau: MAU[p.ma] }, { ten: 'Ngưỡng', gt: x.nguong, mau: '#4a515b' }] }; }), [{ ten: 'Điểm', mau: MAU[p.ma] }, { ten: 'Ngưỡng', mau: '#4a515b' }])}</section>
  <section class="vung" data-lo data-k="${p.ma}-lich">${tieuDe(IC.lich, 'Lịch điểm', 'đậm = nhiều điểm')}${lichNhiet(m, t.viec, p.ma)}</section>
  <section class="vung" data-lo data-k="${p.ma}-the">${tieuDe(IC.the, 'Thẻ đã xong', `${ds.length} thẻ`)}
    ${boards.length > 1 ? `<div class="loc" data-ma="${p.ma}"><button type="button" data-b="" aria-pressed="${!chon}">Tất cả</button>${boards.map((b) => `<button type="button" data-b="${esc(b)}" aria-pressed="${chon === b}">${esc(b)}</button>`).join('')}</div>` : ''}
    <div class="ds">${ds.slice(0, n).map((x, i) => dongThe(x, i)).join('') || '<p class="rong hl-noi">Chưa có thẻ xong trong tháng.</p>'}</div>
    ${ds.length > n ? `<button class="them" type="button" data-them="${p.ma}">Xem thêm ${Math.min(30, ds.length - n)} thẻ</button>` : ''}</section>
  ${t.thieu_gio.length ? `<section class="vung" data-lo data-k="${p.ma}-thieu">${tieuDe(IC.gio, 'Thẻ đã xong nhưng chưa tính được điểm', `${t.thieu_gio.length} thẻ`)}
    <p class="mo-ta">Phần lớn là thẻ công đoạn máy chưa có định mức (mẫu công đoạn mới, OQC/QC) — bảng định mức hiện chỉ có máy rang 30 kg, tách đá, silo 500 kg lấy từ bảng chấm chính thức T10. Có định mức hoặc điền GIỜ ƯỚC trên Trello là được tính; điểm thật sẽ cao hơn số ở trên.</p>
    <div class="ds">${t.thieu_gio.map((x, i) => dongThe({ ...x, diem: 0 }, i)).join('')}</div></section>` : ''}
  <section class="vung" data-lo data-k="${p.ma}-ct">${tieuDe(IC.luoi, 'Cách tính')}
    <div class="cong-thuc">
      <div><span>Điểm việc = giờ thẻ (GIỜ ƯỚC, không có thì định mức loại thẻ) ÷ số người × ${ps.he_so_gio_sang_diem}</span><b>${so(t.diem_viec, 2)}</b></div>
      ${t.diem_may ? `<div><span>Điểm máy (tick dòng việc list dự án — cách cũ)</span><b>${so(t.diem_may, 2)}</b></div>` : ''}
      <div><span>Ngưỡng = (${ps.gio_chuan_thang} − ${so(tru)} giờ QL) × ${ps.ty_le_gio_san_xuat} × ${ps.he_so_gio_sang_diem} × ${p.he_so_bac} (bậc ${p.bac}) × ${p.he_so_ngach} (ngạch ${p.ngach})</span><b>${so(t.nguong)}</b></div>
      <div><span>Tiền tới ngưỡng = MIN(điểm; ngưỡng) × ${tien(ps.don_gia_diem)}</span><b>${tien(t.tien.toi_nguong)}</b></div>
      <div><span>Tiền vượt ngưỡng (đến 140% × 205%, 140–160% × 275%, trên 160% × 300%)</span><b>${tien(t.tien.vuot)}</b></div>
    </div></section>`;
}

// ---------------- Vẽ + giữ vị trí ----------------
function neo() { // phần tử [data-k] đầu tiên còn thấy dưới thanh đầu trang
  const cao = $('#dau').getBoundingClientRect().bottom;
  for (const el of document.querySelectorAll('#noi-dung [data-k]')) {
    const r = el.getBoundingClientRect();
    if (r.bottom > cao + 4) return { k: el.dataset.k, top: r.top };
  }
  return null;
}
function ve({ vao = false, giu = false, huong = 0 } = {}) {
  const nd = $('#noi-dung');
  const n = giu ? neo() : null;
  const y = scrollY;
  H.datLai(THU_TU.indexOf(view));
  const p = duLieu.nguoi.find((x) => x.ma === view);
  nd.classList.toggle('khong-vao', !vao);
  nd.innerHTML = (p ? veNguoi(p) : veHome()) + chan();
  danhDauTab();
  document.querySelectorAll('#chon-thang button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === thangI)));
  if (giu) {
    if (n) {
      const el = nd.querySelector(`[data-k="${CSS.escape(n.k)}"]`);
      if (el) scrollTo(0, scrollY + el.getBoundingClientRect().top - n.top);
      else scrollTo(0, y);
    } else scrollTo(0, y);
  }
  if (huong && H.batHieuUng()) { nd.classList.remove('vao-trai', 'vao-phai'); void nd.offsetWidth; nd.classList.add(huong > 0 ? 'vao-phai' : 'vao-trai'); }
  chayDuLieu(nd, { vao, giu });
  H.theoDoi(nd);
}
function chayDuLieu(nd, { vao, giu }) {
  const moi = new Map();
  nd.querySelectorAll('[data-dem]').forEach((el, i) => {
    const den = Number(el.dataset.dem), key = (el.closest('[data-k]')?.dataset.k || '') + ':' + i;
    moi.set(key, den);
    const cu = soCu.get(key);
    const opt = { so: Number(el.dataset.so ?? 1), sau: el.dataset.sau || '' };
    if (el.hasAttribute('data-tien')) { opt.so = 0; opt.sau = ' đ'; }
    if (giu) {
      if (cu !== undefined && cu !== den) { el.dataset.cu = cu; H.demSo(el, den, opt); el.classList.remove('chop'); void el.offsetWidth; el.classList.add('chop'); }
    } else { el.dataset.cu = 0; H.demSo(el, den, { ...opt, tg: vao ? 1200 : 700 }); }
  });
  soCu = moi;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    nd.querySelectorAll('circle.chay[data-den]').forEach((c) => { c.style.strokeDashoffset = c.dataset.den; });
    nd.querySelectorAll('.bullet .dat').forEach((b, i) => { b.style.transitionDelay = (giu ? 0 : 200 + i * 90) + 'ms'; b.style.transform = `scaleX(${b.dataset.scale})`; });
    nd.querySelectorAll('.cot').forEach((c) => { c.style.transition = `transform .8s var(--nay) ${giu ? 0 : c.dataset.tre}ms`; c.style.transform = 'scaleY(1)'; });
    nd.querySelectorAll('.go-may').forEach((el) => (giu ? (el.textContent = el.dataset.go) : H.goMay(el, el.dataset.go)));
  }));
}
function chan() {
  const n = H.DANH_MUC.length;
  const nhom = {};
  H.DANH_MUC.forEach((x) => { (nhom[x.nhom] ||= []).push(x.ten); });
  return `<footer class="chan" data-k="chan"><span>Cập nhật ${esc(duLieu.cap_nhat)} · tự kéo từ Trello lúc 20:00 · web tự kiểm số mới mỗi 5 phút</span>
    <details class="ds-hu"><summary><span class="hl-ngoi-sao" style="display:inline-block">✦</span> ${n} hiệu ứng</summary>
    ${Object.entries(nhom).map(([k, v]) => `<p><b>${k} (${v.length}):</b> ${v.join(' · ')}</p>`).join('')}</details></footer>`;
}

// ---------------- Tự kiểm số liệu mới ----------------
let dangKiem = false;
async function kiemMoi() {
  if (!duLieu || !khoaRaw || dangKiem || document.hidden) return;
  dangKiem = true;
  $('.logo-vong')?.classList.add('hl-vong-xoay');
  try {
    const goi = await taiGoi(true);
    if (goi.ct === goiMaHoa.ct) return;
    if (goi.salt !== goiMaHoa.salt) { H.bao('Mật khẩu đã đổi — mở lại bằng mật khẩu mới.'); return; }
    const d = await moBangKhoa(khoaRaw, goi);
    if (!d || !d.nguoi) return;
    goiMaHoa = goi; duLieu = d;
    if (thangI >= d.thang.length) thangI = d.thang.length - 1;
    dungThang();
    ve({ giu: true });
    H.bao('Đã cập nhật số liệu lúc ' + d.cap_nhat);
  } catch { /* mạng chập chờn: lần sau thử lại */ } finally {
    dangKiem = false;
    setTimeout(() => $('.logo-vong')?.classList.remove('hl-vong-xoay'), 600);
  }
}

// ---------------- Sự kiện ----------------
function doiView(moi) {
  if (!duLieu || moi === view) return;
  cuon[view] = scrollY;
  const huong = THU_TU.indexOf(moi) - THU_TU.indexOf(view);
  view = moi;
  ve({ vao: true, huong });
  scrollTo(0, cuon[moi] || 0);
}
addEventListener('hashchange', () => { const v = location.hash.slice(1); if (THU_TU.includes(v)) doiView(v); });
document.addEventListener('click', (e) => {
  H.gonSong(e);
  const b = e.target.closest('#chon-thang button');
  if (b) {
    const cu = thangI; thangI = Number(b.dataset.i);
    if (cu !== thangI) {
      const truoc = new Map([...document.querySelectorAll('#bxh .hang')].map((h) => [h.dataset.ma, h.getBoundingClientRect().top]));
      ve({ giu: true });
      document.querySelectorAll('#bxh .hang').forEach((h) => { // xếp hạng đổi chỗ mượt (FLIP)
        const t0 = truoc.get(h.dataset.ma); if (t0 === undefined || !H.batHieuUng()) return;
        const dy = t0 - h.getBoundingClientRect().top; if (!dy) return;
        h.style.transition = 'none'; h.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => { h.style.transition = 'transform .6s var(--nay)'; h.style.transform = ''; });
      });
      if (view === 'home' && duLieu.to[thangI].phan_tram >= 100) H.phaoGiay(innerWidth / 2, innerHeight / 3, 60, 'hoa');
    }
    return;
  }
  const l = e.target.closest('.loc button');
  if (l) { loc[l.parentElement.dataset.ma] = l.dataset.b; moRong[l.parentElement.dataset.ma] = 30; ve({ giu: true }); return; }
  const t = e.target.closest('[data-them]');
  if (t) { moRong[t.dataset.them] = (moRong[t.dataset.them] || 30) + 30; ve({ giu: true }); return; }
  const h = e.target.closest('[data-sao]');
  if (h) { const r = h.getBoundingClientRect(); H.phaoGiay(r.left + 30, r.top + 30, 18, 'hoa'); }
});
document.addEventListener('mouseover', (e) => {
  const h = e.target.closest('[data-sao]');
  if (h && !h.dataset.daNo && H.batHieuUng()) { h.dataset.daNo = 1; const r = h.getBoundingClientRect(); H.phaoGiay(r.left + 34, r.top + 34, 12, 'hoa'); }
});
$('#form-mo').addEventListener('submit', (e) => { e.preventDefault(); thuMo(true); });
$('#mat-khau').addEventListener('input', (e) => { $('#bao').textContent = ''; if (e.target.value.trim().length >= DO_DAI) thuMo(false); });
$('#nut-khoa').addEventListener('click', () => {
  quenKhoa(); duLieu = null; khoaRaw = null; goiMaHoa = null;
  document.body.classList.remove('da-mo');
  $('#noi-dung').innerHTML = ''; $('#noi-dung').hidden = true;
  ['#tab', '#tab-duoi', '#cong-cu'].forEach((s) => { $(s).hidden = true; });
  $('#man-khoa').hidden = false; $('.khoa-icon')?.classList.remove('mo-quai');
  scrollTo(0, 0); $('#mat-khau').focus();
});
function datHieuUng(bat) {
  document.documentElement.classList.toggle('hu-tat', !bat);
  $('#nut-hu').setAttribute('aria-pressed', String(bat));
  try { localStorage.setItem(HU_NHO, bat ? '1' : '0'); } catch { /* bỏ qua */ }
}
$('#nut-hu').addEventListener('click', () => {
  const bat = !H.batHieuUng(); datHieuUng(bat);
  $('#nut-hu svg').classList.remove('hv-xoay-3d'); void $('#nut-hu svg').offsetWidth; $('#nut-hu svg').classList.add('hv-xoay-3d');
  H.bao(bat ? 'Đã bật hiệu ứng' : 'Đã tắt hiệu ứng — số liệu hiện ngay');
});
$('#nut-pdf').addEventListener('click', () => {
  if (!duLieu?.nguoi) return;
  xuatPDF({ d: duLieu, i: thangI, view, MAU, thanhTichTo, thanhTichNguoi });
  H.bao(view === 'home' ? 'Đang mở bản in cả tổ — chọn "Lưu thành PDF"' : 'Đang mở bản in — chọn "Lưu thành PDF"');
});
$('#len-dau').addEventListener('click', () => scrollTo({ top: 0, behavior: H.batHieuUng() ? 'smooth' : 'auto' }));
document.addEventListener('visibilitychange', () => { if (!document.hidden) kiemMoi(); });
let choCuon = null;
addEventListener('scroll', () => {
  if (choCuon) return;
  choCuon = requestAnimationFrame(() => {
    choCuon = null;
    const max = document.documentElement.scrollHeight - innerHeight;
    $('#thanh-cuon').style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    $('#dau').classList.toggle('nho', scrollY > 40);
    $('#len-dau').classList.toggle('hien', scrollY > 600);
  });
}, { passive: true });

// ---------------- Khởi động ----------------
history.scrollRestoration = 'manual';
H.napCss();
try { datHieuUng(localStorage.getItem(HU_NHO) !== '0'); } catch { datHieuUng(true); }
H.hatNen($('#nen-hat'));
H.theoChuot();
tuMo().catch((e) => {
  $('#bao').textContent = e.message.startsWith('Chưa có') ? 'Chưa có số liệu. Mật khẩu được đặt trên máy tính (chạy bat-dau.ps1), web chỉ dùng để mở.' : e.message;
});
