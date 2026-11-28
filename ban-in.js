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

function bangThe(ds, { ai = null, tieuDiem = true, tong = false } = {}) {
  const sg = ds.reduce((s, x) => s + (x.gio ?? x.gio_thuc ?? 0), 0), sd = ds.reduce((s, x) => s + (x.diem || 0), 0);
  return `<table class="bi-bang the"><colgroup><col style="width:5%"><col style="width:8%"><col><col style="width:21%"><col style="width:8%"><col style="width:9%"></colgroup>
    <thead><tr><th>#</th><th>Ngày</th><th>Thẻ việc</th><th>Nguồn giờ</th><th class="bi-so">Giờ</th><th class="bi-so">${tieuDiem ? 'Điểm' : ''}</th></tr></thead><tbody>
    ${ds.map((x, i) => `<tr><td class="bi-mo">${i + 1}</td><td>${ngayVN(x.ngay)}</td>
      <td><b>${ai ? `<i class="bi-cham" style="background:${MAU_IN[x.ai.ma]}"></i>` : ''}${ng(x.ten)}</b><span>${ng(x.board)} · ${ng(x.list)}${ai ? ` · ${ng(x.ai.ten)}` : ''}</span></td>
      <td class="nguon">${ng(nguon(x.nguon_gio))}</td><td class="bi-so">${so(x.gio ?? x.gio_thuc, 2)}</td><td class="bi-so"><b>${so(x.diem, 2)}</b></td></tr>`).join('')}
    ${tong ? `<tr class="bi-tong"><td></td><td colspan="3"><b>Tổng ${ds.length}${NB}thẻ</b></td><td class="bi-so"><b>${so(sg, 2)}</b></td><td class="bi-so"><b>${so(sd, 2)}</b></td></tr>` : ''}
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

// ---------------- Mục chọn được ----------------
export const MUC_TO = [['to_tong', 'Tổng quan tổ', 'ô số, thanh ngưỡng'], ['to_xh', 'Bảng xếp hạng', '4 người, % ngưỡng, tiền'],
  ['to_tich', 'Thành tích + lịch + biểu đồ', 'thành tích tổ, lịch điểm, điểm các tháng'], ['to_top', 'Top 10 thẻ điểm cao', '']];
export const MUC_NGUOI = [['tong', 'Tổng quan', 'ô số, thanh ngưỡng'], ['tich', 'Thành tích + lịch điểm', ''],
  ['board', 'Điểm theo board', 'tỷ trọng từng board'], ['the', 'Thẻ tính điểm', 'từng thẻ: ngày, nguồn giờ, giờ, điểm + dòng tổng'],
  ['thieu', 'Thẻ chưa tính được điểm', 'thẻ xong nhưng chưa có định mức'], ['ct', 'Cách tính', 'công thức điểm, ngưỡng, tiền']];
export const MAU_NHANH = { 'day-du': [...MUC_TO, ...MUC_NGUOI].map((x) => x[0]), the: ['the'], 'tom-tat': ['to_tong', 'to_xh', 'tong', 'tich', 'board'] };

const locBoard = (ds, boards) => (boards ? ds.filter((v) => boards.includes(v.board || '—')) : ds);

function trangNguoi(ctx, p, dauTien, muc, boards) {
  const { d, m, i } = ctx, t = d.nguoi.find((x) => x.ma === p.ma).thang.find((x) => x.thang === m), ps = d.tham_so;
  const mau = MAU_IN[p.ma] || '#334155';
  const tru = Math.min((t.gio_quan_ly || 0) * Math.min(ps.he_so_quan_ly_K, 1), 96);
  const viec = locBoard([...t.viec], boards).sort((a, b) => a.ngay.localeCompare(b.ngay) || b.diem - a.diem);
  const thieu = locBoard(t.thieu_gio, boards);
  const loc = boards ? ` · lọc board: ${boards.map(esc).join(', ')}` : '';
  const co = (k) => muc.includes(k);
  return `<section class="bi-trang ${dauTien ? '' : 'bi-moi'}">
    ${dauTrang(`${p.ho_ten || p.ten}`, `Báo cáo điểm tháng · ${tenThang(m)}`, `${ng(p.vi_tri || '')} · ngạch${NB}${esc(p.ngach)} – bậc${NB}${esc(p.bac)} · ${esc(p.ma_nv || '')} · ${so(t.diem, 2)}${NB}điểm / ngưỡng ${so(t.nguong)}${loc}`, mau)}
    ${co('tong') ? `<div class="bi-o4">
      ${oSo(`${so(t.diem, 2)}`, `điểm / ngưỡng ${so(t.nguong)}`, mau)}
      ${oSo(`${so(t.phan_tram)}%`, t.phan_tram >= 100 ? 'đã vượt ngưỡng' : 'của ngưỡng', mau)}
      ${oSo(`${t.viec.length}`, `thẻ đã xong · ${so(t.gio)}${NB}giờ quy đổi`, mau)}
      ${oSo(tien(t.tien.tong), t.tien.vuot ? `gồm ${tien(t.tien.vuot)} vượt ngưỡng` : 'tiền điểm ước tính', mau)}
    </div>${thanh(t.phan_tram, mau)}` : ''}
    ${co('tich') ? `<div class="bi-hai">
      <div>${tieuDe('Thành tích', tenThang(m))}${tich(ctx.thanhTichNguoi(p, m, i).map((h) => ({ ...h, mau })))}</div>
      <div>${tieuDe('Lịch điểm', 'số nhỏ = điểm trong ngày')}${lich(m, t.viec, mau)}</div>
    </div>` : ''}
    ${co('board') ? `<div class="giu">${tieuDe('Điểm theo board')}${theoBoard(locBoard(t.viec, boards), mau)}</div>` : ''}
    ${co('the') ? `${tieuDe('Thẻ tính điểm', `${viec.length} thẻ · xếp theo ngày`)}
      ${viec.length ? bangThe(viec, { tong: true }) : '<p class="bi-rong">Không có thẻ tính điểm trong phần đã chọn.</p>'}` : ''}
    ${co('thieu') && thieu.length ? `${tieuDe('Thẻ đã xong nhưng chưa tính được điểm', `${thieu.length} thẻ`)}
      <p class="bi-ghi">Phần lớn là thẻ công đoạn máy chưa có định mức. Có định mức hoặc điền GIỜ ƯỚC trên Trello thì được tính.</p>
      ${bangThe(thieu.map((x) => ({ ...x, diem: 0 })))}` : ''}
    ${co('ct') ? `<div class="giu">${tieuDe('Cách tính')}
    <table class="bi-bang ct"><colgroup><col><col style="width:22%"></colgroup><tbody>
      <tr><td>${ng(`Điểm việc = giờ thẻ (GIỜ ƯỚC, không có thì định mức) ÷ số người × ${so(ps.he_so_gio_sang_diem, 3)}`)}</td><td class="bi-so"><b>${so(t.diem_viec, 2)}</b></td></tr>
      <tr><td>${ng(`Ngưỡng = (${ps.gio_chuan_thang} − ${so(tru)} giờ QL) × ${so(ps.ty_le_gio_san_xuat)} × ${so(ps.he_so_gio_sang_diem, 3)} × ${so(p.he_so_bac, 3)} (bậc ${p.bac}) × ${so(p.he_so_ngach, 3)} (ngạch ${p.ngach})`)}</td><td class="bi-so"><b>${so(t.nguong)}</b></td></tr>
      <tr><td>${ng(`Tiền tới ngưỡng = MIN(điểm; ngưỡng) × ${tien(ps.don_gia_diem)}`)}</td><td class="bi-so"><b>${tien(t.tien.toi_nguong)}</b></td></tr>
      <tr><td>${ng('Tiền vượt ngưỡng (đến 140% × 205%, 140–160% × 275%, trên 160% × 300%)')}</td><td class="bi-so"><b>${tien(t.tien.vuot)}</b></td></tr>
    </tbody></table></div>` : ''}
  </section>`;
}

function trangTo(ctx, muc) {
  const { d, m, i } = ctx, T = d.to[i], mau = '#23303f', co = (k) => muc.includes(k);
  const ds = d.nguoi.map((p) => ({ p, t: p.thang.find((x) => x.thang === m) })).sort((a, b) => b.t.phan_tram - a.t.phan_tram);
  const tatCa = ds.flatMap((x) => x.t.viec.map((v) => ({ ...v, ai: x.p }))).sort((a, b) => b.diem - a.diem);
  const maxT = Math.max(1, ...d.thang.flatMap((mm) => d.nguoi.map((p) => p.thang.find((x) => x.thang === mm)?.diem || 0)));
  return `<section class="bi-trang">
    ${dauTrang('Điểm tháng tổ điện', `Báo cáo điểm tháng · ${tenThang(m)}`, `${d.nguoi.length}${NB}người · cập nhật ${esc(d.cap_nhat)} · chấm từ Trello theo QC-LKT-01`, mau)}
    ${co('to_tong') ? `<div class="bi-o4">
      ${oSo(so(T.diem, 1), `điểm cả tổ / ngưỡng ${so(T.nguong)}`, '#14935f')}
      ${oSo(`${so(T.phan_tram)}%`, `${T.dat_nguong}/${d.nguoi.length} người đạt ngưỡng`, '#2f6fd6')}
      ${oSo(`${T.so_the}`, `thẻ đã xong · ${so(T.gio)}${NB}giờ`, '#c27c0e')}
      ${oSo(tien(T.tien), 'tiền điểm cả tổ', '#8e4ec6')}
    </div>${thanh(T.phan_tram, '#14935f')}` : ''}
    ${co('to_xh') ? `<div class="giu">${tieuDe('Bảng xếp hạng', 'theo % ngưỡng')}
    <table class="bi-bang"><colgroup><col style="width:6%"><col style="width:20%"><col style="width:8%"><col style="width:11%"><col style="width:11%"><col><col style="width:16%"></colgroup>
      <thead><tr><th>#</th><th>Người</th><th class="bi-so">Thẻ</th><th class="bi-so">Điểm</th><th class="bi-so">Ngưỡng</th><th>% ngưỡng</th><th class="bi-so">Tiền điểm</th></tr></thead><tbody>
      ${ds.map((x, k) => `<tr><td><em class="bi-hang" style="background:${MAU_IN[x.p.ma]}">${k + 1}</em></td>
        <td><b>${ng(x.p.ten)}</b><span>ngạch${NB}${esc(x.p.ngach)} – ${esc(x.p.bac)}</span></td><td class="bi-so">${x.t.viec.length}</td>
        <td class="bi-so"><b>${so(x.t.diem, 1)}</b></td><td class="bi-so">${so(x.t.nguong)}</td>
        <td><div class="bi-ty"><i style="width:${Math.min(x.t.phan_tram, 200) / 2}%;background:${MAU_IN[x.p.ma]}"></i><em style="left:50%"></em><span>${so(x.t.phan_tram)}%</span></div></td>
        <td class="bi-so">${tien(x.t.tien.tong)}</td></tr>`).join('')}
      </tbody></table><p class="bi-ghi">Thanh % ngưỡng: vạch giữa = 100%, hết thanh = 200%.</p></div>` : ''}
    ${co('to_tich') ? `<div class="bi-hai">
      <div>${tieuDe('Thành tích tổ điện', tenThang(m))}${tich(ctx.thanhTichTo(m, i).map((h) => ({ ...h, mau: MAU_IN[Object.keys(MAU_IN).find((k) => ctx.MAU[k] === h.mau)] || '#c27c0e' })))}</div>
      <div>${tieuDe('Lịch điểm của tổ', 'số nhỏ = điểm trong ngày')}${lich(m, ds.flatMap((x) => x.t.viec), '#14935f')}
        ${tieuDe('Điểm qua các tháng')}
        <div class="bi-cot">${d.thang.map((mm) => `<div><span>T${Number(mm.slice(5))}</span>${d.nguoi.map((p) => { const v = p.thang.find((x) => x.thang === mm)?.diem || 0; return `<p><i style="width:${(v / maxT) * 88}%;background:${MAU_IN[p.ma]}"></i><small>${so(v, 0)}</small></p>`; }).join('')}</div>`).join('')}</div>
        <div class="bi-chu-giai">${d.nguoi.map((p) => `<span><i style="background:${MAU_IN[p.ma]}"></i>${ng(p.ten)}</span>`).join('')}</div>
      </div>
    </div>` : ''}
    ${co('to_top') ? `<div class="giu">${tieuDe('Top 10 thẻ điểm cao', tenThang(m))}${bangThe(tatCa.slice(0, 10), { ai: true })}</div>` : ''}
  </section>`;
}

/** ctx = { d, i, MAU, thanhTichTo, thanhTichNguoi }; chon = { nguoi: ['to','sy',…], muc: [...], board: [...] | null }
 *  -> dựng #ban-in, trả về tên file gợi ý. */
export function dungBanIn(ctx, chon) {
  const { d, i } = ctx, m = d.thang[i];
  ctx.m = m;
  const coTo = chon.nguoi.includes('to') && chon.muc.some((k) => k.startsWith('to_'));
  const mucNg = chon.muc.filter((k) => !k.startsWith('to_'));
  const ds = d.nguoi.filter((p) => chon.nguoi.includes(p.ma));
  const phan = [];
  if (coTo) phan.push(trangTo(ctx, chon.muc));
  if (mucNg.length) ds.forEach((p) => phan.push(trangNguoi(ctx, p, !phan.length, mucNg, chon.board)));
  let khu = document.getElementById('ban-in');
  if (!khu) { khu = document.createElement('div'); khu.id = 'ban-in'; document.body.appendChild(khu); }
  khu.innerHTML = phan.join('');
  const mot = !coTo && ds.length === 1 ? ds[0] : null;
  const chan = `Điểm tháng · ${mot ? (mot.ho_ten || mot.ten) : 'Tổ điện'} · ${tenThang(m).replace(NB, ' ')}`;
  let st = document.getElementById('ban-in-trang');
  if (!st) { st = document.createElement('style'); st.id = 'ban-in-trang'; document.head.appendChild(st); }
  st.textContent = `@page { @bottom-left { content: "${chan.replace(/"/g, '')}"; } }`;
  const ai = coTo ? ['To-dien'].concat(ds.length === d.nguoi.length ? [] : ds.map((p) => p.ten)) : ds.map((p) => p.ten);
  const duoi = mucNg.length === 1 && !coTo ? '_' + { the: 'the-tinh-diem', thieu: 'the-chua-tinh', board: 'theo-board', tong: 'tong-quan', tich: 'thanh-tich', ct: 'cach-tinh' }[mucNg[0]] : '';
  const loc = chon.board?.length ? '_' + (chon.board.length <= 2 ? chon.board.join('+') : `${chon.board.length}-board`) : '';
  return `Diem-thang_T${Number(m.slice(5))}-${m.slice(0, 4)}_${boDau(ai.join('-') + duoi + loc).replace(/[^\w+-]+/g, '-').replace(/-+/g, '-').replace(/-$/, '')}`;
}

