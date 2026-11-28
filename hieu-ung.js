// Thư viện hiệu ứng của web Điểm tháng. Mọi hiệu ứng có TÊN trong DANH_MUC và đều được gắn vào phần tử thật.
// Nguyên tắc: chỉ transform + opacity (mượt 120 Hz), keyframes chỉ có "from" (tắt hiệu ứng -> nội dung vẫn hiện đủ),
// không gradient / đổ bóng / phát sáng (luật chủ máy). Vòng lặp tự dừng khi ra khỏi màn hình hoặc tab ẩn.

// ---- A. VÀO CẢNH (50) : [mã, tên, transform lúc đầu, transform-origin]
const VAO = [
  ['len', 'Trồi lên', 'translateY(18px)'], ['xuong', 'Rơi xuống nhẹ', 'translateY(-18px)'], ['trai', 'Lướt từ trái', 'translateX(-24px)'],
  ['phai', 'Lướt từ phải', 'translateX(24px)'], ['phong', 'Phóng to vào', 'scale(.86)'], ['thu', 'Thu nhỏ vào', 'scale(1.12)'],
  ['lat-x', 'Lật ngang', 'perspective(600px) rotateX(-70deg)'], ['lat-y', 'Lật dọc', 'perspective(600px) rotateY(70deg)'],
  ['xoay-t', 'Xoay trái vào', 'rotate(-8deg) translateY(10px)'], ['xoay-p', 'Xoay phải vào', 'rotate(8deg) translateY(10px)'],
  ['xien-t', 'Xiên trái', 'skewX(10deg)'], ['xien-p', 'Xiên phải', 'skewX(-10deg)'], ['roi', 'Rơi từ cao', 'translateY(-60px)'],
  ['troi', 'Trôi từ thấp', 'translateY(60px)'], ['bat', 'Bật ra', 'scale(.4)'], ['gian-x', 'Giãn ngang', 'scaleX(.2)', '0 50%'],
  ['gian-y', 'Giãn dọc', 'scaleY(.2)', '50% 100%'], ['goc-tt', 'Từ góc trên trái', 'translate(-30px,-30px)'],
  ['goc-dp', 'Từ góc dưới phải', 'translate(30px,30px)'], ['xoan', 'Xoắn vào', 'rotate(-90deg) scale(.5)'],
  ['nghieng', 'Nghiêng 3D', 'perspective(600px) rotateY(-25deg) translateX(-20px)'], ['nho-len', 'Nhô lên khẽ', 'translateY(8px) scale(.98)'],
  ['lon-nhao', 'Lộn nhào', 'rotate(12deg) translateX(-40px)'], ['ep', 'Ép dẹt', 'scaleY(.6) scaleX(1.2)'], ['keo', 'Kéo dài', 'scaleX(.7) scaleY(1.2)'],
  ['cua-t', 'Mở cửa trái', 'perspective(800px) rotateY(-90deg)', '0 50%'], ['cua-p', 'Mở cửa phải', 'perspective(800px) rotateY(90deg)', '100% 50%'],
  ['gap-xuong', 'Gập xuống', 'perspective(800px) rotateX(90deg)', '50% 0'], ['lan', 'Lăn vào', 'translateX(-60px) rotate(-30deg)'],
  ['van', 'Vặn vào', 'rotate(180deg) scale(.6)'], ['phong-len', 'Phóng lên', 'scale(.8) translateY(30px)'], ['phong-xuong', 'Phóng xuống', 'scale(.8) translateY(-30px)'],
  ['xoay-nho', 'Xoay nhỏ', 'rotate(-20deg) scale(.9)'], ['nhin', 'Ló ra', 'translateY(6px) scale(.96)'], ['rem', 'Kéo rèm', 'scaleY(0)', '50% 0'],
  ['ho', 'Hé xiên', 'translateX(-12px) skewX(6deg)'], ['mo-dan', 'Hiện dần', 'none'], ['nhay-cao', 'Nhảy cao', 'translateY(-40px) scale(.9)'],
  ['truot-xa', 'Trượt xa', 'translateX(-90px)'], ['truot-xa-p', 'Trượt xa phải', 'translateX(90px)'], ['lat-sau', 'Lật sau lưng', 'perspective(700px) rotateY(-180deg)'],
  ['nghieng-len', 'Nghiêng lên', 'perspective(700px) rotateX(40deg) translateY(20px)'], ['cheo', 'Chéo vào', 'translate(-20px,20px) rotate(-4deg)'],
  ['cheo-p', 'Chéo phải', 'translate(20px,20px) rotate(4deg)'], ['tu-xa', 'Từ xa tới', 'perspective(700px) translateZ(-200px)'],
  ['sat', 'Áp sát', 'perspective(700px) translateZ(120px)'], ['dong-x', 'Đóng ngang', 'scaleX(1.4)'], ['dong-y', 'Đóng dọc', 'scaleY(1.4)'],
  ['xien-len', 'Xiên lên', 'skewY(6deg) translateY(16px)'], ['xoay-3d', 'Xoay 3D', 'perspective(700px) rotate3d(1,1,0,60deg)'],
  ['nghieng-xuong', 'Nghiêng xuống', 'perspective(700px) rotateX(-40deg) translateY(-20px)'], ['xoay-y-nho', 'Xoay dọc nhẹ', 'perspective(700px) rotateY(25deg)'],
  ['truot-cheo', 'Trượt chéo xa', 'translate(-50px,-20px)'], ['nho-xuong', 'Nhỏ rơi', 'scale(.9) translateY(-12px)'],
  ['phong-xoay', 'Phóng xoay', 'scale(.7) rotate(10deg)'], ['lan-phai', 'Lăn phải', 'translateX(60px) rotate(30deg)'],
];
const VAO_KF = { // vài kiểu cần nhiều nhịp
  'nay': ['Nảy vào', '0%{transform:scale(.3);opacity:0}55%{transform:scale(1.08);opacity:1}75%{transform:scale(.96)}'],
  'lac-vao': ['Lắc vào', '0%{transform:translateX(-30px);opacity:0}50%{transform:translateX(10px);opacity:1}70%{transform:translateX(-5px)}85%{transform:translateX(2px)}'],
  'dan-hoi': ['Đàn hồi', '0%{transform:scaleX(.4) scaleY(1.3);opacity:0}40%{transform:scaleX(1.15) scaleY(.9);opacity:1}65%{transform:scaleX(.95) scaleY(1.05)}'],
};

