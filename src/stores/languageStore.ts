import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'en' | 'tr'

type Translations = {
    // Auth & Setup
    'auth.login': string
    'auth.register': string
    'auth.email': string
    'auth.password': string
    'auth.name': string
    'auth.noAccount': string
    'auth.haveAccount': string
    'setup.title': string
    'setup.subtitle': string
    'setup.joinExisting': string
    'setup.createNew': string
    'setup.hotelName': string
    'setup.address': string
    'setup.optional': string
    'setup.loading': string
    'setup.noHotels': string
    'setup.createSuccess': string
    'setup.joinSuccess': string

    // Dashboard
    'dashboard.welcome': string
    'dashboard.role': string
    'dashboard.startShift': string
    'dashboard.endShift': string
    'dashboard.actions': string
    'dashboard.rooms': string
    'dashboard.newLog': string

    // Status & Urgency
    'status.active': string
    'status.resolved': string
    'status.archived': string
    'status.open': string
    'urgency.low': string
    'urgency.medium': string
    'urgency.high': string
    'urgency.critical': string

    // Modules
    'module.activityFeed': string
    'module.stickyBoard': string
    'module.compliance': string
    'module.shiftNotes': string
    'module.hotelInfo': string
    'module.roster': string
    'module.calendar': string
    'module.maintenance': string
    'module.guest_request': string
    'module.complaint': string
    'module.system': string

    // Categories
    'category.handover': string
    'category.damage': string
    'category.guestInfo': string
    'category.earlyCheckout': string
    'category.maintenance': string
    'category.guest_request': string
    'category.complaint': string
    'category.system': string
    'category.other': string

    // Handover Wizard
    'handover.title': string
    'handover.step.tickets': string
    'handover.step.cash': string
    'handover.step.notes': string
    'handover.step.confirm': string
    'handover.tickets.desc': string
    'handover.cash.desc': string
    'handover.notes.desc': string
    'handover.confirm.desc': string
    'handover.cash.started': string
    'handover.cash.difference': string
    'handover.complete': string

    // Room Management
    'rooms.title': string
    'rooms.add': string
    'rooms.edit': string
    'rooms.number': string
    'rooms.floor': string
    'rooms.type': string
    'rooms.status': string
    'rooms.occupancy': string
    'rooms.vacant': string
    'rooms.occupied': string
    'rooms.clean': string
    'rooms.dirty': string
    'rooms.inspect': string
    'rooms.dnd': string

    // Common
    'common.add': string
    'common.cancel': string
    'common.save': string
    'common.delete': string
    'common.edit': string
    'common.viewAll': string
    'common.loading': string
    'common.room': string
    'common.amount': string
    'common.description': string
    'common.search': string
    'common.continue': string
    'common.back': string
    'common.confirm': string
    'dashboard.weeklySchedule': string
    'dashboard.activeHotelShift': string
    'dashboard.todaysAssignment': string
    'dashboard.assignedShift': string
    'dashboard.noAssignedShift': string
    'status.noActiveShift': string
    'status.low': string
    'status.medium': string
    'status.critical': string
    'common.by': string
    'handover.wizard': string
    'handover.noOpenTickets': string
    'handover.allClear': string
    'handover.cashEnd': string
    'handover.enterCash': string
    'handover.countCash': string
    'handover.notesDesc': string
    'handover.readyToComplete': string
    'handover.reviewSummary': string
    'handover.ticketsReviewed': string
    'handover.notes': string
    'log.new': string
    'log.edit': string
    'log.typeLabel': string
    'log.urgencyLabel': string
    'log.contentLabel': string
    'log.roomNumberLabel': string
    'log.create': string
    'log.save': string
    'log.enterContent': string
    'log.mustLogin': string
}

