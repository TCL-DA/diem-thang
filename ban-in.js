// Bản in A4 có màu (Xuất PDF): dựng trang báo cáo riêng vào #ban-in rồi gọi hộp in của trình duyệt -> "Lưu thành PDF".
// Không dùng thư viện PDF: chữ vẫn là chữ thật (chọn/tìm được), font Fira Sans có dấu tiếng Việt, xuống dòng bằng CSS
// (text-wrap: pretty/balance) + dấu cách không ngắt (U+00A0) cho số–đơn vị, cụm ngắn trong ngoặc, hai từ cuối câu.

const NB = ' ';
const MAU_IN = { thanh: '#14935f', sy: '#2f6fd6', nam: '#c27c0e', sang: '#8e4ec6' }; // đậm hơn bản web để in giấy trắng
const DON_VI = 'kg|g|giờ|điểm|ngày|người|thẻ|ca|dòng|m|mm|cm|kW|kVA|KVA|đ|%|lần|tấm|cái|bồn|phút|tháng|board';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const so = (n, f = 1) => Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: f });
const tien = (n) => Number(n || 0).toLocaleString('vi-VN') + NB + 'đ';
const tenThang = (m) => { const [y, t] = m.split('-'); return `Tháng${NB}${Number(t)}/${y}`; };
const ngayVN = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) : '');
const boDau = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