// ---- B. RÊ CHUỘT / BẤM (45) : [mã, tên, css]
const RE = [
  ['nhac', 'Nhấc lên', ':hover{transform:translateY(-4px)}'], ['lun', 'Lún xuống', ':hover{transform:translateY(2px)}'],
  ['to', 'To ra', ':hover{transform:scale(1.03)}'], ['nho', 'Nhỏ lại', ':hover{transform:scale(.98)}'],
  ['nghieng-t', 'Nghiêng trái', ':hover{transform:rotate(-1.5deg)}'], ['nghieng-p', 'Nghiêng phải', ':hover{transform:rotate(1.5deg)}'],
  ['truot-p', 'Trượt phải', ':hover{transform:translateX(4px)}'], ['truot-t', 'Trượt trái', ':hover{transform:translateX(-4px)}'],
  ['nhac-to', 'Nhấc và to', ':hover{transform:translateY(-3px) scale(1.02)}'], ['xien', 'Xiên', ':hover{transform:skewX(-3deg)}'],
  ['gian-x', 'Giãn ngang', ':hover{transform:scaleX(1.03)}'], ['gian-y', 'Giãn dọc', ':hover{transform:scaleY(1.05)}'],
  ['xoay-nhe', 'Xoay nhẹ', ':hover{transform:rotate(2deg) scale(1.02)}'], ['nhac-xa', 'Nhấc xa', ':hover{transform:translateY(-8px)}'],
  ['lech', 'Lệch phải', ':hover{transform:translate(3px,-3px)}'], ['lech2', 'Lệch trái', ':hover{transform:translate(-3px,-3px)}'],
  ['lat', 'Lật nhẹ', ':hover{transform:perspective(600px) rotateY(8deg)}'], ['cui', 'Cúi nhẹ', ':hover{transform:perspective(600px) rotateX(8deg)}'],
  ['vien-sang', 'Viền sáng', ':hover{border-color:var(--chu2)}'], ['nen-sang', 'Nền sáng', ':hover{background:var(--mat3)}'],
  ['chu-sang', 'Chữ sáng', ':hover b{color:var(--xanh)}'], ['icon-xoay', 'Biểu tượng xoay', ' svg{transition:transform var(--vua) var(--nay)}&:hover svg{transform:rotate(20deg)}'],
  ['icon-nay', 'Biểu tượng nhảy', ' svg{transition:transform var(--vua) var(--nay)}&:hover svg{transform:translateY(-3px)}'],
  ['icon-to', 'Biểu tượng to', ' svg{transition:transform var(--vua) var(--nay)}&:hover svg{transform:scale(1.18)}'],
  ['quet', 'Quét sáng', '::after{content:"";position:absolute;top:0;bottom:0;left:-40%;width:30%;background:rgba(255,255,255,.07);transform:translateX(0) skewX(-20deg);pointer-events:none}&:hover::after{animation:hk-quet .7s var(--ra)}'],
  ['lac', 'Lắc', ':hover{animation:hk-lac .6s}'], ['jello', 'Rung thạch', ':hover{animation:hk-jello .8s}'],
  ['cao-su', 'Cao su', ':hover{animation:hk-caosu .7s}'], ['tim', 'Nhịp tim', ':hover{animation:hk-tim .9s}'],
  ['du', 'Đu đưa', ':hover{animation:hk-du .8s;transform-origin:50% 0}'], ['tada', 'Ta-da', ':hover{animation:hk-tada .8s}'],
  ['lac-dau', 'Lắc đầu', ':hover{animation:hk-lacdau .6s}'], ['nhip', 'Nhịp to', ':hover{animation:hk-nhip .5s}'],
  ['nhun', 'Nhún', ':hover{animation:hk-nhun .6s}'], ['xoay-tron', 'Xoay tròn', ' svg{transition:transform .6s var(--ra)}&:hover svg{transform:rotate(360deg)}'],
  ['lat-so', 'Lật số', ':hover b{animation:hk-latso .5s}'], ['nghieng-3d', 'Nghiêng 3D', ':hover{transform:perspective(600px) rotateX(6deg) rotateY(-6deg)}'],
  ['bam-lun', 'Bấm lún', ':active{transform:scale(.95)}'], ['bam-dep', 'Bấm dẹt', ':active{transform:scaleY(.94)}'],
  ['bam-xoay', 'Bấm xoay', ':active{transform:rotate(-2deg) scale(.97)}'], ['vong-lan', 'Vòng lan', '::before{content:"";position:absolute;inset:0;border:1px solid var(--chu2);border-radius:inherit;opacity:0;pointer-events:none}&:hover::before{animation:hk-vonglan .6s var(--ra)}'],
  ['so-nhay', 'Số nhảy', ':hover .so{display:inline-block;animation:hk-nhun .5s}'], ['ten-truot', 'Tên trượt', ' b{transition:transform var(--vua) var(--ra);display:block}&:hover b{transform:translateX(4px)}'],
  ['mo-phu', 'Chữ phụ hiện rõ', ' span{transition:color var(--vua)}&:hover span{color:var(--chu)}'], ['nhac-bong', 'Nhấc giữ nền', ':hover{transform:translateY(-2px);background:var(--mat2)}'],
];
const RE_KF = `@keyframes hk-quet{to{transform:translateX(560%) skewX(-20deg)}}
@keyframes hk-lac{25%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}75%{transform:rotate(-1deg)}}
@keyframes hk-jello{30%{transform:skewX(-6deg) skewY(-6deg)}50%{transform:skewX(4deg) skewY(4deg)}70%{transform:skewX(-2deg) skewY(-2deg)}}
@keyframes hk-caosu{30%{transform:scaleX(1.12) scaleY(.88)}45%{transform:scaleX(.9) scaleY(1.1)}65%{transform:scaleX(1.04) scaleY(.96)}}
@keyframes hk-tim{14%{transform:scale(1.06)}28%{transform:scale(1)}42%{transform:scale(1.06)}70%{transform:scale(1)}}
@keyframes hk-du{20%{transform:rotate(6deg)}40%{transform:rotate(-4deg)}60%{transform:rotate(2deg)}80%{transform:rotate(-1deg)}}
@keyframes hk-tada{10%,20%{transform:scale(.96) rotate(-2deg)}30%,50%,70%{transform:scale(1.04) rotate(2deg)}40%,60%{transform:scale(1.04) rotate(-2deg)}}
@keyframes hk-lacdau{20%{transform:translateX(-5px) rotateY(-9deg)}50%{transform:translateX(4px) rotateY(7deg)}80%{transform:translateX(-2px)}}
@keyframes hk-nhip{50%{transform:scale(1.05)}}
@keyframes hk-nhun{40%{transform:translateY(-5px)}70%{transform:translateY(1px)}}
@keyframes hk-latso{50%{transform:perspective(300px) rotateX(90deg)}}
@keyframes hk-vonglan{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.08)}}`;

