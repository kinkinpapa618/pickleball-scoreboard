# Tiến độ công việc - Pickleball Scoreboard

## Ngày cập nhật: 2026-05-23

## 1. Database Configuration
- **Đã chuyển từ Neon PostgreSQL (cloud) sang PostgreSQL local**
  - Local: `postgresql://postgres:postgres@localhost:5432/pickleball`
  - Production: `postgresql://neondb_owner:npg_cQzBkwW0h4KF@ep-silent-base-a1guw7kr-pooler.ap-southeast-1.aws.neon.tech/neondb`

- **Đã cấu hình PostgreSQL local:**
  - Tạo database `pickleball`
  - Đặt password postgres = postgres
  - Tạo user admin với username/password: admin/admin

## 2. Chức năng đã sửa/xóa
- **Xóa chức năng "Bốc thăm"** trong RefereeTools.tsx
  - Xóa tab "Bốc thăm"
  - Xóa handleDraw function
  - Xóa tournamentGroups state
  - Xóa các import không sử dụng (Shuffle, ExcelUpload)

## 3. Timer & Timeline Fixes
- **Match.tsx (timer trong trận đấu):**
  - Sửa validation cho startTime parsing
  - Reset elapsedSeconds về 0 khi bắt đầu timer mới
  - Sửa pause/resume logic để timer tiếp tục đúng

- **MatchDetail.tsx (chi tiết trận đấu):**
  - Sửa duration calculation - tính từ timeline events khi endTime null
  - Thêm Math.max(0, ...) để tránh số âm

- **Timeline display:**
  - Thêm flex-row-reverse để sự kiện mới nhất hiển thị bên trái

## 4. Database Schema Fix
- **shared/schema.ts:**
  - endTime không còn default NOW() nữa (nullable)
  - Match live sẽ có endTime = null

- **server/storage.ts:**
  - createMatch luôn set endTime = null

## 5. Deployments

### Development (Local dev)
- App: đang chạy local với PostgreSQL local

### Production - Fly.io
| Environment | App Name | URL |
|-------------|----------|-----|
| DEV | pickleball-scoreboard | https://pickleball-scoreboard.fly.dev |
| PROD | trongtaiso | https://trongtaiso.fly.dev |

**Production app resources:**
- IP: 137.66.17.157
- Custom domain: trongtaiso.com (đã cấu hình SSL certificate)
- Cần thêm DNS records:
  - A record: @ -> 137.66.17.157
  - A record: www -> 137.66.17.157

### Frontend - Cloudflare Pages
- URL: https://b289aaa3.trong-tai-so.pages.dev

## 6. Files Changed
```
Modified:
  - .env (chuyển database URL)
  - Dockerfile (cập nhật build cho production)
  - client/src/lib/queryClient.ts
  - client/src/pages/Match.tsx (timer fix)
  - client/src/pages/MatchDetail.tsx (duration fix)
  - client/src/pages/RefereeTools.tsx (xóa bốc thăm)
  - fly.toml (cấu hình deploy)
  - server/storage.ts (endTime fix)
  - shared/schema.ts (endTime nullable)

New:
  - fly.toml.prod (config riêng cho production)
  - .github/workflows/fly-deploy.yml
```

## 7. Admin Credentials
```
Username: admin
Password: admin
```

## 8. Todo/Những việc cần làm
- [ ] Cấu hình DNS cho trongtaiso.com
- [ ] Test đăng nhập trên production
- [ ] Verify timer hoạt động đúng trên production