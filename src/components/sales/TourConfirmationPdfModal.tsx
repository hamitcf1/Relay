import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Printer, Download, Share2, Globe, ShieldCheck, CheckCircle2, Clock, User, FileText, X, Car, Shirt, Compass, MapPin, Plane } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { formatDisplayDate } from '@/lib/utils'
import type { Sale, SaleType } from '@/types'
import { toast } from 'sonner'
import { RelayMark } from '@/components/brand/RelayBrand'

export type ConfirmationLanguage = 'tr' | 'en' | 'ru'

interface TourConfirmationPdfModalProps {
    isOpen: boolean
    onClose: () => void
    sale: Sale | null
}

interface ConfirmationTexts {
    title: string
    subtitle: string
    welcome: string
    guestSection: string
    guidelinesTitle: string
    pickupHeader: string
    pickupText: string
    bringHeader: string
    bringText: string
    policyHeader: string
    policyText: string
    supportHeader: string
    supportText: string
    voucherHeader: string
    passTag: string
    labels: {
        guestName: string
        roomNo: string
        phone: string
        serviceName: string
        serviceDate: string
        saleDate: string
        pickupTime: string
        pickupLocation: string
        dropoffLocation?: string
        flightNumber?: string
        pax: string
        price: string
        paymentStatus: string
        reservationCode: string
        issuedBy: string
        verifiedStamp: string
    }
}