// ---- C. CHUYỂN ĐỘNG NỀN (45) : [mã, tên, keyframes, thời gian]
const LAP = [
  ['tho', 'Thở', '50%{transform:scale(1.08)}', '3.2s'], ['noi', 'Trôi nổi', '50%{transform:translateY(-6px)}', '3.6s'],
  ['boi', 'Bập bềnh', '25%{transform:translateY(-3px) rotate(-2deg)}75%{transform:translateY(3px) rotate(2deg)}', '4s'],
  ['quay', 'Quay chậm', 'to{transform:rotate(360deg)}', '9s', 'linear'], ['quay-nguoc', 'Quay ngược', 'to{transform:rotate(-360deg)}', '12s', 'linear'],
  ['nhap-nhay', 'Nhấp nháy dịu', '50%{opacity:.45}', '2.6s'], ['quy-dao', 'Quỹ đạo', 'from{transform:rotate(0) translateX(5px) rotate(0)}to{transform:rotate(360deg) translateX(5px) rotate(-360deg)}', '5s', 'linear'],
  ['lac-lu', 'Lắc lư', '50%{transform:rotate(6deg)}', '2.8s'], ['song', 'Gợn sóng', '50%{transform:translateY(-4px)}', '1.6s'],
  ['cot-nhac', 'Cột nhạc', '50%{transform:scaleY(.35)}', '1.1s'], ['radar', 'Quét radar', 'to{transform:rotate(360deg)}', '3s', 'linear'],
  ['vong-lan', 'Vòng lan', '0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.8);opacity:0}', '2.2s', 'ease-out'],
  ['cham-song', 'Chấm sóng', '0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}', '1.3s'],
  ['lac-nhe', 'Lắc nhẹ', '0%,90%,100%{transform:rotate(0)}93%{transform:rotate(-8deg)}96%{transform:rotate(8deg)}', '4s'],
  ['lap-lanh', 'Lấp lánh', '0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.5);opacity:.3}', '2.4s'],
  ['con-lac', 'Con lắc', '0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}', '2.4s'],
  ['kim-dong-ho', 'Kim đồng hồ', 'to{transform:rotate(360deg)}', '6s', 'steps(12)'],
  ['bong-bong', 'Bong bóng', '0%{transform:translateY(6px) scale(.8);opacity:0}30%{opacity:1}100%{transform:translateY(-14px) scale(1);opacity:0}', '3s', 'ease-out'],
  ['sao-choi', 'Sao chổi', '0%{transform:translateX(-10px);opacity:0}30%{opacity:1}100%{transform:translateX(14px);opacity:0}', '2.6s'],
  ['dom-dom', 'Đom đóm', '25%{transform:translate(4px,-3px)}50%{transform:translate(-2px,-6px)}75%{transform:translate(-5px,-1px)}', '5s'],
  ['lat-qua-lai', 'Lật qua lại', '50%{transform:perspective(200px) rotateY(180deg)}', '4s'],
  ['lo-xo', 'Lò xo', '0%,100%{transform:scaleY(1)}30%{transform:scaleY(.7)}60%{transform:scaleY(1.15)}', '1.8s'],
  ['chay-ngang', 'Chạy ngang', 'from{transform:translateX(-6px)}to{transform:translateX(6px)}', '1.6s', 'ease-in-out', 'alternate'],
  ['con-tro', 'Con trỏ nhấp', '50%{opacity:0}', '1s', 'steps(1)'], ['luc-giac', 'Lục giác xoay', 'to{transform:rotate(60deg)}', '2.5s'],
  ['dap', 'Đập', '0%,100%{transform:scale(1)}50%{transform:scale(1.15)}', '1.2s'],
  ['rung', 'Rung nhắc', '0%,92%,100%{transform:translateX(0)}94%{transform:translateX(-2px)}96%{transform:translateX(2px)}98%{transform:translateX(-1px)}', '5s'],
  ['phat', 'Phát tín hiệu', '0%{transform:scale(1);opacity:1}70%{transform:scale(1.5);opacity:0}100%{opacity:0}', '1.8s', 'ease-out'],
  ['soc', 'Sọc chạy', 'from{transform:translateX(0)}to{transform:translateX(16px)}', '.9s', 'linear'],
  ['bay-len', 'Bay lên', '0%{transform:translateY(0);opacity:1}100%{transform:translateY(-10px);opacity:0}', '2.2s'],
  ['xoay-3d', 'Xoay 3D', 'to{transform:perspective(200px) rotateY(360deg)}', '5s', 'linear'],
  ['nhay', 'Nhảy', '0%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}60%{transform:translateY(-8px)}', '2s'],
  ['trung', 'Trứng lắc', '0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}', '1.6s'],
  ['dong-ho-cat', 'Đồng hồ cát', '0%,40%{transform:rotate(0)}50%,90%{transform:rotate(180deg)}100%{transform:rotate(360deg)}', '4s'],
  ['ngoi-sao', 'Ngôi sao', '0%,100%{transform:rotate(0) scale(1)}50%{transform:rotate(36deg) scale(1.15)}', '3s'],
  ['lan-song', 'Lan sóng', '0%{transform:scaleX(.2);opacity:.8}100%{transform:scaleX(1);opacity:0}', '2s', 'ease-out'],
  ['chao', 'Chao nghiêng', '0%,100%{transform:skewX(0)}50%{transform:skewX(-8deg)}', '3s'],
  ['tien-lui', 'Tiến lùi', '0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}', '1.4s'],
  ['phong-xep', 'Phồng xẹp', '0%,100%{transform:scale(1,1)}50%{transform:scale(1.1,.9)}', '2s'],
  ['vong-xoay', 'Vòng xoay tròn', 'to{transform:rotate(360deg)}', '1.4s', 'linear'],
  ['nhi-nhay', 'Nhí nhảy', '0%,100%{transform:translate(0,0)}25%{transform:translate(2px,-3px)}50%{transform:translate(0,-5px)}75%{transform:translate(-2px,-3px)}', '2.2s'],
  ['cuon-so', 'Cuộn số', '0%,45%{transform:translateY(0)}50%,95%{transform:translateY(-3px)}', '3s'],
  ['dan', 'Dàn trải', '0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.25)}', '2.6s'],
  ['tho-sau', 'Thở sâu', '0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.88);opacity:.7}', '4.4s'],
  ['dao-chieu', 'Đảo chiều', '0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}', '3.4s'],
];

