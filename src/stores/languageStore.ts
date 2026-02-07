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
    'log.stickyBoard': string
    'compliance.kbsLate': string

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
    'category.minibar': string
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
    'hotel.settings.minibarPrices': string
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
    'notes.noFixturePrices': string
    'minibar.cola': string
    'minibar.cola_zero': string
    'minibar.fanta': string
    'minibar.sprite': string
    'minibar.soda': string
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
    'roster.show': string
    'roster.hide': string

    // Tours
    'tours.catalogue.title': string
    'tours.catalogue.desc': string
    'tours.add': string
    'tours.edit': string
    'tours.create': string
    'tours.form.name': string
    'tours.form.desc': string
    'tours.form.basePrice': string
    'tours.form.adultPrice': string
    'tours.form.child37Price': string
    'tours.form.child03Price': string
    'tours.form.operatingDays': string
    'tours.noTours': string
    'tours.createFirst': string
    'tours.local': string
    'tours.clickToLog': string
    'tours.book.title': string
    'tours.book.desc': string
    'tours.book.guestName': string
    'tours.book.room': string
    'tours.book.pax': string
    'tours.book.date': string
    'tours.book.totalPrice': string
    'tours.book.confirm': string

    // Sales
    'sales.tracker': string
    'sales.new': string
    'sales.newType': string
    'sales.service': string
    'sales.other': string
    'sales.customName': string
    'sales.pickupTime': string
    'sales.price': string
    'sales.notes': string
    'sales.optionalNotes': string
    'sales.create': string
    'sales.noSales': string
    'sales.soldBy': string

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

    // Interactive Tour
    'tour.intro.title': string
    'tour.intro.desc': string
    'tour.compliance.title': string
    'tour.compliance.desc': string
    'tour.feed.title': string
    'tour.feed.desc': string
    'tour.sales.title': string
    'tour.sales.desc': string
    'tour.notifications.title': string
    'tour.notifications.desc': string
    'tour.profile.title': string
    'tour.profile.desc': string

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

    // Hotel Info - New
    'hotel.secure.title': string
    'hotel.secure.encrypted': string
    'hotel.secure.safeCode': string
    'hotel.secure.agency': string
    'hotel.secure.other': string
    'hotel.secure.kbs': string
    'hotel.settings.fixturePrices': string
    'fixture.hand_towel': string
    'fixture.bath_towel': string
    'fixture.bed_sheet': string
    'fixture.pillow_case': string
    'fixture.duvet_cover': string
    'fixture.bathrobe': string
    'fixture.mattress_protector': string

    // Off Day - New
    'offday.management.title': string
    'offday.management.desc': string
    'offday.pending': string
    'offday.history': string
    'offday.petitions': string

    // Messages & Feedback - New
    'messages.title': string
    'messages.search': string
    'messages.announcements': string
    'messages.broadcast': string
    'feedback.anonymous.title': string
    'feedback.anonymous.subtitle': string
    'feedback.privacy.title': string
    'feedback.privacy.desc': string
    'feedback.submit.title': string
    'feedback.submit.desc': string
    'feedback.management.view': string

    // AI Modal - New
    'ai.title': string
    'ai.poweredBy': string
    'ai.model': string
    'ai.mode.assistant': string
    'ai.mode.quota': string
    'ai.task.general': string
    'ai.task.generalDesc': string
    'ai.task.incident': string
    'ai.task.incidentDesc': string
    'ai.task.email': string
    'ai.task.emailDesc': string
    'ai.task.review': string
    'ai.task.reviewDesc': string
    'ai.context.title': string
    'ai.context.desc': string
    'ai.context.save': string
    'ai.generate': string
    'ai.cancel': string

    // Shift Notes - New
    'notes.edited': string
    'notes.label': string
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
        'log.stickyBoard': 'Sticky Board',
        'compliance.kbsLate': 'KBS System check is required immediately! Please verify guest identities.',



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
        'category.minibar': 'Minibar',
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
        'roster.show': 'Show in Roster',
        'roster.hide': 'Hide from Roster',

        // Tours
        'tours.catalogue.title': 'Tour Catalogue',
        'tours.catalogue.desc': 'Browse available tours and track local sales.',
        'tours.add': 'Add New Tour',
        'tours.edit': 'Edit Tour',
        'tours.create': 'Create New Tour Entry',
        'tours.form.name': 'Tour Name',
        'tours.form.desc': 'Short Description',
        'tours.form.basePrice': 'Base Price (EUR)',
        'tours.form.adultPrice': 'Adult Price',
        'tours.form.child37Price': 'Child (3-7y)',
        'tours.form.child03Price': 'Child (0-3y)',
        'tours.form.operatingDays': 'Operating Days',
        'tours.noTours': 'No tours in the catalogue yet.',
        'tours.createFirst': 'Create the first one',
        'tours.local': 'Local Tour',
        'tours.clickToLog': 'Click a category to log a sale.',
        'tours.book.title': 'New Booking: {name}',
        'tours.book.desc': 'Enter booking details for this tour.',
        'tours.book.guestName': 'Guest Name',
        'tours.book.room': 'Room #',
        'tours.book.pax': 'Pax',
        'tours.book.date': 'Date',
        'tours.book.totalPrice': 'Total Price',
        'tours.book.confirm': 'Confirm Booking',

        // Sales
        'sales.tracker': 'Sales Tracker',
        'sales.new': 'New Sale',
        'sales.newType': 'New {label}',
        'sales.service': 'Service',
        'sales.other': 'Other / Custom',
        'sales.customName': 'Enter custom tour name...',
        'sales.pickupTime': 'Pickup Time',
        'sales.price': 'Price',
        'sales.notes': 'Notes',
        'sales.optionalNotes': 'Optional notes...',
        'sales.create': 'Create Sale',
        'sales.noSales': 'No {label} sales yet.',
        'sales.soldBy': 'Sold by: {name}',

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
        'onboarding.welcome.desc': 'Your digital operations hub. Let\'s get you set up.',
        'onboarding.activity.title': 'Operations Feed',
        'onboarding.activity.desc': 'View guest requests, maintenance logs, and shift notes in real-time.',
        'onboarding.shift.title': 'Shift Management',
        'onboarding.shift.desc': 'Start/End shifts, check KBS compliance, and count cash.',
        'onboarding.team.title': 'Roster & Sales',
        'onboarding.team.desc': 'Check your weekly schedule, request off-days, and manage tour sales.',
        'onboarding.localization.title': 'Localization',
        'onboarding.localization.desc': 'Switch languages instantly using the globe icon.',
        'onboarding.stepOf': 'Step {current} of {total}',

        // Interactive Tour
        'tour.intro.title': 'Welcome to Relay',
        'tour.intro.desc': 'This is your digital handover platform. Let\'s take a quick tour.',
        'tour.compliance.title': 'Shift Compliance',
        'tour.compliance.desc': 'Track your mandatory KBS and Agency checks here. The pulse indicates urgency.',
        'tour.feed.title': 'Activity Feed',
        'tour.feed.desc': 'All guest requests and maintenance logs appear here in real-time.',
        'tour.sales.title': 'Sales & Tours',
        'tour.sales.desc': 'Switch tabs to manage Tour Sales, Off-Days, and guest Feedback.',
        'tour.notifications.title': 'Notifications',
        'tour.notifications.desc': 'Stay updated on off-day requests and important messages.',
        'tour.profile.title': 'Your Profile',
        'tour.profile.desc': 'Access settings, tutorials, and logout here.',

        'menu.title': 'Staff Daily Menu',
        'menu.content': 'Today\'s Menu',
        'menu.edit': 'Edit Menu',
        'menu.updateSuccess': 'Menu updated successfully',
        'menu.noMenuToday': 'No menu shared for today yet.',
        'menu.hours': 'Service Hours',
        'menu.breakfastTime': 'Breakfast: 07:00 - 09:00',
        'menu.lunchTime': 'Lunch: 12:00 - 13:30',
        'menu.dinnerTime': 'Dinner: 17:00 - 18:30',

        // Hotel Info
        'hotel.secure.title': 'Secure Information (KBS / Agency)',
        'hotel.secure.encrypted': 'Encrypted Section',
        'hotel.secure.safeCode': 'Safe Code',
        'hotel.secure.agency': 'Agency Logins (Extranet)',
        'hotel.secure.other': 'Other Safe Info',
        'hotel.secure.kbs': 'KBS Login Info',
        'hotel.settings.fixturePrices': 'Fixture Damage Prices',
        'fixture.hand_towel': 'Hand Towel',
        'fixture.bath_towel': 'Bath Towel',
        'fixture.bed_sheet': 'Bed Sheet',
        'fixture.pillow_case': 'Pillow Case',
        'fixture.duvet_cover': 'Duvet Cover',
        'fixture.bathrobe': 'Bathrobe',
        'fixture.mattress_protector': 'Mattress Protector',
        'hotel.settings.minibarPrices': 'Minibar Prices',
        'minibar.cola': 'Cola',
        'minibar.cola_zero': 'Cola Zero',
        'minibar.fanta': 'Fanta',
        'minibar.sprite': 'Sprite',
        'minibar.soda': 'Soda',


        // Off Day
        'offday.management.title': 'Leave & Shift Management',
        'offday.management.desc': 'Manage staff leave and shift requests.',
        'offday.pending': 'Pending Requests',
        'offday.history': 'Request History',
        'offday.petitions': 'Complaints & Petitions',

        // Messages
        'messages.title': 'Messages',
        'messages.search': 'Search staff...',
        'messages.announcements': 'General Announcements',
        'messages.broadcast': 'Broadcast to all staff',
        'feedback.anonymous.title': 'Anonymous Feedback',
        'feedback.anonymous.subtitle': 'Your voice matters safely.',
        'feedback.privacy.title': 'Privacy Guaranteed',
        'feedback.privacy.desc': 'We use hotel-level collections without user associations. Even database administrators cannot trace feedback to a specific user account.',
        'feedback.submit.title': 'Submit Anonymous Complaint',
        'feedback.submit.desc': 'Your identity is completely hidden. No personal data is stored with your message.',
        'feedback.management.view': 'Management View',

        // AI Modal
        'ai.title': 'Relay AI Assistant',
        'ai.poweredBy': 'Powered by Gemini & Gemma',
        'ai.model': 'AI Model',
        'ai.mode.assistant': 'Assistant Mode',
        'ai.mode.quota': 'Quota Balanced Mode',
        'ai.task.general': 'General Assistant Request',
        'ai.task.generalDesc': 'How can I help you today?',
        'ai.task.incident': 'Incident Report',
        'ai.task.incidentDesc': 'Describe the incident (Who, What, When, Where)...',
        'ai.task.email': 'Professional Email Request',
        'ai.task.emailDesc': 'Who is the recipient and what is the core message?',
        'ai.task.review': 'Review Reply Request',
        'ai.task.reviewDesc': 'Paste the guest review here...',
        'ai.context.title': 'Hotel Knowledge Base',
        'ai.context.desc': 'Enter facts about your hotel (breakfast hours, wifi password, policies). The AI will use this to generate accurate answers.',
        'ai.context.save': 'Save Context',
        'ai.generate': 'Generate',
        'ai.cancel': 'Cancel',

        // Shift Notes
        'notes.edited': '(edited)',
        'notes.label': 'shift notes',
        'notes.noFixturePrices': 'No fixture prices configured by management.',
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
        'category.minibar': 'Minibar',
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

        // Hotel Info
        'hotel.secure.title': 'Gizli Bilgiler (KBS / Acente)',
        'hotel.secure.encrypted': 'Şifreli Bölüm',
        'hotel.secure.safeCode': 'Kasa Şifresi',
        'hotel.secure.agency': 'Acente Girişleri (Extranet)',
        'hotel.secure.other': 'Diğer Kasa Bilgileri',
        'hotel.secure.kbs': 'KBS Giriş Bilgileri',
        'hotel.settings.fixturePrices': 'Demirbaş Hasar Fiyatları',
        'fixture.hand_towel': 'El Havlusu',
        'fixture.bath_towel': 'Banyo Havlusu',
        'fixture.bed_sheet': 'Çarşaf',
        'fixture.pillow_case': 'Yastık Kılıfı',
        'fixture.duvet_cover': 'Nevresim',
        'fixture.bathrobe': 'Bornoz',
        'fixture.mattress_protector': 'Alez',
        'hotel.settings.minibarPrices': 'Minibar Fiyatları',
        'minibar.cola': 'Cola',
        'minibar.cola_zero': 'Cola Zero',
        'minibar.fanta': 'Fanta',
        'minibar.sprite': 'Sprite',
        'minibar.soda': 'Maden Suyu',


        // Off Day
        'offday.management.title': 'İzin & Vardiya Yönetimi',
        'offday.management.desc': 'Personel izin ve vardiya taleplerini yönetin.',
        'offday.pending': 'Bekleyen Talepler',
        'offday.history': 'Talep Geçmişim',
        'offday.petitions': 'Şikayet Dilekçeleri',

        // Messages
        'messages.title': 'Mesajlar',
        'messages.search': 'Personel ara...',
        'messages.announcements': 'Genel Duyurular',
        'messages.broadcast': 'Tüm personele yayınla',
        'feedback.anonymous.title': 'Anonim Geri Bildirim',
        'feedback.anonymous.subtitle': 'Sesiniz güvenle duyulsun.',
        'feedback.privacy.title': 'Gizlilik Garantili',
        'feedback.privacy.desc': 'Kullanıcı ilişkilendirmesi olmayan otel düzeyinde koleksiyonlar kullanıyoruz. Veritabanı yöneticileri bile geri bildirimi belirli bir kullanıcı hesabına kadar takip edemez.',
        'feedback.submit.title': 'Anonim Şikayet Gönder',
        'feedback.submit.desc': 'Kimliğiniz tamamen gizlidir. Mesajınızla birlikte hiçbir kişisel veri saklanmaz.',
        'feedback.management.view': 'Yönetim Görünümü',

        // AI Modal
        'ai.title': 'Relay AI Asistan',
        'ai.poweredBy': 'Gemini & Gemma ile güçlendirilmiştir',
        'ai.model': 'Yapay Zeka Modeli',
        'ai.mode.assistant': 'Asistan Modu',
        'ai.mode.quota': 'Kota Dengeli Mod',
        'ai.task.general': 'Genel Asistan Talebi',
        'ai.task.generalDesc': 'Bugün size nasıl yardımcı olabilirim?',
        'ai.task.incident': 'Tutanak Raporu',
        'ai.task.incidentDesc': 'Olayı tanımlayın (Kim, Ne, Ne Zaman, Nerede)...',
        'ai.task.email': 'Profesyonel E-posta İsteği',
        'ai.task.emailDesc': 'Alıcı kim ve ana mesaj nedir?',
        'ai.task.review': 'Yorum Yanıtla',
        'ai.task.reviewDesc': 'Misafir yorumunu buraya yapıştırın...',
        'ai.context.title': 'Otel Bilgi Bankası',
        'ai.context.desc': 'Oteliniz hakkında gerçekleri girin (kahvaltı saatleri, wifi şifresi, kurallar). AI, doğru yanıtlar oluşturmak için bunu kullanacaktır.',
        'ai.context.save': 'Bağlamı Kaydet',
        'ai.generate': 'Oluştur',
        'ai.cancel': 'İptal',

        // Shift Notes
        'notes.edited': '(düzenlendi)',
        'notes.label': 'vardiya notları',
        'notes.noFixturePrices': 'Yönetim tarafından demirbaş fiyatı girilmemiş.',

        // Tours
        'tours.catalogue.title': 'Tur Kataloğu',
        'tours.catalogue.desc': 'Mevcut turları inceleyin ve satışları takip edin.',
        'tours.add': 'Yeni Tur Ekle',
        'tours.edit': 'Turu Düzenle',
        'tours.create': 'Yeni Tur Girişi Oluştur',
        'tours.form.name': 'Tur Adı',
        'tours.form.desc': 'Kısa Açıklama',
        'tours.form.basePrice': 'Taban Fiyat (EUR)',
        'tours.form.adultPrice': 'Yetişkin Fiyatı',
        'tours.form.child37Price': 'Çocuk (3-7y)',
        'tours.form.child03Price': 'Bebek (0-3y)',
        'tours.form.operatingDays': 'Operasyon Günleri',
        'tours.noTours': 'Katalogda henüz tur yok.',
        'tours.createFirst': 'İlk turu oluştur',
        'tours.local': 'Yerel Tur',
        'tours.clickToLog': 'Satış girmek için bir kategoriye tıklayın.',
        'tours.book.title': 'Yeni Rezervasyon: {name}',
        'tours.book.desc': 'Bu tur için rezervasyon detaylarını girin.',
        'tours.book.guestName': 'Misafir Adı',
        'tours.book.room': 'Oda No',
        'tours.book.pax': 'Kişi',
        'tours.book.date': 'Tarih',
        'tours.book.totalPrice': 'Toplam Fiyat',
        'tours.book.confirm': 'Rezervasyonu Onayla',

        // Interactive Tour
        'tour.intro.title': 'Relay\'e Hoşgeldiniz',
        'tour.intro.desc': 'Bu sizin dijital devir teslim platformunuz. Hadi hızlıca bir göz atalım.',
        'tour.compliance.title': 'Vardiya Uyumluluğu',
        'tour.compliance.desc': 'Zorunlu KBS ve Acente kontrollerini buradan takip edin. Nabız işareti aciliyeti gösterir.',
        'tour.feed.title': 'Aktivite Akışı',
        'tour.feed.desc': 'Tüm misafir talepleri ve bakım kayıtları burada anlık olarak görünür.',
        'tour.sales.title': 'Satış ve Turlar',
        'tour.sales.desc': 'Tur Satışlarını, İzin Günlerini ve Misafir Geri Bildirimlerini yönetmek için sekmeleri kullanın.',
        'tour.notifications.title': 'Bildirimler',
        'tour.notifications.desc': 'İzin talepleri ve önemli mesajlardan haberdar olun.',
        'tour.profile.title': 'Profiliniz',
        'tour.profile.desc': 'Ayarlara, eğitimlere ve çıkış yapma seçeneklerine buradan ulaşın.',

        // Sales
        'sales.tracker': 'Satış Takibi',
        'sales.new': 'Yeni Satış',
        'sales.newType': 'Yeni {label}',
        'sales.service': 'Hizmet',
        'sales.other': 'Diğer / Özel',
        'sales.customName': 'Özel tur adı girin...',
        'sales.pickupTime': 'Alınış Saati',
        'sales.price': 'Fiyat',
        'sales.notes': 'Notlar',
        'sales.optionalNotes': 'İsteğe bağlı notlar...',
        'sales.create': 'Satış Oluştur',
        'sales.noSales': 'Henüz {label} satışı yok.',
        'sales.soldBy': 'Satan: {name}',

        // Roster
        'roster.show': 'Çizelgede Göster',
        'roster.hide': 'Çizelgeden Gizle',

        'compliance.kbs.required': 'KBS Kontrolü Gerekli!',
        'compliance.kbs.pastTime': 'Saat 23:00\'ü geçti',
        'compliance.kbs.desc': 'KBS sistem kontrolü vardiyanız bitmeden tamamlanmalıdır. Bu zorunlu bir uyumluluk gerekliliğidir.',
        'compliance.kbs.remindLater': 'Sonra Hatırlat',
        'compliance.kbs.checkNow': 'KBS\'yi Şimdi Kontrol Et',
        'compliance.agency.label': 'Acente Mesajları Kontrol Edildi',
        'compliance.agency.desc': 'Tüm OTA mesajlarını (Booking, Expedia, vb.) kontrol edin',
        'compliance.kbs.label': 'KBS Sistemi Doğrulandı',
        'compliance.kbs.checklistDesc': '23:00\'den önce günlük uyumluluk kontrolü',

        'onboarding.welcome.title': 'Relay\'e Hoşgeldiniz',
        'onboarding.welcome.desc': 'Dijital operasyon merkeziniz. Hadi kuruluma başlayalım.',
        'onboarding.activity.title': 'Operasyon Akışı',
        'onboarding.activity.desc': 'Misafir taleplerini, teknik servis kayıtlarını ve vardiya notlarını canlı izleyin.',
        'onboarding.shift.title': 'Vardiya Yönetimi',
        'onboarding.shift.desc': 'Vardiya başlat/bitir, KBS kontrollerini yap ve kasa sayımını gerçekleştir.',
        'onboarding.team.title': 'Çizelge ve Satışlar',
        'onboarding.team.desc': 'Haftalık programınızı kontrol edin, izin isteyin ve tur satışlarını yönetin.',
        'onboarding.localization.title': 'Dil Seçimi',
        'onboarding.localization.desc': 'Dünya ikonunu kullanarak dilediğiniz an dil değiştirebilirsiniz.',
        'onboarding.stepOf': '{current} / {total}',
        'log.stickyBoard': 'Önemli Notlar',
        'compliance.kbsLate': 'KBS Kontrolü hemen yapılmalıdır! Lütfen misafir kimliklerini doğrulayın.',
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