const SERVICE_CONFIRMATION_TEXTS: Record<SaleType, Record<ConfirmationLanguage, ConfirmationTexts>> = {
    tour: {
        tr: {
            title: 'TUR REZERVASYON KONFİRME BELGESİ',
            subtitle: 'Aetherius Concierge Hizmetleri · Resmi Bilet & Bilgilendirme Belgesi',
            welcome: 'Değerli Misafirimiz, otelimiz aracılığıyla gerçekleştirmiş olduğunuz tur rezervasyonunuz başarıyla konfirme edilmiştir. Hizmet detayları, kalkış bilgileri ve seyahatiniz esnasında dikkat etmeniz gereken önemli hususlar aşağıda sunulmuştur.',
            guestSection: 'Rezervasyon & Hizmet Detayları',
            guidelinesTitle: 'Önemli Tur Bilgilendirmesi & Katılım Koşulları',
            pickupHeader: '1. Transfer & Alış Saati:',
            pickupText: 'Lütfen belirtilen teslim alma saatinden en az 15 dakika önce otel lobisinde / resepsiyon alanında hazır bulunuz. Transfer aracımız sırayla farklı otellerden misafir topladığı için trafik durumuna bağlı olarak ±10 dakikalık esneklik olabilmektedir.',
            bringHeader: '2. Yanınızda Bulundurmanız Gerekenler:',
            bringText: 'Tur günü lütfen geçerli bir fotoğraflı kimlik veya pasaportunuzu, güneş gözlüğü, koruyucu krem, rahat yürüyüş ayakkabısı ve kişisel harcamalarınız için bir miktar nakit paranızı yanınızda bulundurunuz.',
            policyHeader: '3. Değişiklik & İptal Şartları:',
            policyText: 'Tur saati veya tarihindeki olası değişiklik veya iptal taleplerinizi tur saatinden en az 24 saat önce resepsiyon / konsiyerj masamıza iletmeniz gerekmektedir.',
            supportHeader: '4. 7/24 Misafir Destek Hattı:',
            supportText: 'Tur esnasında veya öncesinde her türlü acil durum, soru ve bilgi talepleriniz için otel iletişim numaramız +90 539 516 07 60 (WhatsApp & 7/24 Aramalar) üzerinden bizimle anında iletişime geçebilirsiniz.',
            voucherHeader: 'RESMİ TUR VOUCHER & GİRİŞ BİLETİ (TUR PASS)',
            passTag: 'TOUR PASS',
            labels: {
                guestName: 'Misafir Adı',
                roomNo: 'Oda No',
                phone: 'İletişim Tel',
                serviceName: 'Tur / Aktivite Adı',
                serviceDate: 'Hizmet Tarihi',
                saleDate: 'Satış Tarihi',
                pickupTime: 'Alış / Pick-up Saati',
                pickupLocation: 'Alınış Noktası',
                pax: 'Kişi Sayısı (Pax)',
                price: 'Toplam Tutar',
                paymentStatus: 'Ödeme Durumu',
                reservationCode: 'Rezervasyon No',
                issuedBy: 'Düzenleyen Personel',
                verifiedStamp: 'Resmi Onaylı Bilet'
            }
        },
        en: {
            title: 'OFFICIAL TOUR BOOKING CONFIRMATION',
            subtitle: 'Aetherius Concierge Network · Official Voucher & Guidelines Pass',
            welcome: 'Dear Guest, your tour booking arranged via our concierge desk has been officially confirmed. Please find your complete itinerary, service details, and essential tour instructions below.',
            guestSection: 'Booking & Guest Information',
            guidelinesTitle: 'Essential Tour Instructions & Guidelines',
            pickupHeader: '1. Pickup & Departure Instructions:',
            pickupText: 'Please be ready in the hotel lobby/reception area at least 15 minutes before your scheduled pickup time. As our shared transfer vehicle collects guests from multiple locations, a minor flexibility window of ±10 minutes may apply due to local traffic.',
            bringHeader: '2. What to Bring:',
            bringText: 'Kindly carry a valid photo ID or passport, sunglasses, sun protection, comfortable walking footwear, and local currency for personal expenses or souvenirs.',
            policyHeader: '3. Cancellation & Modification Policy:',
            policyText: 'Any changes to your schedule or cancellations must be communicated to our front desk / concierge team at least 24 hours prior to departure.',
            supportHeader: '4. 24/7 Concierge Guest Support:',
            supportText: 'For any immediate inquiries, questions, or assistance before or during your excursion, our hotel line +90 539 516 07 60 is open 24/7 for calls and WhatsApp messages.',
            voucherHeader: 'OFFICIAL TOUR VOUCHER & ENTRY PASS',
            passTag: 'TOUR PASS',
            labels: {
                guestName: 'Guest Name',
                roomNo: 'Room No',
                phone: 'Phone Number',
                serviceName: 'Tour / Excursion',
                serviceDate: 'Service Date',
                saleDate: 'Booking Date',
                pickupTime: 'Pickup Time',
                pickupLocation: 'Pickup Location',
                pax: 'Pax Count',
                price: 'Total Amount',
                paymentStatus: 'Payment Status',
                reservationCode: 'Reservation Ref',
                issuedBy: 'Issued By',
                verifiedStamp: 'Official Confirmed Pass'
            }
        },
        ru: {
            title: 'ОФИЦИАЛЬНОЕ ПОДТВЕРЖДЕНИЕ БРОНИРОВАНИЯ ТУРА',
            subtitle: 'Aetherius Concierge Services · Официальный Ваучер и Билет',
            welcome: 'Уважаемый Гость, ваше бронирование тура, оформленное через консьерж-службу отеля, успешно подтверждено. Ниже приведены детали поездки и важные инструкции для участников.',
            guestSection: 'Детали Бронирования и Гостя',
            guidelinesTitle: 'Важная Информация и Правила Участия',
            pickupHeader: '1. Трансфер и Время Сбора:',
            pickupText: 'Пожалуйста, будьте в лобби отеля / на ресепшене за 15 минут до указанного времени сбора. Поскольку трансфер собирает гостей из нескольких отелей, возможна небольшая задержка (±10 минут) из-за дорожной обстановки.',
            bringHeader: '2. Что Необходим Взять с Собой:',
            bringText: 'Возьмите с собой удостоверение личности / паспорт, солнцезащитные очки, крем от солнца, удобную обувь и немного наличных для личных расходов.',
            policyHeader: '3. Изменение и Отмена:',
            policyText: 'Любые изменения даты/времени или отмена бронирования должны быть согласованы с ресепшеном не менее чем за 24 часа до выезда.',
            supportHeader: '4. Круглосуточная Служба Поддержки:',
            supportText: 'По всем срочным вопросам или за помощью до и во время тура вы можете связаться с ресепшен отеля по телефону +90 539 516 07 60 (WhatsApp и звонки 24/7).',
            voucherHeader: 'ОФИЦИАЛЬНЫЙ ВАУЧЕР И ВХОДНОЙ БИЛЕТ',
            passTag: 'TOUR PASS',
            labels: {
                guestName: 'Имя Гостя',
                roomNo: 'Номер Комнаты',
                phone: 'Телефон',
                serviceName: 'Название Тура',
                serviceDate: 'Дата Проведения',
                saleDate: 'Дата Бронирования',
                pickupTime: 'Время Сбора',
                pickupLocation: 'Место Сбора',
                pax: 'Человек (Pax)',
                price: 'Общая Стоимость',
                paymentStatus: 'Статус Оплаты',
                reservationCode: 'Код Брони',
                issuedBy: 'Оформил',
                verifiedStamp: 'Подтвержденный Билет'
            }
        }
    },
    transfer: {
        tr: {
            title: 'TRANSFER REZERVASYON KONFİRME BELGESİ',
            subtitle: 'Aetherius Concierge Hizmetleri · VIP Transfer Voucher & Araç Pass',
            welcome: 'Değerli Misafirimiz, otelimiz tarafından organize edilen özel transfer hizmetiniz konfirme edilmiştir. Transfer güzergahı, kalkış/varış saatleri ve araç detayları aşağıda belirtilmiştir.',
            guestSection: 'Transfer & Yolcu Detayları',
            guidelinesTitle: 'Önemli Transfer Bilgilendirmesi & Karşılama Kuralları',
            pickupHeader: '1. Karşılama & Alış Noktası:',
            pickupText: 'Havalimanı karşılamalarında sürücümüz sizi çıkış kapısında isminizin yazılı olduğu tabela ile bekleyecektir. Otel çıkışlarında lütfen belirtilen saatten 10 dakika önce lobide hazır bulununuz.',
            bringHeader: '2. Uçuş Takibi & Rötar:',
            bringText: 'Havalimanı transferlerinde uçuş numaranız canlı olarak takip edilmektedir. Uçuş saatinizdeki olası rötarlarda karşılama saati otomatik güncellenir.',
            policyHeader: '3. Bagaj & Kişi Kapasitesi:',
            policyText: 'Lütfen araç kapasitesine uygun sayıda bagaj ve yolcu ile katılım sağlayınız. Ekstra bagaj veya çocuk koltuğu taleplerinizi transfer öncesinde bildiriniz.',
            supportHeader: '4. 7/24 Transfer Destek Hattı:',
            supportText: 'Transfer esnasında şoför konumu veya acil bildirimler için otel iletişim numaramız +90 539 516 07 60 (WhatsApp & 7/24 Aramalar) üzerinden bizimle anında iletişime geçebilirsiniz.',
            voucherHeader: 'RESMİ VIP TRANSFER VOUCHER & ARAÇ BİLETİ (TRANSFER PASS)',
            passTag: 'TRANSFER PASS',
            labels: {
                guestName: 'Yolcu Adı',
                roomNo: 'Oda No',
                phone: 'İletişim Tel',
                serviceName: 'Transfer Güzergahı',
                serviceDate: 'Transfer Tarihi',
                saleDate: 'Satış Tarihi',
                pickupTime: 'Alış / Saat',
                pickupLocation: 'Nereden (Alınış)',
                dropoffLocation: 'Nereye (Varış)',
                flightNumber: 'Uçuş No',
                pax: 'Yolcu Sayısı (Pax)',
                price: 'Toplam Tutar',
                paymentStatus: 'Ödeme Durumu',
                reservationCode: 'Rezervasyon No',
                issuedBy: 'Düzenleyen Personel',
                verifiedStamp: 'Resmi Onaylı Transfer'
            }
        },
        en: {
            title: 'OFFICIAL TRANSFER BOOKING CONFIRMATION',
            subtitle: 'Aetherius Concierge Network · VIP Transfer Pass & Travel Voucher',
            welcome: 'Dear Guest, your private transfer service arranged by our concierge desk has been officially confirmed. Please review your pickup details, route, and driver instructions below.',
            guestSection: 'Transfer & Passenger Details',
            guidelinesTitle: 'Important Transfer & Greeting Instructions',
            pickupHeader: '1. Pickup & Greeting Point:',
            pickupText: 'For airport arrivals, our driver will greet you at the arrival hall exit holding a name sign. For hotel departures, please be ready in the lobby 10 minutes prior to scheduled pickup time.',
            bringHeader: '2. Flight Monitoring & Delays:',
            bringText: 'Your flight number is monitored in real time. Pickup schedules automatically adapt to flight delays or schedule adjustments.',
            policyHeader: '3. Luggage & Capacity:',
            policyText: 'Please ensure passenger count and luggage quantity match your reservation details. Notify concierge desk in advance for oversized luggage or child seat requests.',
            supportHeader: '4. 24/7 Concierge Transfer Line:',
            supportText: 'For real-time driver updates or urgent queries, contact our hotel helpline +90 539 516 07 60 (WhatsApp & 24/7 Calls).',
            voucherHeader: 'OFFICIAL VIP TRANSFER VOUCHER & VEHICLE PASS',
            passTag: 'TRANSFER PASS',
            labels: {
                guestName: 'Passenger Name',
                roomNo: 'Room No',
                phone: 'Phone Number',
                serviceName: 'Transfer Route',
                serviceDate: 'Transfer Date',
                saleDate: 'Booking Date',
                pickupTime: 'Pickup Time',
                pickupLocation: 'Pickup Point',
                dropoffLocation: 'Dropoff Point',
                flightNumber: 'Flight No',
                pax: 'Passenger Count',
                price: 'Total Amount',
                paymentStatus: 'Payment Status',
                reservationCode: 'Reservation Ref',
                issuedBy: 'Issued By',
                verifiedStamp: 'Official Confirmed Pass'
            }
        },
        ru: {
            title: 'ОФИЦИАЛЬНОЕ ПОДТВЕРЖДЕНИЕ ТРАНСФЕРА',
            subtitle: 'Aetherius Concierge Services · Трансферный Ваучер и Пропуск',
            welcome: 'Уважаемый Гость, ваша услуга трансфера, организованная отелем, успешно подтверждена. Ниже приведены детали маршрута, время выезда и важная информация.',
            guestSection: 'Детали Трансфера и Пассажира',
            guidelinesTitle: 'Важные Инструкции и Правила Встречи',
            pickupHeader: '1. Место Встречи и Сбора:',
            pickupText: 'При встрече в аэропорту водитель будет ожидать вас на выходе из терминала с табличкой. При выезде из отеля будьте в лобби за 10 минут до назначенного времени.',
            bringHeader: '2. Отслеживание Рейса:',
            bringText: 'Мы отслеживаем статус вашего рейса в реальном времени. В случае задержки вылета время встречи будет скорректировано.',
            policyHeader: '3. Багаж и Пассажиры:',
            policyText: 'Убедитесь, что количество багажа и пассажиров соответствует заявленному при бронировании.',
            supportHeader: '4. Круглосуточная Поддержка:',
            supportText: 'По вопросам встречи или связи с водителем обращайтесь по телефону +90 539 516 07 60 (WhatsApp и звонки 24/7).',
            voucherHeader: 'ОФИЦИАЛЬНЫЙ ТРАНСФЕРНЫЙ ВАУЧЕР И ПРОПУСК',
            passTag: 'TRANSFER PASS',
            labels: {
                guestName: 'Имя Пассажира',
                roomNo: 'Номер Комнаты',
                phone: 'Телефон',
                serviceName: 'Маршрут Трансфера',
                serviceDate: 'Дата Трансфера',
                saleDate: 'Дата Бронирования',
                pickupTime: 'Время Встречи',
                pickupLocation: 'Откуда',
                dropoffLocation: 'Куда',
                flightNumber: 'Рейс №',
                pax: 'Пассажиров',
                price: 'Общая Стоимость',
                paymentStatus: 'Статус Оплаты',
                reservationCode: 'Код Брони',
                issuedBy: 'Оформил',
                verifiedStamp: 'Подтвержденный Ваучер'
            }
        }
    },
    laundry: {
        tr: {
            title: 'ÇAMAŞIRHANE & KURU TEMİZLEME HİZMET BELGESİ',
            subtitle: 'Aetherius Concierge Hizmetleri · Resmi Teslimat Fişi & Yıkama Formu',
            welcome: 'Değerli Misafirimiz, otelimiz bünyesindeki çamaşırhane / kuru temizleme hizmet talebiniz başarıyla alınmış ve işleme konulmuştur. Ürün detayları ve teslimat koşulları aşağıda yer almaktadır.',
            guestSection: 'Çamaşırhane & Teslimat Detayları',
            guidelinesTitle: 'Hizmet Talimatları & Hijyen Standartları',
            pickupHeader: '1. Teslim Alma & Teslimat Süresi:',
            pickupText: 'Giysileriniz oda numaranızdan teslim alınmış olup, profesyonel yıkama/ütüleme işlemlerinin ardından en geç 24 saat içerisinde odanıza teslim edilecektir.',
            bringHeader: '2. Kumaş & Yıkama Talimatı:',
            bringText: 'Tüm ürünler etiket üzerindeki bakım talimatlarına göre yıkanmaktadır. Hassas kumaşlar veya leke müdahalesi gerektiren ürünler özel işleme tabi tutulur.',
            policyHeader: '3. Sorumluluk & Kontrol:',
            policyText: 'Teslim edilen ürün adet ve durum kontrolleri resepsiyon ekibimiz tarafından yapılmıştır. Lütfen teslimat anında giysilerinizi kontrol ediniz.',
            supportHeader: '4. 7/24 Resepsiyon Destek Hattı:',
            supportText: 'Teslimat saati hızlandırma veya ek talimatlar için otel iletişim numaramız +90 539 516 07 60 (WhatsApp & 7/24 Aramalar) üzerinden bizimle iletişime geçebilirsiniz.',
            voucherHeader: 'RESMİ ÇAMAŞIRHANE TESLİMAT FİŞİ & KUPONU (LAUNDRY PASS)',
            passTag: 'LAUNDRY PASS',
            labels: {
                guestName: 'Misafir Adı',
                roomNo: 'Oda No',
                phone: 'İletişim Tel',
                serviceName: 'Çamaşırhane / Ürün Detayı',
                serviceDate: 'Alım Tarihi',
                saleDate: 'Kayıt Tarihi',
                pickupTime: 'Tahmini Teslimat',
                pickupLocation: 'Teslim Adresi',
                pax: 'Parça Sayısı (Adet)',
                price: 'Toplam Tutar',
                paymentStatus: 'Ödeme Durumu',
                reservationCode: 'Takip / Fiş No',
                issuedBy: 'Teslim Alan Personel',
                verifiedStamp: 'Resmi Onaylı Fiş'
            }
        },
        en: {
            title: 'LAUNDRY & DRY CLEANING SERVICE RECEIPT',
            subtitle: 'Aetherius Concierge Network · Official Laundry Voucher & Delivery Pass',
            welcome: 'Dear Guest, your laundry and dry cleaning request has been received and processed. Details of your garments, pickup time, and service terms are specified below.',
            guestSection: 'Laundry & Delivery Information',
            guidelinesTitle: 'Service Guidelines & Quality Standards',
            pickupHeader: '1. Pickup & Delivery Window:',
            pickupText: 'Your garments have been collected from your room and will be cleaned, ironed, and delivered back to your room within 24 hours.',
            bringHeader: '2. Fabric & Care Handling:',
            bringText: 'All garments are treated according to their fabric care labels. Delicate materials or specific stain treatments undergo premium specialized processing.',
            policyHeader: '3. Inspection & Policy:',
            policyText: 'Garments have been counted and inspected upon pickup. Please review your items upon room delivery.',
            supportHeader: '4. 24/7 Front Desk Helpline:',
            supportText: 'For delivery status updates or special requests, please call +90 539 516 07 60 (WhatsApp & 24/7 Calls).',
            voucherHeader: 'OFFICIAL LAUNDRY SERVICE RECEIPT & CLAIM VOUCHER',
            passTag: 'LAUNDRY PASS',
            labels: {
                guestName: 'Guest Name',
                roomNo: 'Room No',
                phone: 'Phone Number',
                serviceName: 'Laundry Item / Service',
                serviceDate: 'Pickup Date',
                saleDate: 'Order Date',
                pickupTime: 'Est. Delivery Time',
                pickupLocation: 'Delivery Location',
                pax: 'Item Count (Pieces)',
                price: 'Total Amount',
                paymentStatus: 'Payment Status',
                reservationCode: 'Receipt Ref',
                issuedBy: 'Handled By',
                verifiedStamp: 'Official Service Voucher'
            }
        },
        ru: {
            title: 'КВИТАНЦИЯ УСЛУГ ПРАЧЕЧНОЙ И ХИМЧИСТКИ',
            subtitle: 'Aetherius Concierge Services · Официальная Квитанция и Ваучер',
            welcome: 'Уважаемый Гость, ваш запрос на услуги прачечной и химчистки принят и находится в работе. Ниже приведены детали заказа и условия доставки.',
            guestSection: 'Детали Заказа и Доставки',
            guidelinesTitle: 'Инструкции и Стандарты Обслуживания',
            pickupHeader: '1. Сбор и Сроки Доставки:',
            pickupText: 'Вещи приняты из вашего номера и после чистки/глажки будут доставлены обратно в номер в течение 24 часов.',
            bringHeader: '2. Обработка Тканей:',
            bringText: 'Все изделия обрабатываются в соответствии с инструкциями на ярлыках.',
            policyHeader: '3. Проверка и Гарантия:',
            policyText: 'Количество вещей проверено при приеме. Пожалуйста, проверьте вещи при получении.',
            supportHeader: '4. Круглосуточная Поддержка:',
            supportText: 'По вопросам доставки обращайтесь по телефону +90 539 516 07 60 (WhatsApp и звонки 24/7).',
            voucherHeader: 'ОФИЦИАЛЬНАЯ КВИТАНЦИЯ И ВАУЧЕР ПРАЧЕЧНОЙ',
            passTag: 'LAUNDRY PASS',
            labels: {
                guestName: 'Имя Гостя',
                roomNo: 'Номер Комнаты',
                phone: 'Телефон',
                serviceName: 'Услуги Прачечной',
                serviceDate: 'Дата Приема',
                saleDate: 'Дата Оформления',
                pickupTime: 'Время Доставки',
                pickupLocation: 'Место Доставки',
                pax: 'Количество (Штук)',
                price: 'Общая Стоимость',
                paymentStatus: 'Статус Оплаты',
                reservationCode: 'Код Заказа',
                issuedBy: 'Принял',
                verifiedStamp: 'Подтвержденная Квитанция'
            }
        }
    },
    other: {
        tr: {
            title: 'RESMİ HİZMET REZERVASYON KONFİRME BELGESİ',
            subtitle: 'Aetherius Concierge Hizmetleri · Resmi Hizmet Voucher & Bilet',
            welcome: 'Değerli Misafirimiz, otelimiz konsiyerj birimi aracılığıyla talep etmiş olduğunuz hizmet rezervasyonunuz başarıyla konfirme edilmiştir. Hizmet detayları aşağıda sunulmuştur.',
            guestSection: 'Rezervasyon & Hizmet Detayları',
            guidelinesTitle: 'Önemli Hizmet Bilgilendirmesi & Koşullar',
            pickupHeader: '1. Hizmet Saati & Randevu:',
            pickupText: 'Lütfen rezervasyon saatinizden en az 10 dakika önce belirtilen alanda veya resepsiyonda hazır bulunuz.',
            bringHeader: '2. Gereksinimler:',
            bringText: 'Lütfen geçerli oda kartınızı veya kimliğinizi yanınızda bulundurunuz.',
            policyHeader: '3. İptal & Değişiklik:',
            policyText: 'Randevu değişikliklerinizi en az 12 saat öncesinden resepsiyon masamıza bildirmeniz gerekmektedir.',
            supportHeader: '4. 7/24 Misafir Destek Hattı:',
            supportText: 'Her türlü acil durum ve bilgi talepleriniz için otel iletişim numaramız +90 539 516 07 60 (WhatsApp & 7/24 Aramalar) üzerinden ulaşabilirsiniz.',
            voucherHeader: 'RESMİ KONSİYERJ HİZMET VOUCHER (SERVICE PASS)',
            passTag: 'SERVICE PASS',
            labels: {
                guestName: 'Misafir Adı',
                roomNo: 'Oda No',
                phone: 'İletişim Tel',
                serviceName: 'Hizmet Adı',
                serviceDate: 'Hizmet Tarihi',
                saleDate: 'Satış Tarihi',
                pickupTime: 'Randevu / Saat',
                pickupLocation: 'Hizmet Noktası',
                pax: 'Kişi / Adet',
                price: 'Toplam Tutar',
                paymentStatus: 'Ödeme Durumu',
                reservationCode: 'Rezervasyon No',
                issuedBy: 'Düzenleyen Personel',
                verifiedStamp: 'Resmi Onaylı Bilet'
            }
        },
        en: {
            title: 'OFFICIAL SERVICE BOOKING CONFIRMATION',
            subtitle: 'Aetherius Concierge Network · Official Service Voucher & Pass',
            welcome: 'Dear Guest, your concierge service booking has been officially confirmed. Please review your service itinerary and details below.',
            guestSection: 'Booking & Guest Details',
            guidelinesTitle: 'Essential Service Guidelines & Terms',
            pickupHeader: '1. Appointment & Timing:',
            pickupText: 'Please arrive at the designated service location or front desk 10 minutes prior to your appointment time.',
            bringHeader: '2. Requirements:',
            bringText: 'Kindly carry your room key card or photo ID.',
            policyHeader: '3. Modification Policy:',
            policyText: 'Schedule alterations should be communicated to the front desk at least 12 hours prior to service time.',
            supportHeader: '4. 24/7 Concierge Support:',
            supportText: 'For immediate assistance, contact our hotel helpline +90 539 516 07 60 (WhatsApp & 24/7 Calls).',
            voucherHeader: 'OFFICIAL CONCIERGE SERVICE VOUCHER & PASS',
            passTag: 'SERVICE PASS',
            labels: {
                guestName: 'Guest Name',
                roomNo: 'Room No',
                phone: 'Phone Number',
                serviceName: 'Service Name',
                serviceDate: 'Service Date',
                saleDate: 'Booking Date',
                pickupTime: 'Appointment Time',
                pickupLocation: 'Service Point',
                pax: 'Pax / Units',
                price: 'Total Amount',
                paymentStatus: 'Payment Status',
                reservationCode: 'Reservation Ref',
                issuedBy: 'Issued By',
                verifiedStamp: 'Official Service Pass'
            }
        },
        ru: {
            title: 'ОФИЦИАЛЬНОЕ ПОДТВЕРЖДЕНИЕ УСЛУГИ',
            subtitle: 'Aetherius Concierge Services · Официальный Ваучер Услуг',
            welcome: 'Уважаемый Гость, ваш запрос на услугу, оформленный через консьерж-службу, успешно подтвержден. Ниже приведены детали заказа.',
            guestSection: 'Детали Заказа и Гостя',
            guidelinesTitle: 'Важные Инструкции и Правила',
            pickupHeader: '1. Время и Запись:',
            pickupText: 'Пожалуйста, будьте на месте оказания услуги за 10 минут до назначенного времени.',
            bringHeader: '2. Документы:',
            bringText: 'Имейте при себе карту от номера или удостоверение личности.',
            policyHeader: '3. Отмена и Изменения:',
            policyText: 'Просим сообщать об изменениях не менее чем за 12 часов.',
            supportHeader: '4. Круглосуточная Поддержка:',
            supportText: 'По всем вопросам обращайтесь по телефону +90 539 516 07 60 (WhatsApp и звонки 24/7).',
            voucherHeader: 'ОФИЦИАЛЬНЫЙ ВАУЧЕР УСЛУГ',
            passTag: 'SERVICE PASS',
            labels: {
                guestName: 'Имя Гостя',
                roomNo: 'Номер Комнаты',
                phone: 'Телефон',
                serviceName: 'Название Услуги',
                serviceDate: 'Дата Услуги',
                saleDate: 'Дата Оформления',
                pickupTime: 'Время Записи',
                pickupLocation: 'Место Оказания',
                pax: 'Человек / Штук',
                price: 'Общая Стоимость',
                paymentStatus: 'Статус Оплаты',
                reservationCode: 'Код Заказа',
                issuedBy: 'Оформил',
                verifiedStamp: 'Подтвержденный Ваучер'
            }
        }
    }
}