// ---- D. HIỆU ỨNG DỮ LIỆU / GIAO DIỆN (do JS chạy) — tên để liệt kê, mỗi cái có hàm hoặc chỗ gắn bên dưới / trong app.js
export const DU_LIEU = [
  'Đếm số chạy lên', 'Vẽ vòng phần trăm', 'Lấp thanh so ngưỡng', 'Vạch ngưỡng rơi xuống', 'Cột biểu đồ mọc lên lần lượt',
  'Nhãn giá trị cột hiện dần', 'Bảng xếp hạng đổi chỗ mượt (FLIP)', 'Mũi tên tăng/giảm hạng', 'Pháo giấy khi vượt ngưỡng',
  'Pháo hoa khi cả tổ vượt ngưỡng', 'Huy hiệu bật ra', 'Thông báo trượt lên', 'Thanh đếm lùi thông báo', 'Chuyển tab có hướng',
  'Chuyển tháng mờ chéo', 'Thanh tiến độ cuộn trang', 'Đầu trang thu gọn khi cuộn', 'Nút lên đầu hiện/ẩn', 'Lộ dần khi cuộn tới',
  'Danh sách thêm lần lượt', 'Khung chờ lấp lánh khi giải mã', 'Lắc ô khi sai mật khẩu', 'Khoá mở quai', 'Mở khoá phóng ra',
  'Ô nhập nhô lên khi gõ', 'Nút chờ quay', 'Gợn sóng khi bấm', 'Rung máy khi bấm (điện thoại)', 'Ô lịch nhiệt bật lần lượt',
  'Chip lọc nảy', 'Nghiêng thẻ theo chuột', 'Nút hút theo chuột', 'Đốm sáng theo chuột', 'Hạt bay nền', 'Hạt nối dây',
  'Chữ gõ máy', 'Tiêu đề hiện từng chữ', 'Số lật khi cập nhật', 'Số chớp khi đổi giá trị', 'Báo "đã cập nhật" mượt',
  'Ô tab đang chọn trượt tới', 'Đếm tiền có đơn vị', 'Kim phần trăm trên vòng', 'Vương miện người đứng đầu', 'Sao nổ khi rê huy hiệu',
  'Tia sét biểu tượng tổ điện', 'Sọc chạy trên thanh vượt ngưỡng', 'Bóng chú thích cột bật', 'Chấm thẻ mới nhấp', 'Biểu tượng hiệu ứng xoay khi bật',
  'Logo quay khi tải số liệu', 'Dòng thẻ trượt khi lọc', 'Lưới nền hero trôi', 'Vạch ngưỡng nhịp khi vượt', 'Giữ đúng vị trí cuộn khi cập nhật',
];

