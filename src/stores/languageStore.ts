import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

type Language = 'en' | 'tr'

type Translations = {
    // Auth & Setup
    'auth.login': string
    'auth.register': string
    'auth.email': string
    'auth.password': string
    'auth.name': string
    'auth.confirmPassword': string
    'auth.noAccount': string
    'auth.haveAccount': string
    'auth.contactGM': string
    'auth.error.enterName': string
    'auth.error.passwordLength': string
    'auth.error.passwordMismatch': string
    'auth.error.regFailed': string
    'auth.role.receptionist': string
    'auth.role.receptionistDesc': string
    'auth.role.housekeeping': string
    'auth.role.housekeepingDesc': string
    'auth.registerSubtitle': string
    'auth.roleLabel': string
    'auth.creatingAccount': string
    'auth.createAccount': string
    'auth.logout': string
    'auth.switchAccount': string

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
    'setup.unnamedHotel': string
    'setup.error.joinFailed': string
    'setup.error.enterName': string
    'setup.error.createFailed': string
    'setup.hotelNamePlaceholder': string
    'setup.addressPlaceholder': string

    // Dashboard
    'dashboard.welcome': string
    'dashboard.role': string
    'dashboard.startShift': string
    'dashboard.endShift': string
    'dashboard.actions': string
    'dashboard.rooms': string
    'dashboard.newLog': string
    'dashboard.weeklySchedule': string
    'dashboard.activeHotelShift': string
    'dashboard.todaysAssignment': string
    'dashboard.assignedShift': string
    'dashboard.noAssignedShift': string
    'dashboard.operationsHub': string
    'dashboard.operationsDesc': string
    'dashboard.userProfile': string

    // Status & Urgency
    'status.active': string
    'status.ongoing': string
    'status.resolved': string
    'status.archived': string
    'status.open': string
    'status.noActiveShift': string
    'status.low': string
    'status.medium': string
    'status.critical': string
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
    'module.overview': string
    'module.operations': string
    'module.messaging': string
    'module.complaints': string
    'module.offDays': string
    'module.tours': string
    'module.sales': string

    // Days
    'day.mon': string
    'day.tue': string
    'day.wed': string
    'day.thu': string
    'day.fri': string
    'day.sat': string
    'day.sun': string
    'day.short.mon': string
    'day.short.tue': string
    'day.short.wed': string
    'day.short.thu': string
    'day.short.fri': string
    'day.short.sat': string
    'day.short.sun': string

    // Categories
    'category.allIssues': string
    'category.handover': string
    'category.damage': string
    'category.guestInfo': string
    'category.earlyCheckout': string
    'category.feedback': string
    'category.upgrade': string
    'category.upsell': string
    'category.restaurant': string
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

    // Hotel
    'hotel.laundry': string
    'hotel.transfer': string
    'hotel.lateCheckout': string
    'hotel.extraBed': string
    'hotel.iban': string
    'hotel.bankName': string
    'hotel.bankNamePlaceholder': string
    'hotel.additionalNotes': string
    'hotel.notesPlaceholder': string
    'hotel.bankAccount': string
    'hotel.noInfo': string
    'hotel.clickEdit': string

    // Log
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
    'log.aiHelp': string
    'log.roomPlaceholder': string
    'log.feed.noActive': string
    'log.feed.noResolved': string
    'log.feed.noArchived': string
    'log.error.enterDescription': string
    'log.error.mustBeLoggedIn': string

    // Sticky
    'sticky.pinnedCount': string

    // Shifts
    'shift.morning': string
    'shift.afternoon': string
    'shift.night': string
    'shift.extra': string
    'shift.off': string
    'shift.none': string
    'shift.welcome': string
    'shift.selectType': string
    'shift.startingCash': string
    'shift.proceed': string
    'shift.loggedAs': string

    // App & Common
    'app.welcome': string
    'app.description': string
    'app.activeShift': string
    'app.openTickets': string
    'app.cashBalance': string
    'app.systemTitle': string
    'common.add': string
    'common.cancel': string
    'common.save': string
    'common.delete': string
    'common.edit': string
    'common.archive': string
    'common.viewAll': string
    'common.loading': string
    'common.room': string
    'common.amount': string
    'common.description': string
    'common.search': string
    'common.continue': string
    'common.back': string
    'common.confirm': string
    'common.by': string
    'common.none': string
    'common.staff': string
    'common.unknown': string
    'common.update': string
    'common.deleteConfirm': string
    'common.next': string
    'common.finish': string
    'common.reopen': string
    'common.resolve': string
    'common.dismiss': string

    // Calendar
    'calendar.noShifts': string
    'calendar.noEvents': string
    'calendar.addEvent': string
    'calendar.eventTitle': string
    'calendar.time': string
    'calendar.roomNumber': string
    'calendar.totalPrice': string
    'calendar.collectedAmount': string
    'calendar.payment': string
    'calendar.remaining': string
    'calendar.eventType.checkout': string
    'calendar.eventType.arrival': string
    'calendar.eventType.meeting': string
    'calendar.eventType.inspection': string
    'calendar.eventType.delivery': string
    'calendar.eventType.maintenance': string
    'calendar.eventType.reminder': string
    'calendar.eventType.tour': string
    'calendar.eventType.transfer': string
    'calendar.eventType.off_day': string

    // Notes
    'notes.activeCount': string
    'notes.noNotes': string
    'notes.aiHelp': string
    'notes.anonymous': string

    // Notifications
    'notifications.title': string
    'notifications.markAllRead': string
    'notifications.noNotifications': string
    'notifications.viewAll': string

    // Status/Filter
    'status.all': string


    // Roster
    'roster.title': string
    'roster.noStaff': string

    // Compliance
    'compliance.kbs.required': string
    'compliance.kbs.pastTime': string
    'compliance.kbs.desc': string
    'compliance.kbs.remindLater': string
    'compliance.kbs.checkNow': string
    'compliance.agency.label': string
    'compliance.agency.desc': string
    'compliance.kbs.label': string
    'compliance.kbs.checklistDesc': string

    // Onboarding
    'onboarding.welcome.title': string
    'onboarding.welcome.desc': string
    'onboarding.activity.title': string
    'onboarding.activity.desc': string
    'onboarding.shift.title': string
    'onboarding.shift.desc': string
    'onboarding.team.title': string
    'onboarding.team.desc': string
    'onboarding.localization.title': string
    'onboarding.localization.desc': string
    'onboarding.stepOf': string

    // Daily Menu
    'menu.title': string
    'menu.content': string
    'menu.edit': string
    'menu.updateSuccess': string
    'menu.noMenuToday': string
    'menu.hours': string
    'menu.breakfastTime': string
    'menu.lunchTime': string
    'menu.dinnerTime': string
}