export function TourConfirmationPdfModal({ isOpen, onClose, sale }: TourConfirmationPdfModalProps) {
    const { hotel } = useHotelStore()
    const { language: appLang } = useLanguageStore()
    const [docLang, setDocLang] = useState<ConfirmationLanguage>(() => {
        if (appLang === 'ru') return 'ru'
        if (appLang === 'en') return 'en'
        return 'tr'
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const docRef = useRef<HTMLDivElement>(null)

    if (!sale) return null

    const saleType: SaleType = sale.type in SERVICE_CONFIRMATION_TEXTS ? sale.type : 'tour'
    const texts = SERVICE_CONFIRMATION_TEXTS[saleType][docLang]
    const reservationCode = sale.reservation_code || (`RES-${sale.id.slice(0, 6).toUpperCase()}`)
    const collected = sale.collected_amount ?? (sale.payment_status === 'paid' ? sale.total_price : 0)
    const remaining = Math.max(0, sale.total_price - collected)

    // QR Payload
    const qrData = (() => {
        if (typeof window === 'undefined') return ''
        try {
            const rawPayload = {
                v: 2,
                id: sale.id,
                r: reservationCode,
                hn: (hotel?.info?.name || 'AETHERIUS').slice(0, 30),
                n: (sale.name || '').slice(0, 45),
                t: sale.type,
                g: (sale.customer_name || '').slice(0, 60),
                rm: sale.room_number || '',
                d: sale.date ? (sale.date instanceof Date ? sale.date.toISOString().slice(0, 10) : String(sale.date).slice(0, 10)) : undefined,
                pt: sale.pickup_time || '',
                px: sale.pax,
                py: sale.payment_status,
                tp: sale.total_price,
                c: sale.currency
            }
            const jsonStr = JSON.stringify(rawPayload)
            const b64 = btoa(unescape(encodeURIComponent(jsonStr)))
            return `${window.location.origin}/voucher?id=${sale.id}&d=${b64}`
        } catch {
            return `${window.location.origin}/voucher?id=${sale.id}`
        }
    })()

    const handlePrintA4 = () => {
        window.print()
    }

    const handleDownloadPng = async () => {
        if (!docRef.current) return
        setIsGenerating(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 150))
            const dataUrl = await toPng(docRef.current, { quality: 1, pixelRatio: 3 })
            const link = document.createElement('a')
            link.download = `${saleType.toUpperCase()}-Confirmation-${reservationCode}-${docLang.toUpperCase()}.png`
            link.href = dataUrl
            link.click()
            toast.success('Konfirme belgesi yüksek kalitede indirildi!')
        } catch (error) {
            console.error('Failed to download confirmation PNG:', error)
            toast.error('Görsel indirilemedi. Lütfen yazdır seçeneğini kullanın.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: `${sale.name} Konfirme Belgesi`, url: qrData })
            } else {
                await navigator.clipboard.writeText(qrData)
                toast.success('Bilet ve konfirme bağlantısı kopyalandı!')
            }
        } catch (error) {
            if ((error as DOMException)?.name !== 'AbortError') toast.error('Paylaşılamadı.')
        }
    }

    // Type-specific badge & icon styling
    const headerBadgeStyle = saleType === 'transfer'
        ? { titleColor: 'text-sky-400', tagBg: 'bg-sky-400 text-zinc-950', icon: <Car className="w-3.5 h-3.5 text-sky-400" /> }
        : saleType === 'laundry'
        ? { titleColor: 'text-emerald-400', tagBg: 'bg-emerald-400 text-zinc-950', icon: <Shirt className="w-3.5 h-3.5 text-emerald-400" /> }
        : saleType === 'other'
        ? { titleColor: 'text-purple-400', tagBg: 'bg-purple-400 text-zinc-950', icon: <FileText className="w-3.5 h-3.5 text-purple-400" /> }
        : { titleColor: 'text-amber-400', tagBg: 'bg-amber-400 text-zinc-950', icon: <Compass className="w-3.5 h-3.5 text-amber-400" /> }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl bg-card border-border text-foreground p-0 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl [&>button:last-child]:hidden sm:[&>button:last-child]:hidden">
                <DialogTitle className="sr-only">A4 {texts.title}</DialogTitle>
                <DialogDescription className="sr-only">A4 Booking Confirmation Document with Voucher Pass</DialogDescription>

                {/* Top Control Toolbar (Hidden in print) */}
                <div className="flex flex-wrap items-center justify-between p-3.5 bg-muted/90 backdrop-blur-md border-b border-border/60 shrink-0 no-print gap-2">
                    {/* Language Switcher */}
                    <div className="flex items-center gap-1.5 bg-background/80 p-1 rounded-lg border border-border">
                        <Globe className="w-3.5 h-3.5 ml-1.5 text-primary" />
                        <span className="text-[11px] font-bold text-muted-foreground mr-1">Dil / Language:</span>
                        {(['tr', 'en', 'ru'] as const).map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setDocLang(lang)}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                                    docLang === lang
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {lang === 'tr' ? '🇹🇷 TR' : lang === 'en' ? '🇬🇧 EN' : '🇷🇺 RU'}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="h-8 text-xs gap-1 border-border/80"
                        >
                            <Share2 className="w-3.5 h-3.5" /> Paylaş
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isGenerating}
                            onClick={handleDownloadPng}
                            className="h-8 text-xs gap-1 border-border/80"
                        >
                            <Download className="w-3.5 h-3.5 text-primary" /> İndir (HD)
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrintA4}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-bold gap-1.5 shadow-md"
                        >
                            <Printer className="w-4 h-4" /> Yazdır / A4 PDF
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="h-8 text-xs gap-1 border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        >
                            <X className="w-3.5 h-3.5" /> Kapat
                        </Button>
                    </div>
                </div>

                {/* Printable Document Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-900/40 text-zinc-950 flex justify-center scrollbar-thin">
                    {/* A4 Sheet Container */}
                    <div
                        ref={docRef}
                        className="printable-area bg-white text-zinc-950 w-full max-w-[210mm] p-5 sm:p-8 print:p-4 shadow-2xl rounded-sm flex flex-col justify-between space-y-4 print:space-y-2.5 font-sans border border-zinc-200 relative select-text"
                        style={{ boxSizing: 'border-box' }}
                    >
                        {/* Top Header */}
                        <div>
                            <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-3.5 print:pb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="size-7 rounded-lg bg-zinc-950 p-1 flex items-center justify-center shrink-0 shadow-xs">
                                            <RelayMark className="size-4.5 text-amber-400" />
                                        </div>
                                        <h1 className="text-lg print:text-base font-black tracking-tight text-zinc-950 uppercase">
                                            {hotel?.info?.name || 'AETHERIUS RELAY CONCIERGE'}
                                        </h1>
                                    </div>
                                    <p className="text-[10px] print:text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-9">
                                        {texts.subtitle}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900 text-white rounded-md text-xs font-mono font-bold tracking-wider">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                        {reservationCode}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                                        {texts.labels.saleDate}: {formatDisplayDate(sale.sale_date || sale.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Document Title Bar */}
                            <div className="my-3.5 print:my-2 bg-zinc-950 text-white py-2 px-3.5 rounded-lg flex items-center justify-between shadow-sm">
                                <h2 className={`text-xs print:text-[11px] font-black uppercase tracking-wider ${headerBadgeStyle.titleColor} flex items-center gap-1.5`}>
                                    {headerBadgeStyle.icon}
                                    {texts.title}
                                </h2>
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {texts.labels.verifiedStamp}
                                </span>
                            </div>

                            {/* Welcome Note */}
                            <p className="text-xs print:text-[11px] text-zinc-700 leading-relaxed mb-3.5 print:mb-2 italic border-l-2 border-zinc-400 pl-2.5 py-0.5">
                                "{texts.welcome}"
                            </p>

                            {/* Guest & Service Summary Grid */}
                            <div className="bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 print:p-2.5 mb-4 print:mb-2.5 shadow-xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-250 pb-1.5 mb-2.5 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-zinc-600" />
                                    {texts.guestSection}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-xs print:text-[11px]">
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.guestName}</span>
                                        <span className="font-bold text-zinc-950">{sale.customer_name || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.roomNo}</span>
                                        <span className="font-bold text-zinc-950">{sale.room_number ? `Oda #${sale.room_number}` : '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.phone}</span>
                                        <span className="font-mono text-zinc-900">{sale.customer_phone || '—'}</span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-2">
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.serviceName}</span>
                                        <span className={`font-black text-xs ${headerBadgeStyle.titleColor.replace('text-', 'text-zinc-950 ')}`}>{sale.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.pax}</span>
                                        <span className="font-bold text-zinc-900">
                                            {sale.pax} {saleType === 'laundry' ? (docLang === 'tr' ? 'Parça' : 'Items') : (docLang === 'tr' ? 'Kişi' : 'Pax')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.serviceDate}</span>
                                        <span className="font-bold text-zinc-950">{formatDisplayDate(sale.date)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.pickupTime}</span>
                                        <span className="font-bold font-mono text-zinc-950 text-xs text-amber-700">🕒 {sale.pickup_time || '—'}</span>
                                    </div>

                                    {/* Type-Specific Route / Location Fields */}
                                    {saleType === 'transfer' ? (
                                        <>
                                            <div>
                                                <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.pickupLocation}</span>
                                                <span className="font-semibold text-zinc-900 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                                                    {sale.pickup_location || 'Otel Resepsiyon'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.dropoffLocation}</span>
                                                <span className="font-semibold text-zinc-900 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                                    {sale.dropoff_location || 'Havalimanı / Dest.'}
                                                </span>
                                            </div>
                                            {sale.flight_number && (
                                                <div>
                                                    <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.flightNumber}</span>
                                                    <span className="font-bold font-mono text-sky-700 flex items-center gap-1">
                                                        <Plane className="w-3 h-3 text-sky-600 shrink-0" />
                                                        {sale.flight_number}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div>
                                            <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.pickupLocation}</span>
                                            <span className="font-semibold text-zinc-900">
                                                {saleType === 'laundry'
                                                    ? (sale.room_number ? `Oda #${sale.room_number}` : 'Otel Resepsiyon')
                                                    : (sale.pickup_location || 'Otel Resepsiyon / Lobisi')}
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.price}</span>
                                        <span className="font-black font-mono text-xs text-zinc-950">{sale.total_price} {sale.currency}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.paymentStatus}</span>
                                        <span className={`font-bold text-[11px] ${remaining === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {remaining === 0 ? '✓ Ödendi (Paid)' : `Kalan: ${remaining} ${sale.currency}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold uppercase text-zinc-500 block">{texts.labels.issuedBy}</span>
                                        <span className="text-zinc-800">{sale.created_by_name || 'Resepsiyon'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Informative Instructions Section */}
                            <div className="space-y-2 mb-4 print:mb-2.5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    {texts.guidelinesTitle}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] print:text-[9.5px] leading-snug">
                                    <div className="p-2 print:p-1.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-0.5">
                                        <h4 className="font-bold text-zinc-900 text-[11px] print:text-[10px]">{texts.pickupHeader}</h4>
                                        <p className="text-zinc-700">{texts.pickupText}</p>
                                    </div>
                                    <div className="p-2 print:p-1.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-0.5">
                                        <h4 className="font-bold text-zinc-900 text-[11px] print:text-[10px]">{texts.bringHeader}</h4>
                                        <p className="text-zinc-700">{texts.bringText}</p>
                                    </div>
                                    <div className="p-2 print:p-1.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-0.5">
                                        <h4 className="font-bold text-zinc-900 text-[11px] print:text-[10px]">{texts.policyHeader}</h4>
                                        <p className="text-zinc-700">{texts.policyText}</p>
                                    </div>
                                    <div className="p-2 print:p-1.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-0.5">
                                        <h4 className="font-bold text-zinc-900 text-[11px] print:text-[10px]">{texts.supportHeader}</h4>
                                        <p className="text-zinc-700">{texts.supportText}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM SECTION: DIGITAL VOUCHER TICKET PASS (EN ALTTA) */}
                        <div className="border-t-2 border-dashed border-zinc-400 pt-3 print:pt-2 mt-auto">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    {texts.voucherHeader}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400">CUT OR KEEP WITH YOU</span>
                            </div>

                            {/* The Ticket Pass Box */}
                            <div className="bg-zinc-950 text-white rounded-xl p-3 print:p-2.5 shadow-lg border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden">
                                {/* Accent Side Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${headerBadgeStyle.tagBg.split(' ')[0]}`} />

                                <div className="pl-2.5 space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8.5px] font-mono font-bold ${headerBadgeStyle.tagBg} px-1.5 py-0.5 rounded uppercase`}>
                                            {texts.passTag}
                                        </span>
                                        <span className="text-[9.5px] font-mono text-zinc-400">{reservationCode}</span>
                                    </div>
                                    <h4 className="text-sm print:text-xs font-black text-white tracking-tight leading-tight">{sale.name}</h4>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] print:text-[10px] text-zinc-300">
                                        <span>👤 <strong>{sale.customer_name || 'Misafir'}</strong></span>
                                        {sale.room_number && <span>🏠 Oda: <strong>{sale.room_number}</strong></span>}
                                        <span>👥 <strong>{sale.pax} {saleType === 'laundry' ? 'Parça' : 'Pax'}</strong></span>
                                        <span>📅 <strong>{formatDisplayDate(sale.date)}</strong></span>
                                        {sale.pickup_time && <span>🕒 <strong>{sale.pickup_time}</strong></span>}
                                        {saleType === 'transfer' && sale.flight_number && (
                                            <span>✈️ <strong>{sale.flight_number}</strong></span>
                                        )}
                                    </div>
                                    <div className="text-[9px] text-zinc-400 font-mono pt-0.5">
                                        {hotel?.info?.name || 'Aetherius Concierge'} · Verified {texts.passTag}
                                    </div>
                                </div>

                                {/* QR Code & Scan Stub */}
                                <div className="bg-white p-2 rounded-xl text-zinc-950 flex flex-col items-center justify-center shrink-0 border border-zinc-200">
                                    {qrData && <QRCode value={qrData} size={66} level="M" />}
                                    <span className="text-[8.5px] font-mono font-bold text-zinc-700 mt-0.5 uppercase">
                                        {reservationCode}
                                    </span>
                                </div>
                            </div>

                            {/* Verification Footer */}
                            <div className="flex items-center justify-between pt-2 text-[8.5px] text-zinc-400 font-mono">
                                <span>{hotel?.info?.name || 'Aetherius Hotel Concierge Desk'} · İletişim / Contact: +90 539 516 07 60 (WhatsApp & 7/24)</span>
                                <span>Official Confirmation & {texts.passTag} · Generated Version 2.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export const ServiceConfirmationPdfModal = TourConfirmationPdfModal

