# Android App Publishing Progress - trongtaiso.pickleball

## Current Status (2026-05-23)

### Đã hoàn thành
- [x] Fly deploy thành công: `trongtaiso.fly.dev`, `trongtaiso.com`
- [x] Đã có sẵn Android project với Capacitor
- [x] App ID: `com.trongtaiso.pickleball`
- [x] Có android folder structure

### TODO List

#### 1. Sửa lỗi encoding app name (5 phút)
- File: `capacitor.config.ts`
- App name bị lỗi "Tr��?ng TA�i Pickleball" → cần thành "Trọng Tài Pickleball"
- Sau đó chạy: `npx cap sync android`

#### 2. Tạo App Icons (cần user cung cấp)
- Cần file PNG 1024x1024 pixel (icon chính)
- Icon này dùng cho Google Play Store listing
- Có thể dùng pwa-512x512.png làm temporary

#### 3. Cấu hình Google Play (cần user hành động)
- Tạo Google Play Developer Account ($25 one-time)
- Tạo app mới trên Play Console
- Tải `google-services.json` từ Firebase console (nếu dùng Firebase)
- Copy vào `android/app/google-services.json`

#### 4. Signing Configuration (cần user tạo keystore)
- Tạo keystore mới hoặc reuse keystore cũ
- Configure `build.gradle` với signing config
- Cần lưu trữ bảo mật: keystore file + passwords

#### 5. Build AAB Release
```bash
cd android
./gradlew assembleRelease
# Output: app-release.aab
```

#### 6. Upload lên Play Console
- Đăng nhập Play Console
- Tạo Production release
- Upload .AAB file
- Điền thông tin: description, screenshots, age rating...
- Submit for review

## Current Files Structure
```
android/
├── app/
│   ├── build.gradle
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── res/
│   │   │   ├── values/strings.xml (bị lỗi encoding)
│   │   │   ├── mipmap-*/ic_launcher*.png
│   │   │   └── ...
│   │   └── java/com/trongtaiso/pickleball/
│   │       └── MainActivity.java
│   └── google-services.json (CHƯA CÓ)
├── gradle.properties
├── variables.gradle
└── build.gradle
```

## Commands Reference
```bash
# Sync Capacitor
npx cap sync android

# Build debug APK (test)
cd android && ./gradlew assembleDebug

# Build release AAB
cd android && ./gradlew assembleRelease

# Open in Android Studio
npx cap open android
```

## Notes
- Keystore: CHƯA TẠO
- Google Services JSON: CHƯA CÓ
- App icon 1024x1024: CẦN USER CUNG CẤP