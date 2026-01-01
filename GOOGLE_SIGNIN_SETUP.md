# Google Sign-In Kurulum Rehberi

Bu rehber, Google Sign-In hatasını çözmek için gerekli adımları içerir.

## Yaygın Hatalar ve Çözümleri

### DEVELOPER_ERROR (code: 10)

Bu hata, Google Cloud Console yapılandırmasında bir sorun olduğunu gösterir.

## Adım Adım Kurulum

### 1. Firebase Console Ayarları

1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. Projenizi seçin
3. **Build** > **Authentication** > **Sign-in method** bölümüne gidin
4. **Google** sign-in method'unu etkinleştirin
5. Support email seçin ve kaydedin

### 2. Google Cloud Console Ayarları

1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin
2. Projenizi seçin (Firebase projenizle aynı)
3. **APIs & Services** > **Credentials** bölümüne gidin

#### 2.1. WEB Client ID Oluşturma

1. **Create Credentials** > **OAuth client ID** seçin
2. **Application type**: **Web application** seçin
3. Bir isim verin (örn: "Salah Web Client")
4. **Authorized redirect URIs** ekleyin (Firebase otomatik ekler)
5. **Create** butonuna tıklayın
6. **Client ID**'yi kopyalayın (bu WEB client ID'dir)

#### 2.2. Android Client ID Oluşturma

1. **Create Credentials** > **OAuth client ID** seçin
2. **Application type**: **Android** seçin
3. Bir isim verin (örn: "Salah Android Client")
4. **Package name**: `com.salah` (android/app/build.gradle'daki applicationId ile aynı olmalı)
5. **SHA-1 certificate fingerprint** ekleyin (aşağıdaki adımlara bakın)
6. **Create** butonuna tıklayın

### 3. SHA-1 Fingerprint Ekleme

SHA-1 fingerprint'i almak için:

#### Debug Keystore (Geliştirme)

```bash
# Windows
cd android
gradlew signingReport

# Mac/Linux
cd android
./gradlew signingReport
```

Çıktıda `SHA1:` ile başlayan değeri kopyalayın.

#### Release Keystore (Production)

Eğer release build için keystore kullanıyorsanız:

```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

### 4. webClientId Güncelleme

`src/services/authService.ts` dosyasında `webClientID` değerini güncelleyin:

```typescript
GoogleSignin.configure({
  webClientId: 'YOUR-WEB-CLIENT-ID.apps.googleusercontent.com', // WEB client ID (Android değil!)
});
```

**ÖNEMLİ**: `webClientId` mutlaka **WEB** client ID olmalı, Android client ID değil!

### 5. Package Name Kontrolü

`android/app/build.gradle` dosyasında `applicationId` değerini kontrol edin:

```gradle
defaultConfig {
    applicationId "com.salah"  // Bu değer Google Cloud Console'daki package name ile aynı olmalı
}
```

### 6. Uygulamayı Yeniden Build Edin

```bash
# Android
npm run android

# iOS (eğer iOS kullanıyorsanız)
npm run ios
```

## Sorun Giderme

### Hata: "DEVELOPER_ERROR" veya "code: 10"

1. ✅ Firebase Console'da Google Sign-In method aktif mi?
2. ✅ `webClientId` WEB client ID mi? (Android client ID değil!)
3. ✅ Package name (`com.salah`) Google Cloud Console'da kayıtlı mı?
4. ✅ SHA-1 fingerprint eklenmiş mi?
5. ✅ Uygulama yeniden build edildi mi?

### Hata: "A non-recoverable sign in failure occurred"

- Google hesabınızı cihazdan kaldırıp tekrar ekleyin
- Uygulamayı kaldırıp yeniden yükleyin

### Hata: "Sign in result is cancelled"

- Bu genellikle kullanıcı iptal ettiğinde olur
- Eğer kullanıcı iptal etmediyse, DEVELOPER_ERROR çözümlerini kontrol edin

## Test Etme

1. Uygulamayı çalıştırın
2. Profil ekranına gidin
3. "Google ile Giriş Yap" butonuna tıklayın
4. Google hesabınızı seçin
5. Başarılı giriş yapılmalı

## Kaynaklar

- [React Native Google Sign-In Dokümantasyonu](https://react-native-google-signin.github.io/docs/)
- [Troubleshooting Rehberi](https://react-native-google-signin.github.io/docs/troubleshooting)
- [Firebase Authentication Dokümantasyonu](https://firebase.google.com/docs/auth)