const translations: Record<Language, Translations> = {
    en: {
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.email': 'Email Address',
        'auth.password': 'Password',
        'auth.name': 'Full Name',
        'auth.noAccount': "Don't have an account?",
        'auth.haveAccount': 'Already have an account?',
        'setup.title': 'Select Your Hotel',
        'setup.subtitle': 'Join an existing hotel or create a new one',
        'setup.joinExisting': 'Join Existing',
        'setup.createNew': 'Create New',
        'setup.hotelName': 'Hotel Name',
        'setup.address': 'Address',
        'setup.optional': 'optional',
        'setup.loading': 'Loading hotels...',
        'setup.noHotels': 'No hotels found',
        'setup.createSuccess': 'Hotel created successfully',
        'setup.joinSuccess': 'Joined hotel successfully',

        'dashboard.welcome': 'Welcome back, {name}',
        'dashboard.role': 'Role: {role}',
        'dashboard.startShift': 'Start Shift',
        'dashboard.endShift': 'End Shift',
        'dashboard.actions': 'Actions',
        'dashboard.rooms': 'Rooms',
        'dashboard.newLog': 'New Log',
        'dashboard.weeklySchedule': 'My Weekly Schedule',
        'dashboard.activeHotelShift': 'Active Hotel Shift',
        'dashboard.todaysAssignment': "Today's Assignment",
        'dashboard.assignedShift': 'Assigned Shift',
        'dashboard.noAssignedShift': 'No shift assigned for today',

        'status.active': 'Active',
        'status.resolved': 'Resolved',
        'status.archived': 'Archived',
        'status.open': 'Open',
        'status.noActiveShift': 'No active shift',
        'status.low': 'Low',
        'status.medium': 'Medium',
        'status.critical': 'Critical',
        'urgency.low': 'Low',
        'urgency.medium': 'Medium',
        'urgency.high': 'High',
        'urgency.critical': 'Critical',

        'module.activityFeed': 'Live Activity Feed',
        'module.stickyBoard': 'Sticky Board',
        'module.compliance': 'Compliance Checklist',
        'module.shiftNotes': 'Shift Notes',
        'module.hotelInfo': 'Hotel Information',
        'module.roster': 'Staff Roster',
        'module.calendar': 'Calendar',
        'module.maintenance': 'Maintenance',
        'module.guest_request': 'Guest Request',
        'module.complaint': 'Complaint',
        'module.system': 'System',

        'category.handover': 'Handover',
        'category.damage': 'Damage',
        'category.guestInfo': 'Guest Info',
        'category.earlyCheckout': 'Early Checkout',
        'category.maintenance': 'Maintenance',
        'category.guest_request': 'Guest Request',
        'category.complaint': 'Complaint',
        'category.system': 'System',
        'category.other': 'Other',

        'handover.title': 'Handover Wizard',
        'handover.step.tickets': 'Review Open Tickets',
        'handover.step.cash': 'Cash Count',
        'handover.step.notes': 'Handover Notes',
        'handover.step.confirm': 'Confirm & Complete',
        'handover.tickets.desc': 'Acknowledge each open ticket before proceeding',
        'handover.cash.desc': 'Count all cash before handover',
        'handover.notes.desc': 'Leave any important notes for the next shift',
        'handover.confirm.desc': 'Review your handover summary',
        'handover.cash.started': 'Started with',
        'handover.cash.difference': 'Difference',
        'handover.complete': 'Complete Handover',

        'rooms.title': 'Room Management',
        'rooms.add': 'Add Room',
        'rooms.edit': 'Edit Room',
        'rooms.number': 'Room Number',
        'rooms.floor': 'Floor',
        'rooms.type': 'Room Type',
        'rooms.status': 'Status',
        'rooms.occupancy': 'Occupancy',
        'rooms.vacant': 'Vacant',
        'rooms.occupied': 'Occupied',
        'rooms.clean': 'Clean',
        'rooms.dirty': 'Dirty',
        'rooms.inspect': 'Inspect',
        'rooms.dnd': 'DND',

        'common.add': 'Add',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.viewAll': 'View All',
        'common.loading': 'Loading...',
        'common.room': 'Room',
        'common.amount': 'Amount',
        'common.description': 'Description',
        'common.search': 'Search...',
        'common.continue': 'Continue',
        'common.back': 'Back',
        'common.confirm': 'Confirm',
        'common.by': 'by',
        'handover.wizard': 'Handover Wizard',
        'handover.noOpenTickets': 'No open tickets!',
        'handover.allClear': 'All clear for handover',
        'handover.cashEnd': 'Cash End (₺)',
        'handover.enterCash': 'Enter cash on hand',
        'handover.countCash': 'Count all cash before handover',
        'handover.notesDesc': 'Leave any important notes for the next shift',
        'handover.readyToComplete': 'Ready to Complete Handover',
        'handover.reviewSummary': 'Review your handover summary',
        'handover.ticketsReviewed': 'Open Tickets Reviewed',
        'handover.notes': 'Notes',
        'log.new': 'New Log Entry',
        'log.edit': 'Edit Log Entry',
        'log.typeLabel': 'Log Type',
        'log.urgencyLabel': 'Urgency Level',
        'log.contentLabel': 'Description',
        'log.roomNumberLabel': 'Room Number (Optional)',
        'log.create': 'Create Log',
        'log.save': 'Save Changes',
        'log.enterContent': 'Please enter a description',
        'log.mustLogin': 'You must be logged in',
    },
    tr: {
        'auth.login': 'Giriş Yap',
        'auth.register': 'Kayıt Ol',
        'auth.email': 'E-posta Adresi',
        'auth.password': 'Şifre',
        'auth.name': 'Ad Soyad',
        'auth.noAccount': 'Hesabınız yok mu?',
        'auth.haveAccount': 'Zaten hesabınız var mı?',
        'setup.title': 'Otel Seçin',
        'setup.subtitle': 'Mevcut bir otele katılın veya yeni bir tane oluşturun',
        'setup.joinExisting': 'Mevcut Otele Katıl',
        'setup.createNew': 'Yeni Oluştur',
        'setup.hotelName': 'Otel Adı',
        'setup.address': 'Adres',
        'setup.optional': 'isteğe bağlı',
        'setup.loading': 'Oteller yükleniyor...',
        'setup.noHotels': 'Otel bulunamadı',
        'setup.createSuccess': 'Otel başarıyla oluşturuldu',
        'setup.joinSuccess': 'Otele başarıyla katıldınız',

        'dashboard.welcome': 'Hoşgeldin, {name}',
        'dashboard.role': 'Rol: {role}',
        'dashboard.startShift': 'Vardiyayı Başlat',
        'dashboard.endShift': 'Vardiyayı Bitir',
        'dashboard.actions': 'İşlemler',
        'dashboard.rooms': 'Odalar',
        'dashboard.newLog': 'Yeni Kayıt',
        'dashboard.weeklySchedule': 'Haftalık Programım',
        'dashboard.activeHotelShift': 'Aktif Otel Vardiyası',
        'dashboard.todaysAssignment': 'Bugünkü Görev',
        'dashboard.assignedShift': 'Atanan Vardiya',
        'dashboard.noAssignedShift': 'Bugün için atanmış vardiya yok',

        'status.active': 'Aktif',
        'status.resolved': 'Çözüldü',
        'status.archived': 'Arşiv',
        'status.open': 'Açık',
        'status.noActiveShift': 'Aktif vardiya yok',
        'status.low': 'Düşük',
        'status.medium': 'Orta',
        'status.critical': 'Kritik',
        'urgency.low': 'Düşük',
        'urgency.medium': 'Orta',
        'urgency.high': 'Yüksek',
        'urgency.critical': 'Kritik',

        'module.activityFeed': 'Canlı Aktivite Akışı',
        'module.stickyBoard': 'Önemli Notlar',
        'module.compliance': 'Uyumluluk Kontrolü',
        'module.shiftNotes': 'Vardiya Notları',
        'module.hotelInfo': 'Otel Bilgileri',
        'module.roster': 'Personel Çizelgesi',
        'module.calendar': 'Takvim',
        'module.maintenance': 'Teknik Servis',
        'module.guest_request': 'Misafir Talebi',
        'module.complaint': 'Şikayet',
        'module.system': 'Sistem',

        'category.handover': 'Devir Teslim',
        'category.damage': 'Hasar / Ödeme',
        'category.guestInfo': 'Misafir Bilgi',
        'category.earlyCheckout': 'Erken Çıkış',
        'category.maintenance': 'Teknik Servis',
        'category.guest_request': 'Misafir Talebi',
        'category.complaint': 'Şikayet',
        'category.system': 'Sistem',
        'category.other': 'Diğer',

        'handover.title': 'Devir Teslim Sihirbazı',
        'handover.step.tickets': 'Açık Kayıtları İncele',
        'handover.step.cash': 'Kasa Sayımı',
        'handover.step.notes': 'Devir Notları',
        'handover.step.confirm': 'Onayla ve Bitir',
        'handover.tickets.desc': 'Devam etmeden önce her açık kaydı onaylayın',
        'handover.cash.desc': 'Devir yapmadan önce tüm nakit parayı sayın',
        'handover.notes.desc': 'Bir sonraki vardiya için önemli notlar bırakın',
        'handover.confirm.desc': 'Devir özetini inceleyin',
        'handover.cash.started': 'Başlangıç',
        'handover.cash.difference': 'Fark',
        'handover.complete': 'Devri Tamamla',

        'rooms.title': 'Oda Yönetimi',
        'rooms.add': 'Oda Ekle',
        'rooms.edit': 'Odayı Düzenle',
        'rooms.number': 'Oda Numarası',
        'rooms.floor': 'Kat',
        'rooms.type': 'Oda Tipi',
        'rooms.status': 'Durum',
        'rooms.occupancy': 'Doluluk',
        'rooms.vacant': 'Boş',
        'rooms.occupied': 'Dolu',
        'rooms.clean': 'Temiz',
        'rooms.dirty': 'Kirli',
        'rooms.inspect': 'Kontrol',
        'rooms.dnd': 'DND (Rahatsız Etmeyin)',

        'common.add': 'Ekle',
        'common.cancel': 'İptal',
        'common.save': 'Kaydet',
        'common.delete': 'Sil',
        'common.edit': 'Düzenle',
        'common.viewAll': 'Tümünü Gör',
        'common.loading': 'Yükleniyor...',
        'common.room': 'Oda',
        'common.amount': 'Tutar',
        'common.description': 'Açıklama',
        'common.search': 'Ara...',
        'common.continue': 'Devam Et',
        'common.back': 'Geri',
        'common.confirm': 'Onayla',
        'common.by': 'tarafından',
        'handover.wizard': 'Devir Teslim Sihirbazı',
        'handover.noOpenTickets': 'Açık kayıt yok!',
        'handover.allClear': 'Devir teslim için her şey hazır',
        'handover.cashEnd': 'Bitiş Nakit (₺)',
        'handover.enterCash': 'Kasadaki nakdi girin',
        'handover.countCash': 'Devretmeden önce tüm nakdi sayın',
        'handover.notesDesc': 'Sonraki vardiya için önemli notlar bırakın',
        'handover.readyToComplete': 'Devri Tamamlamaya Hazır',
        'handover.reviewSummary': 'Devir özetini gözden geçirin',
        'handover.ticketsReviewed': 'İncelenen Açık Kayıtlar',
        'handover.notes': 'Notlar',
        'log.new': 'Yeni Kayıt Ekle',
        'log.edit': 'Kaydı Düzenle',
        'log.typeLabel': 'Kayıt Tipi',
        'log.urgencyLabel': 'Aciliyet Seviyesi',
        'log.contentLabel': 'Açıklama',
        'log.roomNumberLabel': 'Oda Numarası (Opsiyonel)',
        'log.create': 'Kayıt Oluştur',
        'log.save': 'Değişiklikleri Kaydet',
        'log.enterContent': 'Lütfen bir açıklama girin',
        'log.mustLogin': 'Giriş yapmalısınız',
    }
}

interface LanguageState {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: keyof Translations, params?: Record<string, string>) => string
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'tr',
            setLanguage: (lang) => set({ language: lang }),
            t: (key, params) => {
                const lang = get().language
                // Fallback to English if translation missing in TR
                let text = translations[lang][key] || translations['en'][key] || key

                if (params) {
                    Object.entries(params).forEach(([param, value]) => {
                        text = text.replace(`{${param}}`, value)
                    })
                }

                return text
            }
        }),
        {
            name: 'relay-language', // key in localStorage
            partialize: (state) => ({ language: state.language }), // only persist language
        }
    )
)