const translations: Record<Language, Translations> = {
    en: {
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.email': 'Email Address',
        'auth.password': 'Password',
        'auth.name': 'Full Name',
        'auth.confirmPassword': 'Confirm Password',
        'auth.noAccount': "Don't have an account?",
        'auth.haveAccount': 'Already have an account?',
        'auth.contactGM': 'Contact your GM for account access',
        'auth.error.enterName': 'Please enter your name',
        'auth.error.passwordLength': 'Password must be at least 6 characters',
        'auth.error.passwordMismatch': 'Passwords do not match',
        'auth.error.regFailed': 'Registration failed',
        'auth.role.receptionist': 'Receptionist',
        'auth.role.receptionistDesc': 'Front desk staff',
        'auth.role.housekeeping': 'Housekeeping',
        'auth.role.housekeepingDesc': 'Cleaning & maintenance',
        'auth.registerSubtitle': "Join your hotel's Relay system",
        'auth.roleLabel': 'Your Role',
        'auth.creatingAccount': 'Creating account...',
        'auth.createAccount': 'Create Account',
        'auth.logout': 'Logout',
        'auth.switchAccount': 'Switch Account',

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
        'setup.joinSuccess': 'Join Hotel',
        'setup.unnamedHotel': 'Unnamed Hotel',
        'setup.error.joinFailed': 'Failed to join hotel',
        'setup.error.enterName': 'Please enter a hotel name',
        'setup.error.createFailed': 'Failed to create hotel',
        'setup.hotelNamePlaceholder': 'e.g. Grand Palace Hotel',
        'setup.addressPlaceholder': '123 Main Street, City',

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
        'dashboard.operationsHub': 'Operations Hub',
        'dashboard.operationsDesc': 'Manage hotel communication, feedback, and services in one place.',
        'dashboard.userProfile': 'User Profile',

        'status.active': 'Active',
        'status.ongoing': 'Shift Ongoing',
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
        'module.overview': 'Overview',
        'module.operations': 'Operations Hub',
        'module.messaging': 'Messaging',
        'module.complaints': 'Complaints',
        'module.offDays': 'Off-Days',
        'module.tours': 'Tours',
        'module.sales': 'Sales',



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

        'hotel.laundry': 'Laundry Service',
        'hotel.transfer': 'Airport Transfer',
        'hotel.lateCheckout': 'Late Checkout',
        'hotel.extraBed': 'Extra Bed',
        'hotel.iban': 'Bank IBAN',
        'hotel.bankName': 'Bank Name',
        'hotel.bankNamePlaceholder': 'e.g. Garanti BBVA',
        'hotel.additionalNotes': 'Additional Notes',
        'hotel.notesPlaceholder': 'Any other important information...',
        'hotel.bankAccount': 'Bank Account',
        'hotel.noInfo': 'No hotel information set',
        'hotel.clickEdit': 'Click edit to add',

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
        'log.aiHelp': 'AI Help',
        'log.roomPlaceholder': 'e.g. 101',
        'log.feed.noActive': 'No active logs',
        'log.feed.noResolved': 'No resolved logs',
        'log.feed.noArchived': 'Archive empty',
        'log.error.enterDescription': 'Please enter a description',
        'log.error.mustBeLoggedIn': 'You must be logged in',

        'sticky.pinnedCount': '{count} pinned',

        'shift.morning': 'Morning',
        'shift.afternoon': 'Afternoon',
        'shift.night': 'Night',
        'shift.extra': 'Extra',
        'shift.off': 'Off',
        'shift.none': 'None',
        'shift.welcome': 'Welcome! Please initialize your shift data.',
        'shift.selectType': 'Select Shift Type',
        'shift.startingCash': 'Starting Cash',
        'shift.proceed': 'Proceed to Dashboard',
        'shift.loggedAs': 'Logged in as',
        // Calendar
        'calendar.noShifts': 'No shifts scheduled',
        'calendar.noEvents': 'No events for today',
        'calendar.addEvent': 'Add Event',
        'calendar.eventTitle': 'Event Title',
        'calendar.time': 'Time',
        'calendar.roomNumber': 'Room Number',
        'calendar.totalPrice': 'Total Price',
        'calendar.collectedAmount': 'Collected Amount',
        'calendar.payment': 'Payment',
        'calendar.remaining': 'Remaining',
        'calendar.eventType.checkout': 'Checkout',
        'calendar.eventType.arrival': 'Arrival',
        'calendar.eventType.meeting': 'Meeting',
        'calendar.eventType.inspection': 'Inspection',
        'calendar.eventType.delivery': 'Delivery',
        'calendar.eventType.maintenance': 'Maintenance',
        'calendar.eventType.reminder': 'Reminder',
        'calendar.eventType.tour': 'Tour',
        'calendar.eventType.transfer': 'Transfer',
        'calendar.eventType.off_day': 'Off Day',

        // Days
        'day.mon': 'Monday',
        'day.tue': 'Tuesday',
        'day.wed': 'Wednesday',
        'day.thu': 'Thursday',
        'day.fri': 'Friday',
        'day.sat': 'Saturday',
        'day.sun': 'Sunday',
        'day.short.mon': 'MON',
        'day.short.tue': 'TUE',
        'day.short.wed': 'WED',
        'day.short.thu': 'THU',
        'day.short.fri': 'FRI',
        'day.short.sat': 'SAT',
        'day.short.sun': 'SUN',

        // Categories
        'category.allIssues': 'All Issues',
        'category.handover': 'Handover',
        'category.damage': 'Damage',
        'category.guestInfo': 'Guest Info',
        'category.earlyCheckout': 'Early Checkout',
        'category.feedback': 'Feedback',
        'category.upgrade': 'Upgrade (Room)',
        'category.upsell': 'Upsell',
        'category.restaurant': 'Restaurant/Bar',
        'category.maintenance': 'Maintenance',
        'category.guest_request': 'Guest Request',
        'category.complaint': 'Complaint',
        'category.system': 'System',
        'category.other': 'Other',

        // Notes
        'notes.activeCount': 'Active Notes',
        'notes.noNotes': 'No active notes',
        'notes.aiHelp': 'AI Assist',
        'notes.anonymous': 'Anonymous',

        // Notifications
        'notifications.title': 'Notifications',
        'notifications.markAllRead': 'Mark all read',
        'notifications.noNotifications': 'No new notifications',
        'notifications.viewAll': 'View All Activity',

        // Status
        'status.all': 'All',

        'app.welcome': 'Welcome to Relay',
        'app.description': 'Your digital handover system for seamless hotel operations. Manage shifts, track logs, and ensure compliance—all in one place.',
        'app.activeShift': 'Active Shift',
        'app.openTickets': 'Open Tickets',
        'app.cashBalance': 'Cash Balance',
        'app.systemTitle': 'Relay Hotel Operations System',

        'common.dismiss': 'Dismiss',

        'common.add': 'Add',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.archive': 'Archive',
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
        'common.none': 'None',
        'common.staff': 'Staff',
        'common.unknown': 'Unknown',
        'common.update': 'Update',
        'common.deleteConfirm': 'Delete this event?',
        'common.next': 'Next',
        'common.finish': 'Finish',
        'common.reopen': 'Reopen',
        'common.resolve': 'Resolve',

        'roster.title': 'Weekly Roster',
        'roster.noStaff': 'No staff members found',

        'compliance.kbs.required': 'KBS Check Required!',
        'compliance.kbs.pastTime': "It's past 23:00",
        'compliance.kbs.desc': 'The KBS system check must be completed before your shift ends. This is a mandatory compliance requirement.',
        'compliance.kbs.remindLater': 'Remind Later',
        'compliance.kbs.checkNow': 'Check KBS Now',
        'compliance.agency.label': 'Agency Messages Checked',
        'compliance.agency.desc': 'Check all OTA messages (Booking, Expedia, etc.)',
        'compliance.kbs.label': 'KBS System Verified',
        'compliance.kbs.checklistDesc': 'Daily compliance check before 23:00',

        'onboarding.welcome.title': 'Welcome to Relay',
        'onboarding.welcome.desc': 'Your digital hotel operations hub. Let\'s take a quick look around.',
        'onboarding.activity.title': 'Live Activity Feed',
        'onboarding.activity.desc': 'The left column shows all guest requests and maintenance logs in real-time.',
        'onboarding.shift.title': 'Shift Operations',
        'onboarding.shift.desc': 'The center column tracks your active shift, cash, and compliance checklists.',
        'onboarding.team.title': 'Team & Schedule',
        'onboarding.team.desc': 'The right column manages the roster, calendar, and general hotel info.',
        'onboarding.localization.title': 'Localization',
        'onboarding.localization.desc': 'Use the globe icon in the header to switch between Turkish and English anytime.',
        'onboarding.stepOf': 'Step {current} of {total}',

        'menu.title': 'Staff Daily Menu',
        'menu.content': 'Today\'s Menu',
        'menu.edit': 'Edit Menu',
        'menu.updateSuccess': 'Menu updated successfully',
        'menu.noMenuToday': 'No menu shared for today yet.',
        'menu.hours': 'Service Hours',
        'menu.breakfastTime': 'Breakfast: 07:00 - 09:00',
        'menu.lunchTime': 'Lunch: 12:00 - 13:30',
        'menu.dinnerTime': 'Dinner: 17:00 - 18:30',
    },
    tr: {
        'app.welcome': 'Relay\'e Hoşgeldiniz',
        'app.description': 'Dijital devir teslim sisteminiz. Vardiyaları yönetin, kayıtları takip edin ve uyumluluğu sağlayın - hepsi tek bir yerde.',
        'app.activeShift': 'Aktif Vardiya',
        'app.openTickets': 'Açık Kayıtlar',
        'app.cashBalance': 'Kasa Bakiyesi',
        'app.systemTitle': 'Relay Otel Operasyon Sistemi',

        'auth.login': 'Giriş Yap',
        'auth.register': 'Kayıt Ol',
        'auth.email': 'E-posta Adresi',
        'auth.password': 'Şifre',
        'auth.name': 'Ad Soyad',
        'auth.confirmPassword': 'Şifreyi Onayla',
        'auth.noAccount': 'Hesabınız yok mu?',
        'auth.haveAccount': 'Zaten hesabınız var mı?',
        'auth.contactGM': 'Hesap erişimi için yöneticinizle (GM) iletişime geçin',
        'auth.error.enterName': 'Lütfen adınızı girin',
        'auth.error.passwordLength': 'Şifre en az 6 karakter olmalıdır',
        'auth.error.passwordMismatch': 'Şifreler eşleşmiyor',
        'auth.error.regFailed': 'Kayıt başarısız oldu',
        'auth.role.receptionist': 'Resepsiyonist',
        'auth.role.receptionistDesc': 'Ön büro personeli',
        'auth.role.housekeeping': 'Kat Hizmetleri',
        'auth.role.housekeepingDesc': 'Temizlik ve bakım',
        'auth.registerSubtitle': 'Otelinizin Relay sistemine katılın',
        'auth.roleLabel': 'Rolünüz',
        'auth.creatingAccount': 'Hesap oluşturuluyor...',
        'auth.createAccount': 'Hesap Oluştur',
        'auth.logout': 'Çıkış Yap',
        'auth.switchAccount': 'Hesap Değiştir',

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
        'setup.joinSuccess': 'Otele Katıl',
        'setup.unnamedHotel': 'İsimsiz Otel',
        'setup.error.joinFailed': 'Otele katılma başarısız oldu',
        'setup.error.enterName': 'Lütfen bir otel adı girin',
        'setup.error.createFailed': 'Otel oluşturma başarısız oldu',
        'setup.hotelNamePlaceholder': 'örn. Grand Palace Otel',
        'setup.addressPlaceholder': '123 Ana Cadde, Şehir',

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
        'dashboard.operationsHub': 'Operasyon Merkezi',
        'dashboard.operationsDesc': 'Otel iletişimi, geri bildirim ve hizmetleri tek bir yerden yönetin.',
        'dashboard.userProfile': 'Kullanıcı Profili',

        'status.active': 'Aktif',
        'status.ongoing': 'Vardiya Devam Ediyor',
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
        'module.overview': 'Genel Bakış',
        'module.operations': 'Operasyon Merkezi',
        'module.messaging': 'Mesajlaşma',
        'module.complaints': 'Şikayetler',
        'module.offDays': 'İzin Günleri',
        'module.tours': 'Turlar',
        'module.sales': 'Satışlar',



        'handover.title': 'Devir Teslim Sihirbazı',

        'common.dismiss': 'Gizle',

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

        'hotel.laundry': 'Çamaşırhane Hizmeti',
        'hotel.transfer': 'Havalimanı Transferi',
        'hotel.lateCheckout': 'Geç Çıkış',
        'hotel.extraBed': 'Ekstra Yatak',
        'hotel.iban': 'Banka IBAN',
        'hotel.bankName': 'Banka Adı',
        'hotel.bankNamePlaceholder': 'örn. Garanti BBVA',
        'hotel.additionalNotes': 'Ek Notlar',
        'hotel.notesPlaceholder': 'Diğer önemli bilgiler...',
        'hotel.bankAccount': 'Banka Hesabı',
        'hotel.noInfo': 'Otel bilgisi ayarlanmamış',
        'hotel.clickEdit': 'Ekleme yapmak için düzenle\'ye tıklayın',

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
        'log.aiHelp': 'AI Yardımı',
        'log.roomPlaceholder': 'örn. 101',
        'log.feed.noActive': 'Aktif kayıt bulunmuyor',
        'log.feed.noResolved': 'Çözülmüş kayıt bulunmuyor',
        'log.feed.noArchived': 'Arşiv boş',
        'log.error.enterDescription': 'Lütfen bir açıklama giriniz',
        'log.error.mustBeLoggedIn': 'Giriş yapmanız gerekiyor',

        'sticky.pinnedCount': '{count} sabitlenmiş',

        'shift.morning': 'Sabah',
        'shift.afternoon': 'Öğleden Sonra',
        'shift.night': 'Gece',
        'shift.extra': 'Ekstra',
        'shift.off': 'İzinli',
        'shift.none': 'Yok',
        'shift.welcome': 'Hoş geldiniz! Lütfen vardiya verilerinizi giriniz.',
        'shift.selectType': 'Vardiya Tipi Seçin',
        'shift.startingCash': 'Başlangıç Nakdi',
        'shift.proceed': 'Dashboard\'a Devam Et',
        'shift.loggedAs': 'Giriş yapan kullanıcı:',
        // Calendar
        'calendar.noShifts': 'Planlanmış vardiya yok',
        'calendar.noEvents': 'Bugün için etkinlik yok',
        'calendar.addEvent': 'Etkinlik Ekle',
        'calendar.eventTitle': 'Etkinlik Başlığı',
        'calendar.time': 'Saat',
        'calendar.roomNumber': 'Oda Numarası',
        'calendar.totalPrice': 'Toplam Tutar',
        'calendar.collectedAmount': 'Tahsil Edilen',
        'calendar.payment': 'Ödeme',
        'calendar.remaining': 'Kalan',
        'calendar.eventType.checkout': 'Çıkış',
        'calendar.eventType.arrival': 'Giriş',
        'calendar.eventType.meeting': 'Toplantı',
        'calendar.eventType.inspection': 'Denetim',
        'calendar.eventType.delivery': 'Teslimat',
        'calendar.eventType.maintenance': 'Bakım',
        'calendar.eventType.reminder': 'Hatırlatıcı',
        'calendar.eventType.tour': 'Tur',
        'calendar.eventType.transfer': 'Transfer',
        'calendar.eventType.off_day': 'İzin Günü',

        // Days
        'day.mon': 'Pazartesi',
        'day.tue': 'Salı',
        'day.wed': 'Çarşamba',
        'day.thu': 'Perşembe',
        'day.fri': 'Cuma',
        'day.sat': 'Cumartesi',
        'day.sun': 'Pazar',
        'day.short.mon': 'PZT',
        'day.short.tue': 'SAL',
        'day.short.wed': 'ÇAR',
        'day.short.thu': 'PER',
        'day.short.fri': 'CUM',
        'day.short.sat': 'CTS',
        'day.short.sun': 'PAZ',

        // Categories
        'category.allIssues': 'Tüm Kayıtlar',
        'category.handover': 'Devir Teslim',
        'category.damage': 'Hasar/Arıza',
        'category.guestInfo': 'Misafir Bilgisi',
        'category.earlyCheckout': 'Erken Çıkış',
        'category.feedback': 'Geri Bildirim',
        'category.upgrade': 'Upgrade (Oda)',
        'category.upsell': 'Ekstra Satış',
        'category.restaurant': 'Restoran',
        'category.maintenance': 'Bakım',
        'category.guest_request': 'Misafir İsteği',
        'category.complaint': 'Şikayet',
        'category.system': 'Sistem',
        'category.other': 'Diğer',

        // Notes
        'notes.activeCount': 'Aktif Kayıtlar',
        'notes.noNotes': 'Aktif kayıt bulunmuyor',
        'notes.aiHelp': 'AI Asistan',
        'notes.anonymous': 'Anonim',

        // Notifications
        'notifications.title': 'Bildirimler',
        'notifications.markAllRead': 'Tümünü okundu işaretle',
        'notifications.noNotifications': 'Yeni bildirim yok',
        'notifications.viewAll': 'Tüm Aktiviteyi Gör',

        // Status
        'status.all': 'Tümü',


        'common.add': 'Ekle',
        'common.cancel': 'İptal',
        'common.save': 'Kaydet',
        'common.delete': 'Sil',
        'common.edit': 'Düzenle',
        'common.archive': 'Arşivle',
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
        'common.none': 'Yok',
        'common.staff': 'Personel',
        'common.unknown': 'Bilinmiyor',
        'common.update': 'Güncelle',
        'common.deleteConfirm': 'Bu etkinliği silmek istediğinize emin misiniz?',
        'common.next': 'İleri',
        'common.finish': 'Bitir',
        'common.reopen': 'Yeniden Aç',
        'common.resolve': 'Çöz',

        'roster.title': 'Haftalık Çizelge',
        'roster.noStaff': 'Personel bulunamadı',

        'menu.title': 'Personel Günlük Menüsü',
        'menu.content': 'Günün Menüsü',
        'menu.edit': 'Menüyü Düzenle',
        'menu.updateSuccess': 'Menü başarıyla güncellendi',
        'menu.noMenuToday': 'Bugün için henüz menü paylaşılmadı.',
        'menu.hours': 'Servis Saatleri',
        'menu.breakfastTime': 'Kahvaltı: 07:00 - 09:00',
        'menu.lunchTime': 'Öğle Yemeği: 12:00 - 13:30',
        'menu.dinnerTime': 'Akşam Yemeği: 17:00 - 18:30',

        'compliance.kbs.required': 'KBS Kontrolü Gerekli!',
        'compliance.kbs.pastTime': 'Saat 23:00\'ü geçti',
        'compliance.kbs.desc': 'KBS sistem kontrolü vardiyanız bitmeden tamamlanmalıdır. Bu zorunlu bir uyumluluk gerekliliğidir.',
        'compliance.kbs.remindLater': 'Sonra Hatırlat',
        'compliance.kbs.checkNow': 'KBS\'yi Şimdi Kontrol Et',
        'compliance.agency.label': 'Acente Mesajları Kontrol Edildi',
        'compliance.agency.desc': 'Tüm OTA mesajlarını (Booking, Expedia, vb.) kontrol edin',
        'compliance.kbs.label': 'KBS Sistemi Doğrulandı',
        'compliance.kbs.checklistDesc': '23:00\'den önce günlük uyumluluk kontrolü',

        'onboarding.welcome.title': 'Relay\'e Hoş Geldiniz',
        'onboarding.welcome.desc': 'Dijital otel operasyon merkeziniz. Etrafa hızlıca bir göz atalım.',
        'onboarding.activity.title': 'Canlı Aktivite Akışı',
        'onboarding.activity.desc': 'Sol sütun tüm misafir taleplerini ve bakım kayıtlarını gerçek zamanlı olarak gösterir.',
        'onboarding.shift.title': 'Vardiya Operasyonları',
        'onboarding.shift.desc': 'Orta sütun aktif vardiyanızı, kasanızı ve uyumluluk kontrol listelerinizi takip eder.',
        'onboarding.team.title': 'Ekip ve Program',
        'onboarding.team.desc': 'Sağ sütun kadroyu, takvimi ve genel otel bilgilerini yönetir.',
        'onboarding.localization.title': 'Yerelleştirme',
        'onboarding.localization.desc': 'Türkçe ve İngilizce arasında istediğiniz zaman geçiş yapmak için başlıktaki dünya simgesini kullanın.',
        'onboarding.stepOf': '{total} Adımdan {current}.',
    },
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
            setLanguage: (lang) => {
                set({ language: lang })
                // Also update Firestore if logged in
                const { user, updateSettings } = useAuthStore.getState()
                if (user) {
                    updateSettings({ language: lang })
                }
            },
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

// Sync language with Firestore if logged in
useAuthStore.subscribe((state) => {
    const firestoreLang = state.user?.settings?.language
    if (firestoreLang && firestoreLang !== useLanguageStore.getState().language) {
        // Use a flag or check to avoid infinite loop since setLanguage updates Firestore
        useLanguageStore.setState({ language: firestoreLang })
    }
})