/** Dựng bản in theo lựa chọn, đặt tên file theo tiêu đề trang, mở hộp in (chọn "Lưu thành PDF"). */
export async function xuatPDF(ctx, chon) {
  const ten = dungBanIn(ctx, chon), cu = document.title;
  document.title = ten;
  try { await document.fonts.ready; } catch { /* in luôn */ }
  const tra = () => { document.title = cu; removeEventListener('afterprint', tra); };
  addEventListener('afterprint', tra);
  requestAnimationFrame(() => setTimeout(() => window.print(), 60));
}

// ---------------- Hộp chọn: người, mục, board ----------------
const NHO = 'diem-thang-pdf';
const docNho = () => { try { return JSON.parse(localStorage.getItem(NHO) || 'null'); } catch { return null; } };

/** Mở hộp chọn. ctx như dungBanIn + view (tab đang xem) để chọn sẵn người. */
export function moHopPDF(ctx) {
  const { d, i, view } = ctx, m = d.thang[i];
  const nho = docNho();
  const st = {
    nguoi: view === 'home' ? ['to', ...d.nguoi.map((p) => p.ma)] : [view],
    muc: nho?.muc?.length ? nho.muc : MAU_NHANH['day-du'].slice(),
    board: null,
  };
  let hop = document.getElementById('hop-pdf');
  if (!hop) {
    hop = document.createElement('dialog'); hop.id = 'hop-pdf'; hop.className = 'hop-pdf';
    hop.setAttribute('aria-labelledby', 'hp-tieu');
    document.body.appendChild(hop);
    hop.addEventListener('click', (e) => { if (e.target === hop) hop.close(); }); // bấm nền tối để đóng
  }
  const chip = (k, ten, on, mau = '') => `<button type="button" class="hp-chip" data-k="${esc(k)}" aria-pressed="${on}">${mau ? `<i style="background:${mau}"></i>` : ''}${esc(ten)}</button>`;
  const hop1 = (k, ten, phu) => `<label class="hp-muc"><input type="checkbox" value="${k}" ${st.muc.includes(k) ? 'checked' : ''}><span><b>${esc(ten)}</b>${phu ? `<small>${esc(phu)}</small>` : ''}</span></label>`;
  const tatBoard = () => [...new Set(d.nguoi.filter((p) => st.nguoi.includes(p.ma)).flatMap((p) => p.thang.find((x) => x.thang === m).viec.map((v) => v.board || '—')))].sort();

  function ve() {
    const f = document.activeElement && hop.contains(document.activeElement) ? document.activeElement : null;
    const giu = f && (f.dataset.k ? `[data-k="${f.dataset.k}"]` : f.dataset.b ? `[data-b="${CSS.escape(f.dataset.b)}"]` : f.dataset.mau ? `[data-mau="${f.dataset.mau}"]`
      : f.dataset.tat ? `[data-tat="${f.dataset.tat}"]` : f.type === 'checkbox' ? `input[value="${f.value}"]` : null);
    veHop();
    if (giu) hop.querySelector(giu)?.focus();
  }
  function veHop() {
    const coNg = d.nguoi.some((p) => st.nguoi.includes(p.ma)), coTo = st.nguoi.includes('to');
    const bs = tatBoard(), chonB = st.board || bs;
    const soThe = d.nguoi.filter((p) => st.nguoi.includes(p.ma)).reduce((s, p) => s + locBoard(p.thang.find((x) => x.thang === m).viec, st.board).length, 0);
    const mucTo = st.muc.filter((k) => k.startsWith('to_')), mucNg = st.muc.filter((k) => !k.startsWith('to_'));
    const duoc = ((coTo && mucTo.length) || (coNg && mucNg.length)) && !(st.board && !st.board.length);
    hop.innerHTML = `<form method="dialog" class="hp-khung">
      <div class="hp-dau"><h2 id="hp-tieu">Xuất PDF <small>${esc(tenThang(m).replace(NB, ' '))} · A4 có màu</small></h2>
        <button type="submit" value="huy" class="hp-dong" aria-label="Đóng">×</button></div>
      <fieldset><legend>Người <button type="button" class="hp-lk" data-tat="nguoi">${st.nguoi.length === d.nguoi.length + 1 ? 'Bỏ hết' : 'Chọn hết'}</button></legend>
        <div class="hp-hang">${chip('to', 'Cả tổ (trang tổng)', coTo, '#64748b')}${d.nguoi.map((p) => chip(p.ma, p.ten, st.nguoi.includes(p.ma), ctx.MAU[p.ma])).join('')}</div></fieldset>
      <fieldset><legend>Mẫu nhanh</legend><div class="hp-hang">
        <button type="button" class="hp-chip" data-mau="the">Chỉ thẻ tính điểm</button>
        <button type="button" class="hp-chip" data-mau="tom-tat">Tóm tắt</button>
        <button type="button" class="hp-chip" data-mau="day-du">Đầy đủ</button></div></fieldset>
      ${coTo ? `<fieldset><legend>Mục trang tổng</legend><div class="hp-luoi">${MUC_TO.map(([k, t, p]) => hop1(k, t, p)).join('')}</div></fieldset>` : ''}
      ${coNg ? `<fieldset><legend>Mục từng người</legend><div class="hp-luoi">${MUC_NGUOI.map(([k, t, p]) => hop1(k, t, p)).join('')}</div></fieldset>
      <fieldset><legend>Board <button type="button" class="hp-lk" data-tat="board">${st.board ? 'Tất cả board' : 'Bỏ hết'}</button></legend>
        <div class="hp-hang">${bs.map((b) => `<button type="button" class="hp-chip" data-b="${esc(b)}" aria-pressed="${chonB.includes(b)}">${esc(b)}</button>`).join('')}</div>
        <p class="hp-ghi">Lọc áp cho Điểm theo board, Thẻ tính điểm, Thẻ chưa tính.</p></fieldset>` : ''}
      <div class="hp-chan"><p class="hp-tom" role="status">${duoc ? `${coTo && mucTo.length ? 'Trang tổng + ' : ''}${coNg && mucNg.length ? `${d.nguoi.filter((p) => st.nguoi.includes(p.ma)).map((p) => esc(p.ten)).join(', ')} · ${mucNg.length} mục · ${soThe} thẻ` : ''}` : 'Chọn ít nhất 1 người và 1 mục'}</p>
        <button type="submit" value="huy" class="nut-phu">Huỷ</button>
        <button type="button" class="nut hp-xuat" ${duoc ? '' : 'disabled'}><span>Xuất PDF</span></button></div>
    </form>`;
  }
  hop.onclick = (e) => {
    if (e.target === hop) return;
    const c = e.target.closest('[data-k]'), mu = e.target.closest('[data-mau]'), b = e.target.closest('[data-b]'), tat = e.target.closest('[data-tat]');
    if (c) { const k = c.dataset.k; st.nguoi = st.nguoi.includes(k) ? st.nguoi.filter((x) => x !== k) : [...st.nguoi, k]; st.board = null; ve(); return; }
    if (mu) { st.muc = MAU_NHANH[mu.dataset.mau].slice(); ve(); return; }
    if (b) {
      const bs = tatBoard(), cur = st.board || bs.slice(), k = b.dataset.b;
      const moi = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
      st.board = moi.length === bs.length ? null : moi; ve(); return;
    }
    if (tat) {
      if (tat.dataset.tat === 'nguoi') st.nguoi = st.nguoi.length === d.nguoi.length + 1 ? [] : ['to', ...d.nguoi.map((p) => p.ma)];
      else st.board = st.board ? null : [];
      ve(); return;
    }
    if (e.target.closest('.hp-xuat')) {
      if (st.board && !st.board.length) return;
      try { localStorage.setItem(NHO, JSON.stringify({ muc: st.muc })); } catch { /* bỏ qua */ }
      hop.close();
      xuatPDF(ctx, { nguoi: st.nguoi, muc: st.muc, board: st.board });
    }
  };
  hop.onchange = (e) => {
    const cb = e.target.closest('input[type=checkbox]'); if (!cb) return;
    st.muc = cb.checked ? [...new Set([...st.muc, cb.value])] : st.muc.filter((x) => x !== cb.value);
    ve();
  };
  ve();
  hop.showModal();
}