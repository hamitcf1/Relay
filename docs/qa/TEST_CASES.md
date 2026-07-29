# Aetherius Relay - QA Test Cases & Rationale Document

Bu doküman, Aetherius Relay projesi için yazılan tüm E2E (End-to-End) test senaryolarını, testlerin **neyi ve niye test ettiğini (gerekçesini)**, adım adım test prosedürlerini ve beklenen sonuçları içerir.

---

## 1. Public & Marketing Pages (`TC-PUB`)

### `TC-PUB-001`: Landing Page Yüklenmesi, Buton Etkileşimi ve Yönlendirme Kontrolü
- **Modül**: Public / Marketing
- **Neyi Test Ediyoruz?**: Ana sayfanın hero bölümündeki CTA butonlarının tıklanabilirliğini, buton etkileşimlerini ve `/pricing` sayfasına doğru yönlendirme yapıldığını.
- **Niye Test Ediyoruz?**: Potansiyel müşterilerin pazarlama sayfasında CTA butonlarına tıkladıklarında teklif/fiyatlandırma sayfalarına kesintisiz ulaşmasını garanti etmek.
- **Ön Koşullar**: Dev/Preview sunucusu aktif.
- **Test Adımları**:
  1. `http://localhost:5173/` adresine git.
  2. Hero CTA butonlarının görünür olduğunu doğrula.
  3. "Pricing" veya ilgili CTA butonuna tıkla.
  4. URL'nin `/pricing` olarak değiştiğini doğrula.
- **Beklenen Sonuç**: Buton tıklaması sonrası sayfa sorunsuz yönlendirilir.

---

### `TC-PUB-002`: Fiyatlandırma (Pricing) Sayfası Paket Kartları ve Aksiyon Butonları
- **Modül**: Public / Marketing
- **Neyi Test Ediyoruz?**: Fiyatlandırma sayfasında paket içeriklerinin, başlıkların ve kaydol/demo butonlarının ekranda görüntülendiğini.
- **Niye Test Ediyoruz?**: Satış ve paket inceleme adımlarında fiyatlandırma verilerinin eksiksiz görüntülenmesini doğrulamak.
- **Ön Koşullar**: `/pricing` sayfası yüklendi.
- **Test Adımları**:
  1. `/pricing` URL'sine git.
  2. Başlık ve fiyatlandırma plan kartlarını kontrol et.
  3. Aksiyon butonlarının erişilebilir olduğunu doğrula.
- **Beklenen Sonuç**: Fiyatlandırma kartları ekranda eksiksiz görünür.

---

### `TC-PUB-003`: Özellikler (Features) Sayfası ve Modül Detayları
- **Modül**: Public / Features
- **Neyi Test Ediyoruz?**: Özellikler sayfasının içerik başlıklarını ve modül kartlarını yüklediğini.
- **Niye Test Ediyoruz?**: Otel yönetim sisteminin sunduğu modüllerin pazarlama sayfasında hatasız gösterimini denetlemek.
- **Ön Koşullar**: `/features` sayfası yüklendi.
- **Test Adımları**:
  1. `/features` adresine git.
  2. Sayfa içi başlık ve modül tanımlarını doğrula.
- **Beklenen Sonuç**: Özellik modülleri başarıyla render edilir.

---

### `TC-PUB-004`: Yasal Dokümanlar (Privacy & Terms) Başlık ve Metin Kontrolü
- **Modül**: Public / Legal
- **Neyi Test Ediyoruz?**: Gizlilik Politikası ve Kullanım Koşulları sayfalarının başlıklarının ve metinlerinin eksiksiz yüklendiğini.
- **Niye Test Ediyoruz?**: KVKK/GDPR uyumluluğu ve kurumsal otel müşterilerinin sözleşmesel gereksinimleri için yasal sayfaların sürekli erişilebilir kalması zorunludur.
- **Ön Koşullar**: Sunucu aktif.
- **Test Adımları**:
  1. `/legal/privacy` adresine git ve başlığı kontrol et.
  2. `/legal/terms` adresine git ve şartlar başlığını kontrol et.
- **Beklenen Sonuç**: Yasal doküman başlıkları ve metinleri eksiksiz görüntülenir.

---

## 2. Authentication & Route Security (`TC-AUTH`)