/** Chữ an toàn + chống ngắt dòng xấu (mồ côi, ngoặc cắt, số tách đơn vị). */
const MO = '\u0001', DONG = '\u0002'; // đánh dấu cụm cấm ngắt (kể cả sau dấu gạch nối "SERI-") -> <span class="nb">
function ng(s) {
  let t = esc(String(s ?? '').replace(/\s+/g, ' ').trim());
  t = t.replace(/\(([^()]{1,34})\)/g, (all, x) => (x.trim().split(/\s+/).length <= 5 ? `${MO}(${x.replace(/ /g, NB)})${DONG}` : all));
  t = t.replace(new RegExp(`(\\d[\\d.,]*)\\s+(${DON_VI})(?=[\\s,.;:)/${DONG}]|$)`, 'g'), `$1${NB}$2`);
  t = t.replace(/(số|án|đoạn|tuần|Tuần|seri|SERI|máy|Máy|MIN|×|−|=)\s+(\S)/g, `$1${NB}$2`);
  t = t.replace(/\s+([-–])\s+/g, `${NB}$1 `);                        // "1 - LẮP" : gạch đi theo chữ trước
  // Chống mồ côi: dính các từ cuối tới khi cụm cuối > 14 ký tự (tối đa 4 từ) -> dòng cuối không bao giờ là 1 từ / cụm ngắn.
  const w = t.split(' '), dai = (a) => a.join(' ').replace(/&[a-z#0-9]+;|[\u0001\u0002]/g, 'x').length;
  if (w.length >= 2) {
    let k = 2;
    while (k < w.length && k < 4 && dai(w.slice(-k)) <= 14) k++;
    t = w.slice(0, -k).concat(w.slice(-k).join(NB)).join(' ');
  }
  return t.replace(/\u0001/g, '<span class="nb">').replace(/\u0002/g, '</span>');
}

function nguon(x) {
  const s = String(x || '');
  if (!s) return '—';
  if (s.startsWith('cong-doan-chua-dinh-muc')) return 'Chưa có định mức';
  if (s.startsWith('QC tìm lỗi')) return s.includes('thẩm mỹ') ? 'QC · thẩm mỹ' : 'QC · kỹ thuật';
  if (s.startsWith('GIỜ ƯỚC')) return s.includes('bảo trì') ? 'GIỜ ƯỚC · bảo trì' : 'GIỜ ƯỚC';
  let m = s.match(/^ƯỚC [^:]+: (\d+) dòng × ([\d.]+) giờ/);
  if (m) return `ƯỚC · ${m[1]} dòng × ${m[2].replace('.', ',')}${NB}giờ`;
  m = s.match(/^1 giờ\/dòng checklist \((\d+) dòng/);
  if (m) return `1 giờ/dòng · ${m[1]}${NB}dòng`;
  if (s.startsWith('định mức công đoạn')) return 'Định mức · ' + s.slice(19);
  if (s === 'định mức theo loại thẻ') return 'Định mức loại thẻ';
  if (s.startsWith('bảo trì 8')) return 'Bảo trì · 8 giờ/ngày';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const thanh = (pt, mau) => {
  const max = Math.max(120, Math.min(200, Math.ceil((pt + 5) / 20) * 20)); // vạch 100% không dính mép phải
  return `<div class="bi-thanh"><i style="width:${(Math.min(pt, max) / max) * 100}%;background:${mau}"></i><b style="left:${(100 / max) * 100}%"></b><span style="left:${(100 / max) * 100}%">100%</span></div>`;
};
const oSo = (gt, nhan, mau) => `<div class="bi-o" style="--m:${mau}"><b>${gt}</b><span>${nhan}</span></div>`;
const tieuDe = (t, phu = '') => `<h3>${ng(t)}${phu ? `<small>${ng(phu)}</small>` : ''}</h3>`;

function dauTrang(tieu, phu, dong3, mau) {
  return `<header class="bi-dau" style="background:${mau}"><div><p>${ng(phu)}</p><h2>${ng(tieu)}</h2><p>${dong3}</p></div>
    <div class="bi-logo">O&nbsp;TESLA<small>Tổ điện</small></div></header>`;
}

function lich(m, viec, mau) {
  const [y, t] = m.split('-').map(Number);
  const soNgay = new Date(y, t, 0).getDate(), dau = (new Date(y, t - 1, 1).getDay() + 6) % 7;
  const dem = {}; viec.forEach((v) => { dem[v.ngay] = (dem[v.ngay] || 0) + v.diem; });
  const max = Math.max(1, ...Object.values(dem));
  const o = Array.from({ length: dau }, () => '<i></i>');
  for (let n = 1; n <= soNgay; n++) {
    const v = dem[`${m}-${String(n).padStart(2, '0')}`] || 0;
    const a = v ? 0.18 + 0.82 * (v / max) : 0;
    o.push(`<i class="${v ? 'co' : ''}" style="${v ? `background:color-mix(in srgb, ${mau} ${Math.round(a * 100)}%, white);${a > 0.55 ? 'color:#fff' : ''}` : ''}">${n}${v ? `<small>${so(v, 0)}</small>` : ''}</i>`);
  }
  return `<div class="bi-lich">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x) => `<span>${x}</span>`).join('')}${o.join('')}</div>`;
}

const tich = (ds) => (ds.length ? `<ul class="bi-tich">${ds.map((h) => `<li><i style="background:${h.mau}"></i><div><b>${ng(h.ten)}</b><span>${ng(h.chu)}</span><small>${ng(h.phu)}</small></div></li>`).join('')}</ul>` : '<p class="bi-rong">Chưa có thành tích.</p>');

function bangThe(ds, { ai = null, tieuDiem = true } = {}) {
  return `<table class="bi-bang the"><colgroup><col style="width:5%"><col style="width:8%"><col><col style="width:21%"><col style="width:8%"><col style="width:9%"></colgroup>
    <thead><tr><th>#</th><th>Ngày</th><th>Thẻ việc</th><th>Nguồn giờ</th><th class="bi-so">Giờ</th><th class="bi-so">${tieuDiem ? 'Điểm' : ''}</th></tr></thead><tbody>
    ${ds.map((x, i) => `<tr><td class="bi-mo">${i + 1}</td><td>${ngayVN(x.ngay)}</td>
      <td><b>${ai ? `<i class="bi-cham" style="background:${MAU_IN[x.ai.ma]}"></i>` : ''}${ng(x.ten)}</b><span>${ng(x.board)} · ${ng(x.list)}${ai ? ` · ${ng(x.ai.ten)}` : ''}</span></td>
      <td class="nguon">${ng(nguon(x.nguon_gio))}</td><td class="bi-so">${so(x.gio ?? x.gio_thuc, 2)}</td><td class="bi-so"><b>${so(x.diem, 2)}</b></td></tr>`).join('')}
    </tbody></table>`;
}

function theoBoard(viec, mau) {
  const g = {};
  viec.forEach((v) => { const k = v.board || '—'; (g[k] ||= { n: 0, gio: 0, diem: 0 }); g[k].n++; g[k].gio += v.gio || 0; g[k].diem += v.diem; });
  const ds = Object.entries(g).sort((a, b) => b[1].diem - a[1].diem), tong = viec.reduce((s, v) => s + v.diem, 0) || 1;
  return `<table class="bi-bang"><colgroup><col><col style="width:10%"><col style="width:11%"><col style="width:11%"><col style="width:30%"></colgroup>
    <thead><tr><th>Board</th><th class="bi-so">Thẻ</th><th class="bi-so">Giờ</th><th class="bi-so">Điểm</th><th>Tỷ trọng</th></tr></thead><tbody>
    ${ds.map(([b, x]) => `<tr><td><b>${ng(b)}</b></td><td class="bi-so">${x.n}</td><td class="bi-so">${so(x.gio)}</td><td class="bi-so"><b>${so(x.diem, 2)}</b></td>
      <td><div class="bi-ty"><i style="width:${(x.diem / tong) * 100}%;background:${mau}"></i><span>${so((x.diem / tong) * 100, 0)}%</span></div></td></tr>`).join('')}
    </tbody></table>`;
}

function trangNguoi(ctx, p, dauTien) {
  const { d, m, i } = ctx, t = d.nguoi.find((x) => x.ma === p.ma).thang.find((x) => x.thang === m), ps = d.tham_so;
  const mau = MAU_IN[p.ma] || '#334155';
  const tru = Math.min((t.gio_quan_ly || 0) * Math.min(ps.he_so_quan_ly_K, 1), 96);
  const viec = [...t.viec].sort((a, b) => a.ngay.localeCompare(b.ngay) || b.diem - a.diem);
  return `<section class="bi-trang ${dauTien ? '' : 'bi-moi'}">
    ${dauTrang(`${p.ho_ten || p.ten}`, `Báo cáo điểm tháng · ${tenThang(m)}`, `${ng(p.vi_tri || '')} · ngạch${NB}${esc(p.ngach)} – bậc${NB}${esc(p.bac)} · ${esc(p.ma_nv || '')}`, mau)}
    <div class="bi-o4">
      ${oSo(`${so(t.diem, 2)}`, `điểm / ngưỡng ${so(t.nguong)}`, mau)}
      ${oSo(`${so(t.phan_tram)}%`, t.phan_tram >= 100 ? 'đã vượt ngưỡng' : 'của ngưỡng', mau)}
      ${oSo(`${t.viec.length}`, `thẻ đã xong · ${so(t.gio)}${NB}giờ quy đổi`, mau)}
      ${oSo(tien(t.tien.tong), t.tien.vuot ? `gồm ${tien(t.tien.vuot)} vượt ngưỡng` : 'tiền điểm ước tính', mau)}
    </div>
    ${thanh(t.phan_tram, mau)}
    <div class="bi-hai">
      <div>${tieuDe('Thành tích', tenThang(m))}${tich(ctx.thanhTichNguoi(p, m, i).map((h) => ({ ...h, mau })))}</div>
      <div>${tieuDe('Lịch điểm', 'số nhỏ = điểm trong ngày')}${lich(m, t.viec, mau)}</div>
    </div>
    <div class="giu">${tieuDe('Điểm theo board')}${theoBoard(t.viec, mau)}</div>
    ${tieuDe('Thẻ đã xong', `${viec.length} thẻ · xếp theo ngày`)}
    ${viec.length ? bangThe(viec) : '<p class="bi-rong">Chưa có thẻ xong trong tháng.</p>'}
    ${t.thieu_gio.length ? `${tieuDe('Thẻ đã xong nhưng chưa tính được điểm', `${t.thieu_gio.length} thẻ`)}
      <p class="bi-ghi">Phần lớn là thẻ công đoạn máy chưa có định mức. Có định mức hoặc điền GIỜ ƯỚC trên Trello thì được tính.</p>
      ${bangThe(t.thieu_gio.map((x) => ({ ...x, diem: 0 })))}` : ''}
    <div class="giu">${tieuDe('Cách tính')}
    <table class="bi-bang ct"><colgroup><col><col style="width:22%"></colgroup><tbody>
      <tr><td>${ng(`Điểm việc = giờ thẻ (GIỜ ƯỚC, không có thì định mức) ÷ số người × ${so(ps.he_so_gio_sang_diem, 3)}`)}</td><td class="bi-so"><b>${so(t.diem_viec, 2)}</b></td></tr>
      <tr><td>${ng(`Ngưỡng = (${ps.gio_chuan_thang} − ${so(tru)} giờ QL) × ${so(ps.ty_le_gio_san_xuat)} × ${so(ps.he_so_gio_sang_diem, 3)} × ${so(p.he_so_bac, 3)} (bậc ${p.bac}) × ${so(p.he_so_ngach, 3)} (ngạch ${p.ngach})`)}</td><td class="bi-so"><b>${so(t.nguong)}</b></td></tr>
      <tr><td>${ng(`Tiền tới ngưỡng = MIN(điểm; ngưỡng) × ${tien(ps.don_gia_diem)}`)}</td><td class="bi-so"><b>${tien(t.tien.toi_nguong)}</b></td></tr>
      <tr><td>${ng('Tiền vượt ngưỡng (đến 140% × 205%, 140–160% × 275%, trên 160% × 300%)')}</td><td class="bi-so"><b>${tien(t.tien.vuot)}</b></td></tr>
    </tbody></table></div>
  </section>`;
}

function trangTo(ctx) {
  const { d, m, i } = ctx, T = d.to[i], mau = '#23303f';
  const ds = d.nguoi.map((p) => ({ p, t: p.thang.find((x) => x.thang === m) })).sort((a, b) => b.t.phan_tram - a.t.phan_tram);
  const tatCa = ds.flatMap((x) => x.t.viec.map((v) => ({ ...v, ai: x.p }))).sort((a, b) => b.diem - a.diem);
  const maxT = Math.max(1, ...d.thang.flatMap((mm) => d.nguoi.map((p) => p.thang.find((x) => x.thang === mm)?.diem || 0)));
  return `<section class="bi-trang">
    ${dauTrang('Điểm tháng tổ điện', `Báo cáo điểm tháng · ${tenThang(m)}`, `${d.nguoi.length}${NB}người · cập nhật ${esc(d.cap_nhat)} · chấm từ Trello theo QC-LKT-01`, mau)}
    <div class="bi-o4">
      ${oSo(so(T.diem, 1), `điểm cả tổ / ngưỡng ${so(T.nguong)}`, '#14935f')}
      ${oSo(`${so(T.phan_tram)}%`, `${T.dat_nguong}/${d.nguoi.length} người đạt ngưỡng`, '#2f6fd6')}
      ${oSo(`${T.so_the}`, `thẻ đã xong · ${so(T.gio)}${NB}giờ`, '#c27c0e')}
      ${oSo(tien(T.tien), 'tiền điểm cả tổ', '#8e4ec6')}
    </div>
    ${thanh(T.phan_tram, '#14935f')}
    <div class="giu">${tieuDe('Bảng xếp hạng', 'theo % ngưỡng')}
    <table class="bi-bang"><colgroup><col style="width:6%"><col style="width:20%"><col style="width:8%"><col style="width:11%"><col style="width:11%"><col><col style="width:16%"></colgroup>
      <thead><tr><th>#</th><th>Người</th><th class="bi-so">Thẻ</th><th class="bi-so">Điểm</th><th class="bi-so">Ngưỡng</th><th>% ngưỡng</th><th class="bi-so">Tiền điểm</th></tr></thead><tbody>
      ${ds.map((x, k) => `<tr><td><em class="bi-hang" style="background:${MAU_IN[x.p.ma]}">${k + 1}</em></td>
        <td><b>${ng(x.p.ten)}</b><span>ngạch${NB}${esc(x.p.ngach)} – ${esc(x.p.bac)}</span></td><td class="bi-so">${x.t.viec.length}</td>
        <td class="bi-so"><b>${so(x.t.diem, 1)}</b></td><td class="bi-so">${so(x.t.nguong)}</td>
        <td><div class="bi-ty"><i style="width:${Math.min(x.t.phan_tram, 200) / 2}%;background:${MAU_IN[x.p.ma]}"></i><em style="left:50%"></em><span>${so(x.t.phan_tram)}%</span></div></td>
        <td class="bi-so">${tien(x.t.tien.tong)}</td></tr>`).join('')}
      </tbody></table><p class="bi-ghi">Thanh % ngưỡng: vạch giữa = 100%, hết thanh = 200%.</p></div>
    <div class="bi-hai">
      <div>${tieuDe('Thành tích tổ điện', tenThang(m))}${tich(ctx.thanhTichTo(m, i).map((h) => ({ ...h, mau: MAU_IN[Object.keys(MAU_IN).find((k) => ctx.MAU[k] === h.mau)] || '#c27c0e' })))}</div>
      <div>${tieuDe('Lịch điểm của tổ', 'số nhỏ = điểm trong ngày')}${lich(m, ds.flatMap((x) => x.t.viec), '#14935f')}
        ${tieuDe('Điểm qua các tháng')}
        <div class="bi-cot">${d.thang.map((mm) => `<div><span>T${Number(mm.slice(5))}</span>${d.nguoi.map((p) => { const v = p.thang.find((x) => x.thang === mm)?.diem || 0; return `<p><i style="width:${(v / maxT) * 88}%;background:${MAU_IN[p.ma]}"></i><small>${so(v, 0)}</small></p>`; }).join('')}</div>`).join('')}</div>
        <div class="bi-chu-giai">${d.nguoi.map((p) => `<span><i style="background:${MAU_IN[p.ma]}"></i>${ng(p.ten)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="giu">${tieuDe('Top 10 thẻ điểm cao', tenThang(m))}${bangThe(tatCa.slice(0, 10), { ai: true })}</div>
  </section>`;
}

/** ctx = { d, i, view, MAU, thanhTichTo, thanhTichNguoi } -> dựng #ban-in, trả về tên file gợi ý. */
export function dungBanIn(ctx) {
  const { d, i, view } = ctx, m = d.thang[i];
  const p = d.nguoi.find((x) => x.ma === view);
  ctx.m = m;
  const html = p ? trangNguoi(ctx, p, true) : trangTo(ctx) + d.nguoi.map((x) => trangNguoi(ctx, x, false)).join('');
  let khu = document.getElementById('ban-in');
  if (!khu) { khu = document.createElement('div'); khu.id = 'ban-in'; document.body.appendChild(khu); }
  khu.innerHTML = html;
  const chan = `Điểm tháng · ${p ? (p.ho_ten || p.ten) : 'Tổ điện'} · ${tenThang(m).replace(NB, ' ')}`;
  let st = document.getElementById('ban-in-trang');
  if (!st) { st = document.createElement('style'); st.id = 'ban-in-trang'; document.head.appendChild(st); }
  st.textContent = `@page { @bottom-left { content: "${chan.replace(/"/g, '')}"; } }`;
  return `Diem-thang_T${Number(m.slice(5))}-${m.slice(0, 4)}_${boDau(p ? p.ten : 'To-dien').replace(/\s+/g, '-')}`;
}

/** Bấm nút PDF: dựng bản in, đặt tên file theo tiêu đề trang, mở hộp in (chọn "Lưu thành PDF"). */
export async function xuatPDF(ctx) {
  const ten = dungBanIn(ctx), cu = document.title;
  document.title = ten;
  try { await document.fonts.ready; } catch { /* in luôn */ }
  const tra = () => { document.title = cu; removeEventListener('afterprint', tra); };
  addEventListener('afterprint', tra);
  requestAnimationFrame(() => setTimeout(() => window.print(), 60));
}