const ma = (s) => s.replace(/[^a-z0-9-]/g, '');
export const DANH_MUC = [
  ...VAO.map((v) => ({ nhom: 'Vào cảnh', ten: v[1], cls: 'hv-' + v[0] })),
  ...Object.entries(VAO_KF).map(([k, v]) => ({ nhom: 'Vào cảnh', ten: v[0], cls: 'hv-' + k })),
  ...RE.map((v) => ({ nhom: 'Rê chuột / bấm', ten: v[1], cls: 'hr-' + v[0] })),
  ...LAP.map((v) => ({ nhom: 'Chuyển động nền', ten: v[1], cls: 'hl-' + v[0] })),
  ...DU_LIEU.map((t) => ({ nhom: 'Dữ liệu / giao diện', ten: t })),
];
export const CLS_VAO = DANH_MUC.filter((d) => d.nhom === 'Vào cảnh').map((d) => d.cls);
export const CLS_RE = RE.map((v) => 'hr-' + v[0]);
export const CLS_LAP = LAP.map((v) => 'hl-' + v[0]);

// ---- Sinh CSS
export function napCss() {
  let css = '';
  for (const [k, , tu, goc] of VAO) {
    css += `@keyframes hv-${k}{from{opacity:0;transform:${tu}}}.hv-${k}{animation:hv-${k} .62s var(--ra) both;animation-delay:var(--tre,0ms)${goc ? `;transform-origin:${goc}` : ''}}\n`;
  }
  for (const [k, [, kf]] of Object.entries(VAO_KF)) css += `@keyframes hv-${k}{${kf}}.hv-${k}{animation:hv-${k} .8s var(--ra) both;animation-delay:var(--tre,0ms)}\n`;
  for (const [k, , rule] of RE) {
    const sel = `.hr-${k}`;
    css += `${sel}{transition:transform var(--vua) var(--ra),background var(--vua),border-color var(--vua),color var(--vua)}\n`;
    css += rule.includes('&') ? rule.split('&').map((r, i) => (i === 0 ? sel + r : sel + r)).join('\n') + '\n' : `${sel}${rule}\n`;
  }
  css += RE_KF + '\n';
  for (const [k, , kf, tg, ease = 'ease-in-out', dir = 'normal'] of LAP) {
    css += `@keyframes hl-${k}{${kf}}.hl-${k}{animation:hl-${k} ${tg} ${ease} infinite ${dir};animation-delay:var(--tre2,0ms)}\n`;
  }
  css += '.dung-lap,.dung-lap *{animation-play-state:paused!important}\n';
  const st = document.createElement('style');
  st.id = 'hieu-ung-css';
  st.textContent = css;
  document.head.appendChild(st);
}