### `TC-AUTH-001`: Giriş Yap (Login) Formu Veri Girişi, Şifre Göster/Gizle ve Navigasyon
- **Modül**: Authentication
- **Neyi Test Ediyoruz?**: Kullanıcının e-posta (`#email`) ve şifre (`#password`) girebildiğini, şifre göster/gizle ikonuna tıklanabildiğini ve anasayfaya dönüş linkinin çalıştığını.
- **Niye Test Ediyoruz?**: Otel personelinin sisteme giriş kapısıdır. Form girdi alanlarının tepkiselliği ve şifre görünürlük geçişleri kullanıcı deneyimi için kritiktir.
- **Ön Koşullar**: `/login` sayfası yüklendi.
- **Test Adımları**:
  1. `/login` sayfasına git.
  2. `#email` alanına `reception@hotelrelay.com` yaz ve input değerini doğrula.
  3. `#password` alanına `SecurePass123!` yaz ve değeri doğrula.
  4. Şifre gizleme/gösterme ikonuna tıkla.
  5. "Ana sayfaya dön" linkine tıkla ve `/` yönlendirmesini doğrula.
- **Beklenen Sonuç**: Form girdileri kabul edilir, buton tıklamaları doğru tepki verir.

---

### `TC-AUTH-002`: Korumalı Rota (Protected Route) Güvenlik Yönlendirmesi
- **Modül**: Auth Security / Protected Routes
- **Neyi Test Ediyoruz?**: Oturum açmamış bir kullanıcının doğrudan `/dashboard` URL'sine erişmeye çalıştığında sistemin yetkisiz erişimi engelleyip otomatik olarak `/login` sayfasına yönlendirdiğini.
- **Niye Test Ediyoruz?**: Multi-tenant ve hassas otel operasyon verilerini içeren panellere yetkisiz kişilerin erişmesini engellemek en temel güvenlik gereksinimidir.
- **Ön Koşullar**: Oturum açılmamış.
- **Test Adımları**:
  1. Adres çubuğuna doğrudan `http://localhost:5173/dashboard` yaz.
  2. Yönlendirmeyi izle.
- **Beklenen Sonuç**: Sistem oturum olmadığını algılar ve `/login` sayfasına yönlendirir.

---

## 3. Live Demo & Sandbox Interactive Features (`TC-DEMO`)

### `TC-DEMO-001`: Live Demo Rol Seçim Kartlarının Görüntülenmesi
- **Modül**: Live Demo Simulation
- **Neyi Test Ediyoruz**: Live Demo sayfasında GM ve Resepsiyonist demo role kartlarının butonlarıyla birlikte görüntülendiğini.
- **Niye Test Ediyoruz**: Potansiyel müşterilerin demoda deneyeceği rolleri görmesini denetlemek.
- **Ön Koşullar**: `/live-demo` sayfası açıldı.
- **Test Adımları**:
  1. `/live-demo` adresine git.
  2. Demo kartlarını ve butonlarını kontrol et.
- **Beklenen Sonuç**: Rol kartları ve butonlar görünürdür.

---

### `TC-DEMO-002`: Live Demo Rol Seçimi ve Dashboard Paneline Otomatik Giriş
- **Modül**: Live Demo Simulation & Auth
- **Neyi Test Ediyoruz**: Demo kartındaki "Giriş Yap" butonuna tıklandığında demo kullanıcısı oturumunun oluşturulup doğrudan `/dashboard` paneline aktarıldığını.
- **Niye Test Ediyoruz**: Kullanıcının hiç kayıt olmadan tek tıkla sistemi canlı olarak deneyimleyebilmesini garanti etmek.
- **Ön Koşullar**: Kullanıcı `/live-demo` sayfasındadır.
- **Test Adımları**:
  1. `/live-demo` sayfasında demo giriş butonuna tıkla.
  2. Otomatik yönlendirmeyi izle.
  3. URL'nin `/dashboard` olduğunu ve panellerin yüklendiğini doğrula.
- **Beklenen Sonuç**: Demo oturumu açılır, kullanıcı `/dashboard` ekranına yönlendirilir.

---

## 4. Operational Dashboard & User Experience (`TC-DASH`)

### `TC-DASH-001`: Mobil Ekran Düzeni ve Taşma Engelleme Kontrolü
- **Modül**: Responsive / Mobile Experience
- **Neyi Test Ediyoruz?**: Aetherius Relay arayüzünün mobil ekranlarda (Mobile Chrome / Pixel 5 emülasyonu) taşma yapmadan, dokunmatik ekranlara uygun düzenlendiğini.
- **Niye Test Ediyoruz?**: Mobil cihazlarda yatay kaydırma oluşması kullanıcı deneyimini bozar.
- **Ön Koşullar**: Mobile viewport cihaz konfigürasyonu aktif.
- **Test Adımları**:
  1. Mobil görünümde `/` adresine git.
  2. Ekranın yatay kaydırma (horizontal scroll) yapmadığını (`scrollWidth === innerWidth`) doğrula.
- **Beklenen Sonuç**: Mobil düzende hiçbir bileşen dışarı taşmaz.
