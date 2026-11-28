<div align="center">

# Điểm tháng · Tổ điện

**Bảng điểm hiệu suất hằng tháng của tổ điện — chấm từ thẻ việc Trello.**

<a href="https://tcl-da.github.io/diem-thang/"><img alt="Mở web Điểm tháng" src="https://img.shields.io/badge/M%E1%BB%9E%20WEB-tcl--da.github.io%2Fdiem--thang-3ddc97?style=for-the-badge&labelColor=1f2227"></a>

<a href="https://tcl-da.github.io/diem-thang/"><b>👉 tcl-da.github.io/diem-thang</b></a>

<img alt="Riêng tư" src="https://img.shields.io/badge/s%E1%BB%91%20li%E1%BB%87u-m%C3%A3%20ho%C3%A1%20AES--256-6ea8fe?style=flat-square&labelColor=2e333a">
<img alt="Cập nhật" src="https://img.shields.io/badge/t%E1%BB%B1%20c%E1%BA%ADp%20nh%E1%BA%ADt-20%3A00%20h%E1%BA%B1ng%20ng%C3%A0y-f5b93b?style=flat-square&labelColor=2e333a">
<img alt="Điện thoại" src="https://img.shields.io/badge/xem%20t%E1%BB%91t-%C4%91i%E1%BB%87n%20tho%E1%BA%A1i%20%2B%20m%C3%A1y%20t%C3%ADnh-c792ea?style=flat-square&labelColor=2e333a">

</div>

---

## Trên web có gì

| Tab | Nội dung |
|---|---|
| **Home** | Tổng điểm cả tổ so với ngưỡng, bảng xếp hạng, thành tích trong tháng, biểu đồ qua các tháng, lịch điểm, top 10 thẻ điểm cao |
| **Từng thành viên** | Điểm / ngưỡng từng người, thành tích, biểu đồ, lịch điểm, danh sách thẻ đã xong (lọc theo board), thẻ chưa có giờ, cách tính |

- Chọn tháng ở góc trên (T9 · T10 · T11…).
- Web **tự kiểm số liệu mới mỗi 5 phút** và khi quay lại tab — cập nhật tại chỗ, **giữ nguyên vị trí đang xem**.
- Hơn 200 hiệu ứng chuyển động; nút **Hiệu ứng** để tắt khi cần (số liệu vẫn hiện đủ).
- Nhập mật khẩu một lần, trình duyệt nhớ; nút **Khoá lại** để xoá.
- Cách tính điểm, ngưỡng và tên thành viên chỉ hiện **sau khi mở khoá**.

## Bảo mật

- Repo chỉ chứa **giao diện**. Số liệu nằm trong `du-lieu.enc.json`, mã hoá **AES-GCM 256**, khoá dẫn bằng **Argon2id** (64 MB × 4 vòng).
- Giải mã ngay trong trình duyệt khi nhập đúng mật khẩu — không có máy chủ nào thấy số liệu rõ.
- Số liệu được kéo từ Trello và đóng gói trên máy riêng mỗi tối 20:00, rồi mới đẩy lên.

| File | Là gì |
|---|---|
| `index.html` · `app.css` · `app.js` | Giao diện, giải mã, dựng trang |
| `hieu-ung.js` | Thư viện hiệu ứng (chỉ transform + opacity, mượt 120 Hz) |
| `lib/argon2.umd.min.js` | Thư viện Argon2id (hash-wasm) |
| `du-lieu.enc.json` | Số liệu đã mã hoá |