// Gán xoay vòng để MỌI hiệu ứng trong danh mục đều được dùng
let iVao = 0, iRe = 0, iLap = 0;
export const vao = (tre = 0) => `${CLS_VAO[iVao++ % CLS_VAO.length]}" style="--tre:${tre}ms`;
export const re = () => CLS_RE[iRe++ % CLS_RE.length];
export const lap = (tre = 0) => `${CLS_LAP[iLap++ % CLS_LAP.length]}" style="--tre2:${tre}ms`;
// Mỗi tab bắt đầu ở một chỗ khác trong danh mục -> 5 tab cộng lại phủ hết; cùng tab vẽ lại thì gán y hệt (không nhảy kiểu)
export const datLai = (goc = 0) => { iVao = goc * 11; iRe = goc * 9; iLap = goc * 9; };

export const batHieuUng = () => !document.documentElement.classList.contains('hu-tat');

// ---- Đếm số
export function demSo(el, den, { so = 1, sau = '', truoc = '', tg = 1100 } = {}) {
  const dinh = (n) => truoc + Number(n).toLocaleString('vi-VN', { maximumFractionDigits: so, minimumFractionDigits: 0 }) + sau;
  if (!batHieuUng()) { el.textContent = dinh(den); return; }
  const tu = Number(el.dataset.cu || 0);
  const t0 = performance.now();
  const buoc = (t) => {
    const p = Math.min(1, (t - t0) / tg);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = dinh(tu + (den - tu) * e);
    if (p < 1) requestAnimationFrame(buoc);
  };
  requestAnimationFrame(buoc);
  el.dataset.cu = den;
}

