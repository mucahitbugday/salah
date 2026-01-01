# Google Sign-In Hatası Çözüm Rehberi

## SHA-1 Fingerprint (Debug)
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

## Package Name
```
com.salah
```

## Adım Adım Çözüm

### 1. Firebase Console Ayarları

1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. Projenizi seçin
3. **Build** > **Authentication** > **Sign-in method** bölümüne gidin
4. **Google** sign-in method'unu bulun ve **Enable** butonuna tıklayın
5. Support email seçin ve **Save** butonuna tıklayın

### 2. Google Cloud Console Ayarları

1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin
2. **Aynı Firebase projenizi** seçin (üstteki proje seçiciden)
3. **APIs & Services** > **Credentials** bölümüne gidin

#### 2.1. WEB Client ID Oluşturma (ÖNEMLİ!)

1. **+ CREATE CREDENTIALS** > **OAuth client ID** seçin
2. Eğer OAuth consent screen ayarlanmamışsa, önce onu ayarlayın
3. **Application type**: **Web application** seçin
4. **Name**: "Salah Web Client" gibi bir isim verin
5. **Authorized redirect URIs** bölümüne şunları ekleyin:
   - `https://YOUR-PROJECT-ID.firebaseapp.com/__/auth/handler`
   - Firebase Console'dan bu URL'yi alabilirsiniz
6. **CREATE** butonuna tıklayın
7. **Client ID**'yi kopyalayın (bu WEB client ID'dir!)
8. `src/services/authService.ts` dosyasındaki `webClientId` değerini bu ID ile değiştirin

**ÖNEMLİ**: `webClientId` mutlaka **WEB** client ID olmalı, Android client ID değil!

#### 2.2. Android Client ID Oluşturma

1. **+ CREATE CREDENTIALS** > **OAuth client ID** seçin
2. **Application type**: **Android** seçin
3. **Name**: "Salah Android Client" gibi bir isim verin
4. **Package name**: `com.salah` (tam olarak bu şekilde)
5. **SHA-1 certificate fingerprint**: 
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```
6. **CREATE** butonuna tıklayın

### 3. webClientId Güncelleme

`src/services/authService.ts` dosyasını açın ve `webClientId` değerini güncelleyin:

```typescript
GoogleSignin.configure({
  webClientId: 'YOUR-WEB-CLIENT-ID.apps.googleusercontent.com', // WEB client ID (Android değil!)
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});
```

**WEB Client ID formatı**: `XXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com`

### 4. Uygulamayı Yeniden Build Edin

```bash
# Android klasörüne gidin
cd android

# Temizlik yapın
.\gradlew clean

# Ana dizine dönün
cd ..

# Uygulamayı yeniden build edin
npm run android
```

### 5. Test Edin

1. Uygulamayı çalıştırın
2. Profil ekranına gidin
3. "Google ile Giriş Yap" butonuna tıklayın
4. Google hesabınızı seçin
5. Başarılı giriş yapılmalı

## Yaygın Hatalar

### Hata: "DEVELOPER_ERROR" veya "code: 10"

Bu hata, yapılandırma uyumsuzluğunu gösterir. Kontrol edin:

- ✅ Firebase Console'da Google Sign-In method aktif mi?
- ✅ `webClientId` WEB client ID mi? (Android client ID değil!)
- ✅ Package name (`com.salah`) Google Cloud Console'da kayıtlı mı?
- ✅ SHA-1 fingerprint eklenmiş mi?
- ✅ Uygulama yeniden build edildi mi?

### Hata: "A non-recoverable sign in failure occurred"

- Google hesabınızı cihazdan kaldırıp tekrar ekleyin
- Uygulamayı kaldırıp yeniden yükleyin
- Cihazı yeniden başlatın

### Hata: "Sign in result is cancelled"

- Bu genellikle kullanıcı iptal ettiğinde olur
- Eğer kullanıcı iptal etmediyse, DEVELOPER_ERROR çözümlerini kontrol edin

## Kaynaklar

- [React Native Google Sign-In Dokümantasyonu](https://react-native-google-signin.github.io/docs/)
- [Troubleshooting Rehberi](https://react-native-google-signin.github.io/docs/troubleshooting)
- [Firebase Authentication Dokümantasyonu](https://firebase.google.com/docs/auth)