// ---- Gợn sóng khi bấm + rung máy
export function gonSong(e) {
  const nut = e.target.closest('button, a.hang, a.tab-o, .loc button, .thang button');
  if (!nut || !batHieuUng()) return;
  const r = nut.getBoundingClientRect();
  const s = document.createElement('span');
  const d = Math.max(r.width, r.height) * 2;
  s.style.cssText = `position:absolute;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px;width:${d}px;height:${d}px;border-radius:50%;background:currentColor;opacity:.18;pointer-events:none;transform:scale(0);transition:transform .5s var(--ra),opacity .6s`;
  if (getComputedStyle(nut).position === 'static') nut.style.position = 'relative';
  nut.style.overflow = 'hidden';
  nut.appendChild(s);
  requestAnimationFrame(() => { s.style.transform = 'scale(1)'; s.style.opacity = '0'; });
  setTimeout(() => s.remove(), 650);
  if (navigator.vibrate && matchMedia('(pointer:coarse)').matches) navigator.vibrate(8);
}

// ---- Nghiêng thẻ theo chuột, nút hút theo chuột, đốm sáng theo chuột (gom về rAF)
export function theoChuot() {
  if (!matchMedia('(hover:hover)').matches) return;
  let cho = null;
  addEventListener('pointermove', (e) => {
    if (cho) return;
    cho = requestAnimationFrame(() => {
      cho = null;
      if (!batHieuUng()) return;
      const nghieng = e.target.closest('[data-nghieng]');
      document.querySelectorAll('[data-nghieng].dang-nghieng').forEach((el) => { if (el !== nghieng) { el.style.transform = ''; el.classList.remove('dang-nghieng'); } });
      if (nghieng) {
        const r = nghieng.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        nghieng.classList.add('dang-nghieng');
        nghieng.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
        const den = nghieng.querySelector('.den-roi');
        if (den) den.style.transform = `translate(${e.clientX - r.left - 90}px, ${e.clientY - r.top - 90}px)`;
      }
      const hut = e.target.closest('[data-hut]');
      document.querySelectorAll('[data-hut].dang-hut').forEach((el) => { if (el !== hut) { el.style.transform = ''; el.classList.remove('dang-hut'); } });
      if (hut) {
        const r = hut.getBoundingClientRect();
        hut.classList.add('dang-hut');
        hut.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1)}px)`;
      }
    });
  }, { passive: true });
}

// ---- Hạt bay nền + nối dây (canvas, dừng khi tab ẩn / tắt hiệu ứng)
export function hatNen(cv) {
  const ctx = cv.getContext('2d');
  let w, h, hat = [], chay = true;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const co = () => {
    w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
    const n = Math.round(Math.min(70, innerWidth / 22));
    hat = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25 * dpr, vy: (Math.random() - .5) * .25 * dpr, r: (Math.random() * 1.4 + .6) * dpr }));
  };
  co(); addEventListener('resize', co, { passive: true });
  document.addEventListener('visibilitychange', () => { chay = !document.hidden; if (chay) requestAnimationFrame(ve); });
  const ve = () => {
    if (!chay) return;
    if (!batHieuUng()) { ctx.clearRect(0, 0, w, h); setTimeout(() => requestAnimationFrame(ve), 500); return; }
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(160,175,190,.55)';
    for (const p of hat) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    const tam = 120 * dpr;
    ctx.lineWidth = dpr * .6;
    for (let i = 0; i < hat.length; i++) for (let j = i + 1; j < hat.length; j++) {
      const a = hat[i], b = hat[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < tam * tam) { ctx.strokeStyle = `rgba(110,168,254,${(.16 * (1 - Math.sqrt(d2) / tam)).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    requestAnimationFrame(ve);
  };
  requestAnimationFrame(ve);
}

// ---- Pháo giấy / pháo hoa (phần tử DOM, chỉ transform + opacity)
const MAU = ['#3ddc97', '#f5b93b', '#6ea8fe', '#e5484d', '#eceef0'];
export function phaoGiay(x = innerWidth / 2, y = innerHeight / 3, n = 70, kieu = 'giay') {
  if (!batHieuUng()) return;
  const khu = document.createElement('div');
  khu.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden';
  document.body.appendChild(khu);
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    const goc = kieu === 'hoa' ? (i / n) * 6.283 : -Math.PI / 2 + (Math.random() - .5) * 2.2;
    const tam = kieu === 'hoa' ? 140 + Math.random() * 60 : 180 + Math.random() * 260;
    const dx = Math.cos(goc) * tam, dy = Math.sin(goc) * tam + (kieu === 'hoa' ? 40 : 320);
    const kt = kieu === 'hoa' ? 5 : 6 + Math.random() * 6;
    s.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${kt}px;height:${kieu === 'hoa' ? kt : kt * .45}px;border-radius:${kieu === 'hoa' ? '50%' : '2px'};background:${MAU[i % MAU.length]};transition:transform ${1.1 + Math.random() * .7}s cubic-bezier(.15,.7,.3,1),opacity 1.6s ease-in;`;
    khu.appendChild(s);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      s.style.transform = `translate(${dx}px,${dy}px) rotate(${Math.random() * 720 - 360}deg)`;
      s.style.opacity = '0';
    }));
  }
  setTimeout(() => khu.remove(), 2200);
}

// ---- Thông báo
export function bao(chu) {
  const khu = document.getElementById('toast');
  const t = document.createElement('div');
  t.className = 'toast hv-len';
  t.innerHTML = `${chu}<i></i>`;
  khu.appendChild(t);
  const vach = t.querySelector('i');
  vach.style.transition = 'transform 3s linear';
  requestAnimationFrame(() => requestAnimationFrame(() => { vach.style.transform = 'scaleX(0)'; }));
  setTimeout(() => { t.style.transition = 'opacity .25s, transform .25s'; t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 3000);
  setTimeout(() => t.remove(), 3300);
}

// ---- Lộ dần khi cuộn tới + dừng vòng lặp ngoài màn hình
let ioLo = null, ioLap = null;
export function theoDoi(goc) {
  ioLo ??= new IntersectionObserver((ds) => ds.forEach((d) => {
    if (d.isIntersecting) { d.target.classList.add('da-lo'); ioLo.unobserve(d.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  ioLap ??= new IntersectionObserver((ds) => ds.forEach((d) => d.target.classList.toggle('dung-lap', !d.isIntersecting)));
  goc.querySelectorAll('[data-lo]').forEach((el) => ioLo.observe(el));
  goc.querySelectorAll('.vung').forEach((el) => ioLap.observe(el));
}

// ---- Chữ gõ máy
export function goMay(el, chu, toc = 38) {
  if (!batHieuUng()) { el.textContent = chu; return; }
  el.textContent = '';
  let i = 0;
  const go = () => { el.textContent = chu.slice(0, ++i); if (i < chu.length) setTimeout(go, toc); };
  go();
}
