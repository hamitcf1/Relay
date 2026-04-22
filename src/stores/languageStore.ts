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
    'auth.contactSales': string
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
    'auth.backToHome': string
    'auth.cycling.1': string
    'auth.cycling.2': string
    'auth.cycling.3': string
    'auth.cycling.4': string
    'auth.error.hotelCodeRequired': string
    'auth.error.invalidHotelCode': string
    'auth.error.hotelNotFound': string
    'auth.error.verificationFailed': string
    'auth.placeholder.hotelCode': string
    'auth.role.selection': string
    'auth.role.staff': string
    'auth.role.staffDesc': string
    'auth.role.manager': string
    'auth.role.managerDesc': string
    'auth.error.joinHotelCode': string
    'auth.error.invalidJoinCode': string
    'auth.helper.askManager': string

    'status.title': string
    'status.subtitle': string
    'status.operational': string
    'status.uptime': string
    'status.lastUpdated': string
    'status.systems.api': string
    'status.systems.db': string
    'status.systems.messaging': string
    'status.systems.notifications': string
    'status.systems.auth': string

    'privacy.title': string
    'privacy.lastUpdated': string
    'privacy.intro.title': string
    'privacy.intro.desc': string
    'privacy.intro.list1': string
    'privacy.intro.list2': string
    'privacy.intro.list3': string
    'privacy.use.title': string
    'privacy.use.desc': string
    'privacy.use.list1': string
    'privacy.use.list2': string
    'privacy.use.list3': string
    'privacy.security.title': string
    'privacy.security.desc': string
    'privacy.contact.title': string
    'privacy.contact.desc': string

    'terms.title': string
    'terms.lastUpdated': string
    'terms.acceptance.title': string
    'terms.acceptance.desc': string
    'terms.license.title': string
    'terms.license.desc': string
    'terms.responsibilities.title': string
    'terms.responsibilities.desc': string
    'terms.availability.title': string
    'terms.availability.desc': string
    'terms.contact.title': string
    'terms.contact.desc': string

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
    'module.pricing_label': string
    'module.team_label': string
    'module.activity': string

    // Pricing Module (v2)
    'pricing.base.title': string
    'pricing.base.desc': string
    'pricing.agencies.title': string
    'pricing.agencies.desc': string
    'pricing.agencies.add': string
    'pricing.agencies.placeholder': string
    'pricing.agencies.empty': string
    'pricing.overrides.title': string
    'pricing.overrides.add': string
    'pricing.overrides.empty': string
    'pricing.lookup.title': string
    'pricing.lookup.desc': string
    'pricing.lookup.date': string
    'pricing.lookup.agency': string
    'pricing.lookup.effective': string
    'pricing.lookup.basePriceUsed': string
    'pricing.lookup.overrideUsed': string
    'pricing.save.success': string
    'pricing.save.error': string
    'pricing.currency.select': string
    'pricing.perNight': string
    'pricing.bulk.title': string
    'pricing.bulk.desc': string
    'pricing.bulk.everyone': string
    'pricing.bulk.apply': string
    'pricing.date.start': string
    'pricing.date.end': string
    'pricing.global_overrides.title': string
    'pricing.global_overrides.desc': string
    'pricing.ai.title': string
    'pricing.ai.desc': string
    'pricing.price.custom': string

    // Room Types
    'room.standard': string
    'room.corner': string
    'room.corner_jacuzzi': string
    'room.triple': string
    'room.teras_suite': string

    // Leaderboard
    'leaderboard.title': string
    'leaderboard.desc': string
    'leaderboard.today': string
    'leaderboard.thisWeek': string
    'leaderboard.noActivity': string
    'leaderboard.activeDuration': string
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
    'category.paymentNeeded': string
    'category.restaurant': string
    'category.minibar': string
    'category.maintenance': string
    'category.guest_request': string
    'category.complaint': string
    'category.system': string
    'category.other': string

    // Priority
    'priority.label': string
    'priority.low': string
    'priority.medium': string
    'priority.high': string
    'priority.critical': string

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
    'hotel.ironing': string
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
    'common.edited': string
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
    'common.language': string
    'common.appearance': string
    'appearance.avatar_style': string
    'appearance.avatar.initials': string
    'appearance.avatar.name': string
    'appearance.avatar.emoji': string
    'appearance.avatar.choose_emoji': string
    'common.formatting.bulletList': string
    'common.updateAvailable': string
    'common.updateDescription': string
    'common.refreshNow': string
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
    'common.backToHome': string
    'common.profile': string

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
    'notifications.markAsRead': string
    'notifications.markAllRead': string
    'notifications.noNotifications': string
    'notifications.viewAll': string
    'notifications.duePayments.title': string
    'notifications.duePayments.content': string
    'notifications.compliance.pending': string

    // Feedback - Expanded
    'feedback.placeholder': string
    'feedback.submitSuccess': string
    'feedback.thankYou': string
    'feedback.submitAnonymous': string
    'feedback.recentTitle': string
    'feedback.noComplaints': string

    // Messaging - Expanded
    'messaging.everyone': string
    'messaging.gmOnly': string
    'messaging.placeholder': string
    'messaging.noMessages': string
    'messaging.clearChatConfirm': string
    'messaging.deleteMessageConfirm': string
    'messaging.clearTooltip': string
    'messaging.deleteTooltip': string

    // Currency
    'currency.title': string
    'currency.buying': string
    'currency.selling': string
    'currency.lastUpdated': string

    // Announcement
    'announcement.title': string
    'announcement.deleteConfirm': string

    // Status/Filter
    'status.all': string


    // Roster
    'roster.title': string
    'roster.currentWeek': string
    'roster.noStaff': string
    'roster.show': string
    'roster.hide': string
    'roster.unknown': string
    'common.clear': string

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
    'tours.form.operatingDays': string
    'tours.form.child37Price': string
    'tours.form.child03Price': string
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
    'sales.selectTour': string
    'sales.destinationPlaceholder': string
    'sales.soldBy': string
    'sales.details.service': string
    'sales.details.financials': string
    'sales.details.pickup': string
    'sales.details.ticket': string
    'sales.details.pax': string
    'sales.details.total': string
    'sales.details.paid': string
    'sales.details.collect': string
    'sales.details.remaining': string
    'sales.details.notes': string
    'sales.details.history': string
    'sales.details.exchange': string
    'sales.details.created': string
    'sales.details.noNotes': string
    'sales.details.amountPlaceholder': string
    'sales.details.valuePlaceholder': string
    'sales.details.ticketPlaceholder': string
    'sales.details.notesPlaceholder': string
    'sales.details.deleteConfirm': string
    'sales.details.save': string
    'sales.details.cancel': string
    'sales.details.person': string
    'sales.details.persons': string
    'sales.details.notSet': string
    'sales.details.none': string

    'sales.status.waiting': string
    'sales.status.confirmed': string
    'sales.status.pickup_pending': string
    'sales.status.realized': string
    'sales.status.delivered': string
    'sales.status.cancelled': string
    'sales.payment.pending': string
    'sales.payment.partial': string
    'sales.payment.paid': string
    'sales.type.tour': string
    'sales.type.transfer': string
    'sales.type.laundry': string
    'sales.type.other': string
    'sales.laundry.whites': string
    'sales.laundry.colors': string
    'sales.laundry.ironing': string
    'sales.laundry.washing': string
    'sales.laundry.washingAndIroning': string
    'sales.laundry.totalMachines': string
    'sales.laundry.itemsCount': string
    'sales.laundry.machine': string
    'sales.laundry.ironingPieces': string
    'sales.laundry.machines': string
    'sales.transfer.destination': string
    'sales.transfer.pickup': string
    'sales.transfer.flight': string
    'sales.transfer.rest': string
    'sales.addToNotes': string

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

    // Landing Page
    'landing.hero.trusted': string
    'landing.hero.title.prefix': string
    'landing.hero.title.suffix': string
    'landing.hero.subtitle': string
    'landing.hero.cta.primary': string
    'landing.hero.cta.secondary': string
    'landing.features.title': string
    'landing.features.subtitle': string
    'landing.getApp.title': string
    'landing.pricing.title': string
    'landing.pricing.subtitle': string
    'landing.pricing.cta': string
    'landing.getApp.appStore': string
    'landing.getApp.appStoreSub': string
    'landing.getApp.googlePlay': string
    'landing.getApp.googlePlaySub': string
    'landing.getApp.directApk': string
    'landing.getApp.directApkSub': string
    'landing.getApp.webApp': string
    'landing.getApp.webAppSub': string
    'landing.footer.contact': string
    'landing.footer.product': string
    'landing.footer.info': string
    'landing.footer.support': string
    'landing.footer.features': string
    'landing.footer.pricing': string
    'landing.footer.howItWorks': string
    'landing.footer.demo': string
    'landing.footer.blog': string
    'landing.footer.updates': string
    'landing.footer.status': string
    'landing.footer.privacy': string
    'landing.footer.terms': string
    'landing.footer.rights': string
    'landing.feature.mobile.title': string
    'landing.feature.mobile.desc': string
    'landing.feature.security.title': string
    'landing.feature.security.desc': string
    'landing.feature.sync.title': string
    'landing.feature.sync.desc': string
    'landing.feature.messaging.title': string
    'landing.feature.messaging.desc': string
    'landing.feature.handovers.title': string
    'landing.feature.handovers.desc': string
    'landing.feature.roster.title': string
    'landing.feature.roster.desc': string
    'landing.feature.analytics.title': string
    'landing.feature.analytics.desc': string
    'landing.feature.vault.title': string
    'landing.feature.vault.desc': string
    'landing.feature.tasks.title': string
    'landing.feature.tasks.desc': string

    'landing.footer.community': string
    'landing.footer.download': string

    'download.title': string
    'download.subtitle': string
    'community.title': string
    'community.subtitle': string

    // Landing Page Navbar
    'landing.nav.features': string
    'landing.nav.pricing': string
    'landing.nav.status': string
    'landing.nav.login': string
    'landing.nav.howItWorks': string
    'landing.nav.blog': string
    'landing.nav.updates': string
    'landing.nav.getStarted': string

    // Expansion Pages
    'features.title': string
    'features.subtitle': string
    'features.handovers.title': string
    'features.handovers.desc': string
    'features.roster.title': string
    'features.roster.desc': string
    'features.ai.title': string
    'features.ai.desc': string
    'features.analytics.title': string
    'features.analytics.desc': string
    'features.messaging.title': string
    'features.messaging.desc': string
    'features.cloud.title': string
    'features.cloud.desc': string

    'howItWorks.title': string
    'howItWorks.subtitle': string
    'howItWorks.step1.title': string
    'howItWorks.step1.desc': string
    'howItWorks.step2.title': string
    'howItWorks.step2.desc': string
    'howItWorks.step3.title': string
    'howItWorks.step3.desc': string
    'howItWorks.step4.title': string
    'howItWorks.step4.desc': string

    'updates.title': string
    'updates.subtitle': string
    'updates.v1.version': string
    'updates.v1.date': string
    'updates.v1.title': string
    'updates.v1.desc': string
    'updates.changelog': string

    'blog.title': string
    'blog.subtitle': string
    'blog.post1.title': string
    'blog.post1.excerpt': string
    'blog.post1.date': string
    'blog.post2.title': string
    'blog.post2.excerpt': string
    'blog.post2.date': string
    'blog.post1.content': string
    'blog.post2.content': string
    'blog.readMore': string
    'blog.author.team': string
    'blog.author.strategy': string
    'blog.category.hospitality': string
    'blog.category.ai': string

    // Mobile Overview Grid
    'overview.menu.desc': string
    'overview.notes.desc': string
    'overview.compliance.desc': string
    'overview.hotel.desc': string
    'overview.calendar.desc': string
    'overview.currency.desc': string
    'overview.roster.desc': string

    // Mobile Operations Grid
    'operations.messaging.desc': string
    'operations.feedback.desc': string
    'operations.offdays.desc': string
    'operations.tours.desc': string
    'operations.rooms.desc': string
    'operations.sales.desc': string
    'operations.pricing.desc': string
    'operations.team.desc': string
    'operations.activity.desc': string

    // Hotel Info
    'hotel.secure.title': string
    'hotel.secure.encrypted': string
    'hotel.secure.safeCode': string
    'hotel.secure.agency': string
    'hotel.secure.other': string
    'hotel.secure.kbs': string
    'hotel.secure.safeInfo': string
    'hotel.settings.fixturePrices': string
    'fixture.hand_towel': string
    'fixture.bath_towel': string
    'fixture.bed_sheet': string
    'fixture.pillow_case': string
    'fixture.duvet_cover': string
    'fixture.bathrobe': string
    'fixture.mattress_protector': string

    // Off Day
    'offday.management.title': string
    'offday.management.desc': string
    'offday.pending': string
    'offday.history': string
    'offday.petitions': string

    // Messages & Feedback
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

    // AI Modal
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

    // Shift Notes
    'notes.edited': string
    'notes.label': string

    // Pricing
    'pricing.title': string
    'pricing.subtitle': string
    'pricing.popular': string
    'common.month': string
    'pricing.monthly': string
    'pricing.annual': string
    'pricing.saveBadge': string
    'pricing.plan.lite': string
    'pricing.plan.lite.desc': string
    'pricing.plan.pro': string
    'pricing.plan.pro.desc': string
    'pricing.plan.enterprise': string
    'pricing.plan.enterprise.desc': string
    'pricing.button.getStarted': string
    'pricing.button.contact': string
    'pricing.feature.shiftLogs': string
    'pricing.feature.basicLogs': string
    'pricing.feature.support': string
    'pricing.feature.matrixRoster': string
    'pricing.feature.aiAssistant': string
    'pricing.feature.unlimitedLogs': string
    'pricing.feature.prioritySupport': string
    'pricing.feature.multiHotel': string
    'pricing.feature.apiAccess': string
    'pricing.feature.whiteLabel': string
    'pricing.feature.customSupport': string

    // FAQ
    'pricing.faq.title': string
    'pricing.faq.q1': string
    'pricing.faq.a1': string
    'pricing.faq.q2': string
    'pricing.faq.a2': string
    'pricing.contactSales': string
    'pricing.needHelp': string
    'pricing.back': string

    // Demo
    'demo.title': string
    'demo.subtitle': string
    'demo.gm': string
    'demo.gm.desc': string
    'demo.staff': string
    'demo.staff.desc': string
    'demo.enter.gm': string
    'demo.enter.staff': string
    'demo.back': string

    // Blacklist
    'blacklist.title': string
    'blacklist.addGuest': string
    'blacklist.addTitle': string
    'blacklist.firstName': string
    'blacklist.firstNamePlaceholder': string
    'blacklist.lastName': string
    'blacklist.lastNamePlaceholder': string
    'blacklist.reason': string
    'blacklist.reasonPlaceholder': string
    'blacklist.phone': string
    'blacklist.phonePlaceholder': string
    'blacklist.room': string
    'blacklist.roomPlaceholder': string
    'blacklist.relatedPersons': string
    'blacklist.relatedPlaceholder': string
    'blacklist.submit': string
    'blacklist.deleteConfirm': string
    'blacklist.empty': string
    'blacklist.addedBy': string
    'blacklist.reasonLabel': string
}

const translations: Record<Language, Translations> = {
    en: {
        // Landing Page Navbar & Footer
        'landing.nav.features': 'Features',
        'landing.nav.pricing': 'Pricing',
        'landing.nav.status': 'Status',
        'landing.nav.login': 'Login',
        'landing.nav.howItWorks': 'How it Works',
        'landing.nav.blog': 'Blog',
        'landing.nav.updates': 'Updates',
        'landing.nav.getStarted': 'Get Started',
        'landing.footer.privacy': 'Privacy Policy',
        'landing.footer.terms': 'Terms of Service',
        'landing.footer.status': 'System Status',

        // Expansion Pages
        'features.title': 'Technical Deep Dive',
        'features.subtitle': 'Aetherius Relay combines everything a hotel needs for daily operations into a single platform.',
        'features.handovers.title': 'Digital Shift Handovers',
        'features.handovers.desc': 'Replace paper logs with AI-summarized, secure, and searchable shift transfers.',
        'features.roster.title': 'Matrix Roster System',
        'features.roster.desc': 'Drag-and-drop weekly scheduling for GMs with automated shift conflict detection.',
        'features.ai.title': 'Advanced AI Assistant',
        'features.ai.desc': 'Context-aware AI that understands hotel data, generates reports, and assists operations.',
        'features.analytics.title': 'Financial Analytics',
        'features.analytics.desc': 'Real-time tracking of daily revenue, tour sales, and incident-related costs.',
        'features.messaging.title': 'Internal Messaging',
        'features.messaging.desc': 'Dedicated team communication hub focused on tasks and guest requests.',
        'features.cloud.title': 'Cloud Synchronization',
        'features.cloud.desc': 'Enterprise-grade infrastructure ensuring data is always accessible on any device.',

        'howItWorks.title': 'Operational Alchemy',
        'howItWorks.subtitle': 'Aetherius Relay eliminates complexity while digitalizing your hotel operations.',
        'howItWorks.step1.title': 'Quick Onboarding',
        'howItWorks.step1.desc': 'Import your hotel data in 5 minutes and invite your team to the platform.',
        'howItWorks.step2.title': 'Real-time Tracking',
        'howItWorks.step2.desc': 'Monitor all operational flow, sales, and notes from a live central dashboard.',
        'howItWorks.step3.title': 'Seamless Handover',
        'howItWorks.step3.desc': 'Critical info is automatically summarized and transferred during shift changes.',
        'howItWorks.step4.title': 'Mobile Empowerment',
        'howItWorks.step4.desc': 'Field staff enters data anywhere via mobile, instantly syncing with HQ.',
        'updates.title': 'Product Updates',
        'updates.subtitle': 'Aetherius Relay is constantly evolving. Here is what we have been building.',
        'updates.v1.version': 'v1.2.0',
        'updates.v1.date': 'Feb 2026',
        'updates.v1.title': 'AI Revolution',
        'updates.v1.desc': 'Google Gemini integration with automated shift summaries and prioritization.',
        'updates.changelog': 'Full Changelog',
        'landing.footer.product': 'Product',
        'landing.footer.info': 'Information',
        'landing.footer.support': 'Support',
        'landing.footer.features': 'Features',
        'landing.footer.pricing': 'Pricing',
        'landing.footer.howItWorks': 'How It Works',
        'landing.footer.demo': 'Live Demo',
        'landing.footer.blog': 'Blog',
        'landing.footer.updates': 'Updates',
        'landing.footer.rights': 'All rights reserved.',
        'landing.footer.contact': 'Contact Admin',

        'blog.title': 'Aetherius Relay Blog',
        'blog.subtitle': 'Insights and strategies for modern hotel management.',
        'blog.post1.title': 'The End of Paper Logbooks',
        'blog.post1.excerpt': 'Discover why modern hotels are ditching physical books for digital systems.',
        'blog.post1.date': 'Feb 12, 2026',
        'blog.post1.content': 'Traditional paper logbooks are no longer sufficient for today\'s fast-paced hotel operations. Lost info, illegible handwriting, and the difficulty of searching historical data reduce operational efficiency. With Aetherius Relay\'s digital logging process, you gain instant access, searchability, and the ability to make data-driven decisions.',
        'blog.post2.title': 'Maximizing ADR with AI',
        'blog.post2.excerpt': 'How artificial intelligence helps front office teams optimize room rates in real-time.',
        'blog.post2.date': 'Feb 10, 2026',
        'blog.post2.content': 'Managing room rates manually is a thing of the past. Aetherius Relay AI analyzes occupancy, competitor rates, and local events to provide optimal price recommendations for the highest ADR (Average Daily Rate). In this article, we explore how AI is revolutionizing revenue management and how front office teams can use these tools to be more profitable.',
        'blog.readMore': 'Read Full Insight',
        'blog.author.team': 'Aetherius Relay Team',
        'blog.author.strategy': 'Product Strategy',
        'blog.category.hospitality': 'Hospitality',
        'blog.category.ai': 'AI & Data',

        // Mobile Overview Grid
        'overview.menu.desc': 'Staff Meal',
        'overview.notes.desc': 'Log & Handover',
        'overview.compliance.desc': 'KBS & Agency',
        'overview.hotel.desc': 'Codes & Wifi',
        'overview.calendar.desc': 'Events & Shifts',
        'overview.currency.desc': 'Exchange Rates',
        'overview.roster.desc': 'Weekly Schedule',

        // Mobile Operations Grid
        'operations.messaging.desc': 'Chat & Updates',
        'operations.feedback.desc': 'Guest Issues',
        'operations.offdays.desc': 'Staff Schedule',
        'operations.tours.desc': 'Book Activities',
        'operations.rooms.desc': 'Management',
        'operations.sales.desc': 'Transactions',
        'operations.pricing.desc': 'Rate Cards',
        'operations.team.desc': 'Leaderboard',
        'operations.activity.desc': 'System Logs',

        // Pricing Page
        'pricing.title': 'Plans & Pricing',
        'pricing.subtitle': 'Simple, transparent pricing that grows with your business. No hidden fees.',
        'pricing.popular': 'MOST POPULAR',
        'common.month': 'month',
        'pricing.monthly': 'Monthly',
        'pricing.annual': 'Annual',
        'pricing.saveBadge': 'Save 20%',
        'pricing.plan.lite': 'Lite',
        'pricing.plan.lite.desc': 'For small hotels starting their digital journey.',
        'pricing.plan.pro': 'Pro',
        'pricing.plan.pro.desc': 'Advanced features for professional operations.',
        'pricing.plan.enterprise': 'Enterprise',
        'pricing.plan.enterprise.desc': 'Scale with multi-hotel management and API access.',
        'pricing.button.getStarted': 'Get Started',
        'pricing.button.contact': 'Contact Sales',
        'pricing.feature.shiftLogs': 'Digital Shift Logs',
        'pricing.feature.basicLogs': 'Fundamental Logging',
        'pricing.feature.support': 'Standard Support',
        'pricing.feature.matrixRoster': 'Matrix Roster System',
        'pricing.feature.aiAssistant': 'AI Assistant Integration',
        'pricing.feature.unlimitedLogs': 'Unlimited Cloud Storage',
        'pricing.feature.prioritySupport': 'Priority Tech Support',
        'pricing.feature.multiHotel': 'Multi-Hotel Management',
        'pricing.feature.apiAccess': 'External API Access',
        'pricing.feature.whiteLabel': 'White-label Options',
        'pricing.feature.customSupport': '24/7 Dedicated Manager',
        'pricing.faq.title': 'Frequently Asked Questions',
        'pricing.faq.q1': 'Can I upgrade my plan later?',
        'pricing.faq.a1': 'Yes, you can upgrade or downgrade your plan at any time from your settings.',
        'pricing.faq.q2': 'Is there a free trial?',
        'pricing.faq.a2': 'The Lite plan is free forever for small teams. For Pro, we offer a 14-day trial.',
        'pricing.contactSales': 'Contact Sales',
        'pricing.needHelp': 'Need help choosing?',
        'pricing.back': 'Back',

        // Pricing Module (New)
        'pricing.base.title': 'Base Prices',
        'pricing.base.desc': 'Set default rates for each room type. These apply to all agencies unless overridden by a special date range.',
        'pricing.agencies.title': 'Agency Rates',
        'pricing.agencies.desc': 'Manage special rates for specific travel agencies.',
        'pricing.agencies.add': 'Add Agency',
        'pricing.agencies.placeholder': 'Agency Name (e.g. TUI, Booking)',
        'pricing.agencies.empty': 'No agencies added yet.',
        'pricing.overrides.title': 'Special Date Ranges',
        'pricing.overrides.add': 'Add New Range',
        'pricing.overrides.empty': 'No special date ranges for this agency.',
        'pricing.lookup.title': 'Price Lookup',
        'pricing.lookup.desc': 'Quickly check the effective price for any date and agency.',
        'pricing.lookup.date': 'Select Date',
        'pricing.lookup.agency': 'Select Agency (Optional)',
        'pricing.lookup.effective': 'Effective Price',
        'pricing.lookup.basePriceUsed': 'Using Base Price',
        'pricing.lookup.overrideUsed': 'Using Agency Override',
        'pricing.save.success': 'Prices updated successfully',
        'pricing.save.error': 'Failed to save prices',
        'pricing.currency.select': 'Currency',
        'pricing.perNight': 'per night',
        'pricing.bulk.title': 'Bulk Rate Editor',
        'pricing.bulk.desc': 'Apply prices to a date range for everyone or an agency',
        'pricing.bulk.everyone': 'Everyone',
        'pricing.bulk.apply': 'Apply Range Prices',
        'pricing.date.start': 'Start Date',
        'pricing.date.end': 'End Date',
        'pricing.global_overrides.title': 'Special Periods (Everyone)',
        'pricing.global_overrides.desc': 'Prices defined here apply to all agencies during the specified dates.',
        'pricing.ai.title': 'AI Pricing Agent',
        'pricing.ai.desc': 'Paste date ranges and prices in text or table format.',
        'pricing.price.custom': 'Custom',

        // Room Types
        'room.standard': 'Standard Room',
        'room.corner': 'Corner Suite',
        'room.corner_jacuzzi': 'Corner Jacuzzi',
        'room.triple': 'Triple Room',
        'room.teras_suite': 'Terrace Suite',

        // Leaderboard
        'leaderboard.title': 'Team Leaderboard',
        'leaderboard.desc': 'Most active staff members based on engagement time.',
        'leaderboard.today': 'Today',
        'leaderboard.thisWeek': 'This Week',
        'leaderboard.noActivity': 'No activity recorded for this period yet.',
        'leaderboard.activeDuration': 'ACTIVE DURATION',

        // Demo Page
        'demo.title': 'Interactive Live Demo',
        'demo.subtitle': 'Experience the power of Aetherius Relay firsthand. Choose a persona to explore the dashboard.',
        'demo.gm': 'General Manager',
        'demo.gm.desc': 'Full access to all settings, analytics, staff management, and hotel configuration.',
        'demo.staff': 'Staff Member',
        'demo.staff.desc': 'Focused view for daily operations, shift logs, messaging, and task completion.',
        'demo.enter.gm': 'Enter as Manager',
        'demo.enter.staff': 'Enter as Receptionist',
        'demo.back': 'Back to Home',

        // Auth & Setup
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.email': 'Email Address',
        'auth.password': 'Password',
        'auth.name': 'Full Name',
        'auth.confirmPassword': 'Confirm Password',
        'auth.noAccount': "Don't have an account? Contact GM",
        'auth.haveAccount': 'Already have an account?',
        'auth.contactGM': 'Please contact your General Manager (GM) to be registered for your hotel.',
        'auth.contactSales': 'Contact Sales Team',
        'auth.error.enterName': 'Please enter your full name',
        'auth.error.passwordLength': 'Password must be at least 6 characters',
        'auth.error.passwordMismatch': 'Passwords do not match',
        'auth.error.regFailed': 'Registration failed. Please try again.',
        'auth.role.receptionist': 'Receptionist',
        'auth.role.receptionistDesc': 'Front desk operations, check-ins, and guest relations.',
        'auth.role.housekeeping': 'Housekeeping',
        'auth.role.housekeepingDesc': 'Room cleaning, maintenance reporting, and status updates.',
        'auth.registerSubtitle': 'Create your staff account',
        'auth.roleLabel': 'Select Your Role',
        'auth.creatingAccount': 'Creating account...',
        'auth.createAccount': 'Create Account',
        'auth.logout': 'Logout',
        'auth.switchAccount': 'Switch Hotel',
        'auth.backToHome': 'Back to Home',

        'auth.cycling.1': 'Digital Handover System',
        'auth.cycling.2': 'Forget About Notepads',
        'auth.cycling.3': 'AI Assisted Replies',
        'auth.cycling.4': 'Seamless Shifts',
        'auth.error.hotelCodeRequired': 'Hotel Code is required for this hotel.',
        'auth.error.invalidHotelCode': 'Invalid Hotel Code.',
        'auth.error.hotelNotFound': 'Account configuration error: Hotel not found.',
        'auth.error.verificationFailed': 'Verification failed. Please try again.',
        'auth.placeholder.hotelCode': 'HOTEL CODE',
        'auth.role.selection': 'I am a...',
        'auth.role.staff': 'Staff Member',
        'auth.role.staffDesc': 'Joining a team',
        'auth.role.manager': 'Manager',
        'auth.role.managerDesc': 'Creating a hotel',
        'auth.error.joinHotelCode': 'Please enter a Hotel Code to join your team.',
        'auth.error.invalidJoinCode': 'Invalid Hotel Code. Please check with your manager.',
        'auth.helper.askManager': 'Ask your manager for the hotel code.',

        'status.title': 'All Systems Operational',
        'status.subtitle': 'Everything is running smoothly.',
        'status.operational': 'Operational',
        'status.uptime': 'Uptime',
        'status.lastUpdated': 'Last updated: Just now',
        'status.systems.api': 'API Gateway',
        'status.systems.db': 'Database Clusters',
        'status.systems.messaging': 'Real-time Messaging',
        'status.systems.notifications': 'Notifications',
        'status.systems.auth': 'Auth Services',

        'privacy.title': 'Privacy Policy',
        'privacy.lastUpdated': 'Last updated: February 11, 2026',
        'privacy.intro.title': '1. Information We Collect',
        'privacy.intro.desc': 'We collect information you provide directly to us, such as when you create an account, update your profile, or use our communication features. This includes:',
        'privacy.intro.list1': 'Account information (name, email, hotel affiliation)',
        'privacy.intro.list2': 'Operational data (shift logs, messages, task status)',
        'privacy.intro.list3': 'Usage data (login times, feature interaction)',
        'privacy.use.title': '2. How We Use Information',
        'privacy.use.desc': 'We use the information we collect to operate, maintain, and improve our services, such as:',
        'privacy.use.list1': 'Facilitating shift handovers and staff communication',
        'privacy.use.list2': 'Providing analytics to hotel management',
        'privacy.use.list3': 'Sending technical notices and security alerts',
        'privacy.security.title': '3. Data Security',
        'privacy.security.desc': 'We use "Military-Grade" encryption for sensitive data, including hotel access codes and financial logs. Access to data is strictly role-based and logged.',
        'privacy.contact.title': '4. Contact Us',
        'privacy.contact.desc': 'If you have questions about this Privacy Policy, please contact us at: ',

        'terms.title': 'Terms of Service',
        'terms.lastUpdated': 'Last updated: February 11, 2026',
        'terms.acceptance.title': '1. Acceptance of Terms',
        'terms.acceptance.desc': 'By accessing or using Aetherius Relay, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.',
        'terms.license.title': '2. Use License',
        'terms.license.desc': 'Aetherius Relay grants you a limited, non-exclusive, non-transferable, revocable license to use the Service for your internal business operations (hotel management).',
        'terms.responsibilities.title': '3. User Responsibilities',
        'terms.responsibilities.desc': 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use.',
        'terms.availability.title': '4. Availability',
        'terms.availability.desc': 'While we strive for 99.9% uptime, we do not guarantee that the service will be uninterrupted or error-free. We reserve the right to modify or discontinue the service at any time.',
        'terms.contact.title': '5. Contact',
        'terms.contact.desc': 'Questions? Email us at ',

        'setup.title': 'Hotel Setup',
        'setup.subtitle': 'Join an existing hotel or create a new one to begin.',
        'setup.joinExisting': 'Join Existing Hotel',
        'setup.createNew': 'Create New Hotel',
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

        // Status & Urgency
        'status.active': 'Active',
        'status.ongoing': 'Shift Ongoing',
        'status.resolved': 'Resolved',
        'status.archived': 'Archived',
        'status.open': 'Open',
        'status.noActiveShift': 'No active shift',
        'status.low': 'Low',
        'status.medium': 'Medium',
        'status.critical': 'Critical',
        'status.all': 'All',
        'urgency.low': 'Low',
        'urgency.medium': 'Medium',
        'urgency.high': 'High',
        'urgency.critical': 'Critical',

        // Modules
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
        'module.activity': 'Activity',
        'module.messaging': 'Messaging',
        'module.complaints': 'Complaints',
        'module.offDays': 'Off-Days',
        'module.tours': 'Tours',
        'module.sales': 'Sales',
        'module.pricing_label': 'Pricing',
        'module.team_label': 'Team',
        'log.stickyBoard': 'Sticky Board',
        'compliance.kbsLate': 'KBS System check is required immediately! Please verify guest identities.',

        // Handover Wizard
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

        // Room Management
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

        // Hotel
        'hotel.laundry': 'Laundry Service',
        'hotel.ironing': 'Ironing',
        'hotel.transfer': 'Airport Transfer',
        'hotel.lateCheckout': 'Late Checkout',
        'hotel.extraBed': 'Extra Bed',
        'hotel.iban': 'Bank IBAN',
        'hotel.bankName': 'Bank Name',
        'hotel.bankNamePlaceholder': 'e.g. Garanti BBVA',
        'hotel.additionalNotes': 'Additional Notes',
        'hotel.notesPlaceholder': 'Any other important information...',
        'hotel.bankAccount': 'Bank Account',
        'hotel.settings.minibarPrices': 'Minibar Prices',
        'hotel.settings.fixturePrices': 'Fixture Damage Prices',
        'hotel.noInfo': 'No hotel information set',
        'hotel.clickEdit': 'Click edit to add',
        'hotel.secure.title': 'Secure Information (KBS / Agency)',
        'hotel.secure.encrypted': 'Encrypted Section',
        'hotel.secure.safeCode': 'Safe Code',
        'hotel.secure.agency': 'Agency Logins (Extranet)',
        'hotel.secure.other': 'Other Safe Info',
        'hotel.secure.kbs': 'KBS Login Info',
        'hotel.secure.safeInfo': 'Safe & Key Info',

        // Log
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

        // Shifts & Roster
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
        'roster.title': 'Weekly Roster',
        'roster.currentWeek': 'This Week',
        'roster.noStaff': 'No staff members found',
        'roster.show': 'Show in Roster',
        'roster.hide': 'Hide from Roster',
        'roster.unknown': 'Unknown User',

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
        'category.paymentNeeded': 'Payment Needed',
        'category.restaurant': 'Restaurant/Bar',
        'category.minibar': 'Minibar',
        'category.maintenance': 'Maintenance',
        'category.guest_request': 'Guest Request',
        'category.complaint': 'Complaint',
        'category.system': 'System',
        'category.other': 'Other',

        // Priority
        'priority.label': 'Priority',
        'priority.low': 'Low',
        'priority.medium': 'Medium',
        'priority.high': 'High',
        'priority.critical': 'Critical',

        // Notes
        'notes.activeCount': 'Active Notes',
        'notes.noNotes': 'No active notes',
        'notes.aiHelp': 'AI Assist',
        'notes.noFixturePrices': 'No fixture prices configured by management.',
        'notes.anonymous': 'Anonymous',
        'notes.edited': '(edited)',
        'notes.label': 'shift notes',

        // Minibar
        'minibar.cola': 'Cola',
        'minibar.cola_zero': 'Cola Zero',
        'minibar.fanta': 'Fanta',
        'minibar.sprite': 'Sprite',
        'minibar.soda': 'Soda',

        // Fixtures
        'fixture.hand_towel': 'Hand Towel',
        'fixture.bath_towel': 'Bath Towel',
        'fixture.bed_sheet': 'Bed Sheet',
        'fixture.pillow_case': 'Pillow Case',
        'fixture.duvet_cover': 'Duvet Cover',
        'fixture.bathrobe': 'Bathrobe',
        'fixture.mattress_protector': 'Mattress Protector',

        // Notifications
        'notifications.title': 'Notifications',
        'notifications.markAsRead': 'Mark as read',
        'notifications.markAllRead': 'Mark all read',
        'notifications.noNotifications': 'No new notifications',
        'notifications.viewAll': 'View All Activity',
        'notifications.duePayments.title': 'Pending Payments',
        'notifications.duePayments.content': '{count} sales have a total of {amount}€ uncollected.',
        'notifications.compliance.pending': 'Shift {shift} compliance tasks (KBS/Agency) are still pending. Please complete them.',

        // Feedback
        'feedback.placeholder': 'Describe your concern or feedback here...',
        'feedback.submitSuccess': 'Submitted Successfully',
        'feedback.thankYou': 'Thank you for your feedback.',
        'feedback.submitAnonymous': 'Submit Anonymously',
        'feedback.recentTitle': 'Recent Feedback',
        'feedback.noComplaints': 'No complaints to show.',
        'feedback.anonymous.title': 'Anonymous Feedback',
        'feedback.anonymous.subtitle': 'Your voice matters safely.',
        'feedback.privacy.title': 'Privacy Guaranteed',
        'feedback.privacy.desc': 'We use hotel-level collections without user associations. Even database administrators cannot trace feedback to a specific user account.',
        'feedback.submit.title': 'Submit Anonymous Complaint',
        'feedback.submit.desc': 'Your identity is completely hidden. No personal data is stored with your message.',
        'feedback.management.view': 'Management View',

        // Messaging
        'messaging.everyone': 'Message everyone',
        'messaging.gmOnly': 'Only General Managers can send announcements.',
        'messaging.placeholder': 'Message ...',
        'messaging.noMessages': 'No messages yet. Start the conversation!',
        'messaging.clearChatConfirm': 'Are you sure you want to clear this conversation? This action cannot be undone.',
        'messaging.deleteMessageConfirm': 'Delete this message?',
        'messaging.clearTooltip': 'Clear Chat History',
        'messaging.deleteTooltip': 'Delete message',
        'messages.title': 'Messages',
        'messages.search': 'Search staff...',
        'messages.announcements': 'General Announcements',
        'messages.broadcast': 'Broadcast to all staff',

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
        'sales.selectTour': 'Select Tour',
        'sales.destinationPlaceholder': 'Destination (e.g. Airport)',
        'sales.details.service': 'Service Details',
        'sales.details.financials': 'Financials',
        'sales.details.pickup': 'Pickup Time',
        'sales.details.ticket': 'Ticket #',
        'sales.details.pax': 'Pax',
        'sales.details.total': 'Total Price',
        'sales.details.paid': 'Paid So Far',
        'sales.details.collect': 'Collect Payment',
        'sales.details.remaining': 'Remaining',
        'sales.details.notes': 'Notes',
        'sales.details.history': 'Payment History',
        'sales.details.exchange': 'Exchange Value',
        'sales.details.created': 'Created by {name} on {date}',
        'sales.details.noNotes': 'No notes added.',
        'sales.details.amountPlaceholder': 'Amount...',
        'sales.details.valuePlaceholder': 'Value in {currency}...',
        'sales.details.ticketPlaceholder': 'e.g. T-12345',
        'sales.details.notesPlaceholder': 'Add notes about pickup location, preferences, etc.',
        'sales.details.deleteConfirm': 'Are you sure you want to completely delete this sale record?',
        'sales.details.save': 'Save Changes',
        'sales.details.cancel': 'Cancel',
        'sales.details.person': 'Person',
        'sales.details.persons': 'Person(s)',
        'sales.details.notSet': 'Not set',
        'sales.details.none': 'None',
        'sales.status.waiting': 'Waiting',
        'sales.status.confirmed': 'Confirmed',
        'sales.status.pickup_pending': 'Pickup Pending',
        'sales.status.realized': 'Realized',
        'sales.status.delivered': 'Delivered',
        'sales.status.cancelled': 'Cancelled',
        'sales.payment.pending': 'Pending',
        'sales.payment.partial': 'Partial',
        'sales.payment.paid': 'Paid',
        'sales.type.tour': 'Tour',
        'sales.type.transfer': 'Transfer',
        'sales.type.laundry': 'Laundry',
        'sales.type.other': 'Other',
        'sales.laundry.whites': 'Whites (Pieces)',
        'sales.laundry.colors': 'Colors (Pieces)',
        'sales.laundry.ironing': 'Ironing Only',
        'sales.laundry.washing': 'Washing & Drying',
        'sales.laundry.washingAndIroning': 'Wash & Iron',
        'sales.laundry.totalMachines': 'Total Machines',
        'sales.laundry.itemsCount': '{count} items ({type})',
        'sales.laundry.ironingPieces': 'Ironing (Pieces)',
        'sales.laundry.machine': 'machine',
        'sales.laundry.machines': 'machines',
        'sales.transfer.destination': 'Destination',
        'sales.transfer.pickup': 'Pickup Location',
        'sales.transfer.flight': 'Flight Number',
        'sales.transfer.rest': 'Rest (Vehicle)',
        'sales.addToNotes': 'Add to Shift Notes',

        // Compliance
        'compliance.kbs.required': 'KBS Check Required!',
        'compliance.kbs.pastTime': "It's past 23:00",
        'compliance.kbs.desc': 'The KBS system check must be completed before your shift ends. This is a mandatory compliance requirement.',
        'compliance.kbs.remindLater': 'Remind Later',
        'compliance.kbs.checkNow': 'Check KBS Now',
        'compliance.agency.label': 'Agency Messages Checked',
        'compliance.agency.desc': 'Check all OTA messages (Booking, Expedia, etc.)',
        'compliance.kbs.label': 'KBS System Verified',
        'compliance.kbs.checklistDesc': 'Daily compliance check before 23:00',

        // Onboarding
        'onboarding.welcome.title': 'Welcome to Aetherius Relay',
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
        'tour.intro.title': 'Welcome to Aetherius Relay',
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

        // Daily Menu
        'menu.title': 'Staff Daily Menu',
        'menu.content': 'Today\'s Menu',
        'menu.edit': 'Edit Menu',
        'menu.updateSuccess': 'Menu updated successfully',
        'menu.noMenuToday': 'No menu shared for today yet.',
        'menu.hours': 'Service Hours',
        'menu.breakfastTime': 'Breakfast: 07:00 - 09:00',
        'menu.lunchTime': 'Lunch: 12:00 - 13:30',
        'menu.dinnerTime': 'Dinner: 17:00 - 18:30',



        // Off Day
        'offday.management.title': 'Leave & Shift Management',
        'offday.management.desc': 'Manage staff leave and shift requests.',
        'offday.pending': 'Pending Requests',
        'offday.history': 'Request History',
        'offday.petitions': 'Complaints & Petitions',

        // AI Modal
        'ai.title': 'Aetherius Relay AI Assistant',
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



        'app.welcome': 'Welcome to Aetherius Relay',
        'app.description': 'Your digital handover system for seamless hotel operations.',
        'app.activeShift': 'Active Shift',
        'app.openTickets': 'Open Tickets',
        'app.cashBalance': 'Cash Balance',
        'app.systemTitle': 'Aetherius Relay Hotel Operations System',

        'common.add': 'Add',
        'common.cancel': 'Cancel',
        'common.edited': 'edited',
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
        'common.language': 'Language',
        'common.appearance': 'Appearance',
        'appearance.avatar_style': 'Avatar Style',
        'appearance.avatar.initials': 'Initials',
        'appearance.avatar.name': 'Full Name',
        'appearance.avatar.emoji': 'Emoji',
        'appearance.avatar.choose_emoji': 'Choose Emoji',
        'common.formatting.bulletList': 'Bullet List',
        'common.updateAvailable': 'New version available',
        'common.updateDescription': 'Please refresh the page to use the latest features.',
        'common.refreshNow': 'Refresh Now',
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
        'common.dismiss': 'Dismiss',
        'common.backToHome': 'Back to Home',
        'common.profile': 'Profile',

        'currency.title': 'Exchange Rates (TCMB)',
        'currency.buying': 'Bank Buys (Bozma)',
        'currency.selling': 'Bank Sells (Satış)',
        'currency.lastUpdated': 'Updated',
        'announcement.title': 'Important Announcement',
        'announcement.deleteConfirm': 'Are you sure you want to delete this announcement?',
        'common.clear': 'Clear Chat',

        'landing.feature.vault.desc': 'Password-protected storage for agency logins and KBS.',
        'landing.feature.tasks.title': 'Automated Tasks',
        'landing.feature.tasks.desc': 'Recurring checklists ensure compliance every day.',

        'landing.hero.trusted': "Trusted by over 500 Hotels",
        'landing.hero.title.prefix': 'Next Gen',
        'landing.hero.title.suffix': 'Hospitality',
        'landing.hero.subtitle': 'Smart operating system for modern hotels. Seamless shift transfers, real-time sync, and operations automation.',
        'landing.hero.cta.primary': 'Try for Free',
        'landing.hero.cta.secondary': 'Live Demo',
        'landing.features.title': 'Full-Spectrum Hotel Operations',
        'landing.features.subtitle': 'Everything you need to manage a modern hotel efficiently.',
        'landing.getApp.title': 'Download Aetherius Relay',
        'landing.pricing.title': 'Ready to upgrade your hotel?',
        'landing.pricing.subtitle': 'Join over 500 hotels using Aetherius Relay to streamline their operations.',
        'landing.pricing.cta': 'View Plans',
        'landing.getApp.appStore': 'App Store',
        'landing.getApp.appStoreSub': 'Download for iOS',
        'landing.getApp.googlePlay': 'Google Play',
        'landing.getApp.googlePlaySub': 'Get it on Android',
        'landing.getApp.directApk': 'Direct APK',
        'landing.getApp.directApkSub': 'Android Package',
        'landing.getApp.webApp': 'Web App',
        'landing.getApp.webAppSub': 'Access in Browser',
        'landing.feature.mobile.title': 'Mobile First',
        'landing.feature.mobile.desc': 'Built for staff on the move. Works perfectly on any device.',
        'landing.feature.security.title': 'Military-Grade Security',
        'landing.feature.security.desc': 'Encrypted vaults for your most sensitive data and passwords.',
        'landing.feature.sync.title': 'Real-time Sync',
        'landing.feature.sync.desc': 'Changes are updated instantly across all devices.',
        'landing.feature.messaging.title': 'Instant Messaging',
        'landing.feature.messaging.desc': 'Secure internal comms replacing WhatsApp groups.',
        'landing.feature.handovers.title': 'Smart Handovers',
        'landing.feature.handovers.desc': 'Digital logbooks that ensure nothing gets lost between shifts.',
        'landing.feature.roster.title': 'Staff Rostering',
        'landing.feature.roster.desc': 'Drag-and-drop scheduling with automated notifications.',
        'landing.feature.analytics.title': 'Analytics Dashboard',
        'landing.feature.analytics.desc': 'Visual insights into hotel performance and efficiency.',
        'landing.feature.vault.title': 'Secret Vault',

        // Blacklist
        'blacklist.title': 'Blacklisted Guests',
        'blacklist.addGuest': 'Add Guest',
        'blacklist.addTitle': 'Add to Blacklist',
        'blacklist.firstName': 'First Name *',
        'blacklist.firstNamePlaceholder': 'John',
        'blacklist.lastName': 'Last Name',
        'blacklist.lastNamePlaceholder': 'Doe',
        'blacklist.reason': 'Reason *',
        'blacklist.reasonPlaceholder': 'Detailed reason for blacklisting...',
        'blacklist.phone': 'Phone Number(s)',
        'blacklist.phonePlaceholder': '+123..., +456...',
        'blacklist.room': 'Room Number(s)',
        'blacklist.roomPlaceholder': '101, 102...',
        'blacklist.relatedPersons': 'Related Persons',
        'blacklist.relatedPlaceholder': 'Family members or friends...',
        'blacklist.submit': 'Add to Blacklist',
        'blacklist.deleteConfirm': 'Are you sure you want to remove this guest from the blacklist?',
        'blacklist.empty': 'No blacklisted guests.',
        'blacklist.addedBy': 'Added by {name} • {date}',
        'blacklist.reasonLabel': 'Reason:',

        'landing.footer.community': 'Community',
        'landing.footer.download': 'Download App',

        'download.title': 'Download Aetherius Relay',
        'download.subtitle': 'Get the power of Relay on all your devices.',
        'community.title': 'Relay Community',
        'community.subtitle': 'Connect with other hospitality professionals.',
    },
    tr: {
        // Auth & Setup
        'auth.login': 'Giriş Yap',
        'auth.register': 'Kayıt Ol',
        'auth.email': 'E-posta Adresi',
        'auth.password': 'Şifre',
        'auth.name': 'Tam Ad',
        'auth.confirmPassword': 'Şifreyi Onayla',
        'auth.noAccount': 'Hesabınız yok mu? GM ile görüşün',
        'auth.haveAccount': 'Zaten hesabınız var mı?',
        'auth.contactGM': 'Otelinize kayıt olmak için lütfen Genel Müdürünüze (GM) danışın.',
        'auth.contactSales': 'Satış Ekibiyle İletişime Geçin',
        'auth.error.enterName': 'Lütfen tam adınızı girin',
        'auth.error.passwordLength': 'Şifre en az 6 karakter olmalıdır',
        'auth.error.passwordMismatch': 'Şifreler eşleşmiyor',
        'auth.error.regFailed': 'Kayıt başarısız. Lütfen tekrar deneyin.',
        'auth.role.receptionist': 'Resepsiyonist',
        'auth.role.receptionistDesc': 'Ön büro işlemleri, girişler ve misafir ilişkileri.',
        'auth.role.housekeeping': 'Kat Hizmetleri',
        'auth.role.housekeepingDesc': 'Oda temizliği, teknik bildirimler ve durum güncellemeleri.',
        'auth.registerSubtitle': 'Personel hesabınızı oluşturun',
        'auth.roleLabel': 'Rolünüzü Seçin',
        'auth.creatingAccount': 'Hesap oluşturuluyor...',
        'auth.createAccount': 'Hesap Oluştur',
        'auth.logout': 'Çıkış Yap',
        'auth.switchAccount': 'Otel Değiştir',
        'auth.backToHome': 'Ana Sayfaya Dön',

        'auth.cycling.1': 'Dijital Devir Teslim Sistemi',
        'auth.cycling.2': 'Not Defterlerini Unutun',
        'auth.cycling.3': 'AI Destekli Yanıtlar',
        'auth.cycling.4': 'Sorunsuz Vardiyalar',
        'auth.error.hotelCodeRequired': 'Bu otel için Otel Kodu gereklidir.',
        'auth.error.invalidHotelCode': 'Geçersiz Otel Kodu.',
        'auth.error.hotelNotFound': 'Hesap yapılandırma hatası: Otel bulunamadı.',
        'auth.error.verificationFailed': 'Doğrulama başarısız. Lütfen tekrar deneyin.',
        'auth.placeholder.hotelCode': 'OTEL KODU',
        'auth.role.selection': 'Ben bir...',
        'auth.role.staff': 'Personel',
        'auth.role.staffDesc': 'Bir ekibe katılıyorum',
        'auth.role.manager': 'Yönetici',
        'auth.role.managerDesc': 'Bir otel oluşturuyorum',
        'auth.error.joinHotelCode': 'Ekibinize katılmak için lütfen bir Otel Kodu girin.',
        'auth.error.invalidJoinCode': 'Geçersiz Otel Kodu. Lütfen yöneticinizle kontrol edin.',
        'auth.helper.askManager': 'Sormak için yöneticinizle iletişime geçin.',

        'status.title': 'Tüm Sistemler Çalışıyor',
        'status.subtitle': 'Her şey sorunsuz çalışıyor.',
        'status.operational': 'Çalışıyor',
        'status.uptime': 'Çalışma Süresi',
        'status.lastUpdated': 'Son güncelleme: Az önce',
        'status.systems.api': 'API Ağ Geçidi',
        'status.systems.db': 'Veritabanı Kümeleri',
        'status.systems.messaging': 'Gerçek Zamanlı Mesajlaşma',
        'status.systems.notifications': 'Bildirimler',
        'status.systems.auth': 'Kimlik Doğrulama Servisleri',

        'privacy.title': 'Gizlilik Politikası',
        'privacy.lastUpdated': 'Son güncelleme: 11 Şubat 2026',
        'privacy.intro.title': '1. Topladığımız Bilgiler',
        'privacy.intro.desc': 'Hesap oluşturduğunuzda, profilinizi güncellediğinizde veya iletişim özelliklerimizi kullandığınızda bize doğrudan sağladığınız bilgileri topluyoruz. Bunlar şunları içerir:',
        'privacy.intro.list1': 'Hesap bilgileri (isim, e-posta, otel bağlantısı)',
        'privacy.intro.list2': 'Operasyonel veriler (vardiya kayıtları, mesajlar, görev durumu)',
        'privacy.intro.list3': 'Kullanım verileri (giriş zamanları, özellik etkileşimleri)',
        'privacy.use.title': '2. Bilgileri Nasıl Kullanıyoruz',
        'privacy.use.desc': 'Topladığımız bilgileri hizmetlerimizi işletmek, sürdürmek ve iyileştirmek için kullanıyoruz, örneğin:',
        'privacy.use.list1': 'Vardiya devir teslimlerini ve personel iletişimini kolaylaştırmak',
        'privacy.use.list2': 'Otel yönetimine analiz sağlamak',
        'privacy.use.list3': 'Teknik bildirimler ve güvenlik uyarıları göndermek',
        'privacy.security.title': '3. Veri Güvenliği',
        'privacy.security.desc': 'Otel erişim kodları ve finansal kayıtlar dahil olmak üzere hassas veriler için "Askeri Düzeyde" şifreleme kullanıyoruz. Verilere erişim kesinlikle rol tabanlıdır ve kaydedilir.',
        'privacy.contact.title': '4. Bize Ulaşın',
        'privacy.contact.desc': 'Bu Gizlilik Politikası hakkında sorularınız varsa, lütfen şu adresten bizimle iletişime geçin: ',

        'terms.title': 'Hizmet Şartları',
        'terms.lastUpdated': 'Last updated: February 11, 2026',
        'terms.acceptance.title': '1. Şartların Kabulü',
        'terms.acceptance.desc': 'Aetherius Relay\'e erişerek veya kullanarak, bu Şartlara bağlı kalmayı kabul edersiniz. Şartların herhangi bir kısmını kabul etmiyorsanız, hizmete erişemezsiniz.',
        'terms.license.title': '2. Kullanım Lisansı',
        'terms.license.desc': 'Aetherius Relay, Hizmeti dahili iş operasyonlarınız (otel yönetimi) için kullanmanız üzere size sınırlı, münhasır olmayan, devredilemez, iptal edilebilir bir lisans verir.',
        'terms.responsibilities.title': '3. Kullanıcı Sorumlulukları',
        'terms.responsibilities.desc': 'Hesap bilgilerinizin gizliliğini korumaktan ve hesabınız altında gerçekleşen tüm faaliyetlerden siz sorumlusunuz. Herhangi bir yetkisiz kullanımı derhal bize bildirmelisiniz.',
        'terms.availability.title': '4. Kullanılabilirlik',
        'terms.availability.desc': '%99,9 çalışma süresi için çabalasak da, hizmetin kesintisiz veya hatasız olacağını garanti etmiyoruz. Hizmeti herhangi bir zamanda değiştirme veya sonlandırma hakkımızı saklı tutuyoruz.',
        'terms.contact.title': '5. İletişim',
        'terms.contact.desc': 'Sorunuz mu var? Bize şu adresten ulaşın: ',

        'setup.title': 'Otel Kurulumu',
        'setup.subtitle': 'Başlamak için mevcut bir otele katılın veya yeni bir tane oluşturun.',
        'setup.joinExisting': 'Mevcut Otele Katıl',
        'setup.createNew': 'Yeni Otel Oluştur',
        'setup.hotelName': 'Otel Adı',
        'setup.address': 'Adres',
        'setup.optional': 'isteğe bağlı',
        'setup.loading': 'Oteller yükleniyor...',
        'setup.noHotels': 'Otel bulunamadı',
        'setup.createSuccess': 'Otel başarıyla oluşturuldu',
        'setup.joinSuccess': 'Otele Katıl',
        'setup.unnamedHotel': 'İsimsiz Otel',
        'setup.error.joinFailed': 'Otele katılma başarısız',
        'setup.error.enterName': 'Lütfen bir otel adı girin',
        'setup.error.createFailed': 'Otel oluşturma başarısız',
        'setup.hotelNamePlaceholder': 'örn. Grand Palace Otel',
        'setup.addressPlaceholder': '123 Ana Cadde, Şehir',

        // Dashboard
        'dashboard.welcome': 'Tekrar hoşgeldin, {name}',
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
        'dashboard.noAssignedShift': 'Bugün için atanan vardiya yok',
        'dashboard.operationsHub': 'Operasyon Merkezi',
        'dashboard.operationsDesc': 'Otel içi iletişim, geri bildirim ve servisleri tek bir yerden yönetin.',
        'dashboard.userProfile': 'Kullanıcı Profili',

        // Status & Urgency
        'status.active': 'Aktif',
        'status.ongoing': 'Vardiya Devam Ediyor',
        'status.resolved': 'Çözüldü',
        'status.archived': 'Arşivlendi',
        'status.open': 'Açık',
        'status.noActiveShift': 'Aktif vardiya yok',
        'status.low': 'Düşük',
        'status.medium': 'Orta',
        'status.critical': 'Kritik',
        'status.all': 'Hepsi',
        'urgency.low': 'Düşük',
        'urgency.medium': 'Orta',
        'urgency.high': 'Yüksek',
        'urgency.critical': 'Kritik',

        // Modules
        'module.activityFeed': 'Canlı Aktivite Akışı',
        'module.stickyBoard': 'Önemli Notlar',
        'module.compliance': 'Uyumluluk Listesi',
        'module.shiftNotes': 'Vardiya Notları',
        'module.hotelInfo': 'Otel Bilgileri',
        'module.roster': 'Personel Çizelgesi',
        'module.calendar': 'Takvim',
        'module.maintenance': 'Teknik Servis',
        'module.guest_request': 'Misafir İsteği',
        'module.complaint': 'Şikayet',
        'module.system': 'Sistem',
        'module.overview': 'Genel Bakış',
        'module.operations': 'Operasyon Merkezi',
        'module.activity': 'Aktivite',
        'module.messaging': 'Mesajlaşma',
        'module.complaints': 'Şikayetler',
        'module.offDays': 'İzin Günleri',
        'module.tours': 'Turlar',
        'module.sales': 'Satışlar',
        'module.pricing_label': 'Fiyatlar',
        'module.team_label': 'Ekip',

        // Pricing Module (New)
        'pricing.base.title': 'Taban Fiyatlar',
        'pricing.base.desc': 'Her oda tipi için varsayılan fiyatları belirleyin. Bu fiyatlar, özel bir tarih aralığı tanımlanmadığı sürece tüm acenteler için geçerlidir.',
        'pricing.agencies.title': 'Acente Fiyatları',
        'pricing.agencies.desc': 'Belirli seyahat acenteleri için özel fiyatları yönetin.',
        'pricing.agencies.add': 'Acente Ekle',
        'pricing.agencies.placeholder': 'Acente Adı (Örn: TUI, Booking)',
        'pricing.agencies.empty': 'Henüz acente eklenmedi.',
        'pricing.overrides.title': 'Özel Tarih Aralıkları',
        'pricing.overrides.add': 'Yeni Aralık Ekle',
        'pricing.overrides.empty': 'Bu acente için özel tarih aralığı bulunmuyor.',
        'pricing.lookup.title': 'Fiyat Sorgulama',
        'pricing.lookup.desc': 'Herhangi bir tarih ve acente için geçerli fiyatı hızlıca kontrol edin.',
        'pricing.lookup.date': 'Tarih Seçin',
        'pricing.lookup.agency': 'Acente Seçin (Opsiyonel)',
        'pricing.lookup.effective': 'Geçerli Fiyat',
        'pricing.lookup.basePriceUsed': 'Taban Fiyat Kullanılıyor',
        'pricing.lookup.overrideUsed': 'Acente Özel Fiyatı Kullanılıyor',
        'pricing.save.success': 'Fiyatlar başarıyla güncellendi',
        'pricing.save.error': 'Fiyatlar kaydedilemedi',
        'pricing.currency.select': 'Para Birimi',
        'pricing.perNight': 'gecelik',
        'pricing.bulk.title': 'Toplu Fiyat Düzenleyici',
        'pricing.bulk.desc': 'Belirli bir tarih aralığı için toplu fiyat uygula',
        'pricing.bulk.everyone': 'Herkes',
        'pricing.bulk.apply': 'Aralık Fiyatlarını Uygula',
        'pricing.date.start': 'Başlangıç Tarihi',
        'pricing.date.end': 'Bitiş Tarihi',
        'pricing.global_overrides.title': 'Özel Dönemler (Herkes)',
        'pricing.global_overrides.desc': 'Burada tanımlanan fiyatlar belirtilen tarihlerde tüm acenteler için geçerlidir.',
        'pricing.ai.title': 'AI Fiyat Asistanı',
        'pricing.ai.desc': 'Tarih aralıklarını ve fiyatları metin veya tablo formatında yapıştırın.',

        // Room Types
        'room.standard': 'Standart Oda',
        'room.corner': 'Corner Süit',
        'room.corner_jacuzzi': 'Corner Jakuzi',
        'room.triple': 'Üç Kişilik Oda',
        'room.teras_suite': 'Teras Süit',

        // Leaderboard
        'leaderboard.title': 'Ekip Liderlik Tablosu',
        'leaderboard.desc': 'Etkileşim süresine göre en aktif personel.',
        'leaderboard.today': 'Bugün',
        'leaderboard.thisWeek': 'Bu Hafta',
        'leaderboard.noActivity': 'Bu dönem için henüz aktivite kaydedilmedi.',
        'leaderboard.activeDuration': 'AKTİF SÜRE',
        'log.stickyBoard': 'Önemli Notlar',
        'compliance.kbsLate': 'KBS Kontrolü hemen yapılmalıdır! Lütfen misafir kimliklerini doğrulayın.',

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
        'category.paymentNeeded': 'Ödeme Gerekli',
        'category.restaurant': 'Restoran/Bar',
        'category.minibar': 'Minibar',
        'category.maintenance': 'Bakım',
        'category.guest_request': 'Misafir İsteği',
        'category.complaint': 'Şikayet',
        'category.system': 'Sistem',
        'category.other': 'Diğer',

        // Priority
        'priority.label': 'Öncelik',
        'priority.low': 'Düşük',
        'priority.medium': 'Orta',
        'priority.high': 'Yüksek',
        'priority.critical': 'Kritik',

        // Handover Wizard
        'handover.title': 'Devir Teslim Sihirbazı',
        'handover.step.tickets': 'Açık Kayıtları İncele',
        'handover.step.cash': 'Kasa Sayımı',
        'handover.step.notes': 'Devir Notları',
        'handover.step.confirm': 'Onayla ve Bitir',
        'handover.tickets.desc': 'Devam etmeden önce her açık kaydı onaylayın',
        'handover.cash.desc': 'Devir öncesi tüm nakit sayımını yapın',
        'handover.notes.desc': 'Bir sonraki vardiya için önemli notlar bırakın',
        'handover.confirm.desc': 'Devir özetinizi inceleyin',
        'handover.cash.started': 'Başlangıç',
        'handover.cash.difference': 'Fark',
        'handover.complete': 'Devir Teslimi Tamamla',
        'handover.wizard': 'Devir Teslim Sihirbazı',
        'handover.noOpenTickets': 'Açık kayıt yok!',
        'handover.allClear': 'Devir teslim için her şey hazır',
        'handover.cashEnd': 'Kasa Sonu (₺)',
        'handover.enterCash': 'Eldeki nakiti girin',
        'handover.countCash': 'Devir öncesi tüm nakit sayımını yapın',
        'handover.notesDesc': 'Bir sonraki vardiya için önemli notlar bırakın',
        'handover.readyToComplete': 'Devir Teslimi Tamamlamaya Hazır',
        'handover.reviewSummary': 'Devir özetinizi inceleyin',
        'handover.ticketsReviewed': 'Açık Kayıtlar İncelendi',
        'handover.notes': 'Notlar',

        // Room Management
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
        'rooms.inspect': 'Denetle',
        'rooms.dnd': 'Rahatsız Etmeyin',

        // Hotel
        'hotel.laundry': 'Çamaşırhane Hizmeti',
        'hotel.ironing': 'Ütüleme',
        'hotel.transfer': 'Havalimanı Transferi',
        'hotel.lateCheckout': 'Geç Çıkış',
        'hotel.extraBed': 'Ekstra Yatak',
        'hotel.iban': 'Banka IBAN',
        'hotel.bankName': 'Banka Adı',
        'hotel.bankNamePlaceholder': 'örn. Garanti BBVA',
        'hotel.additionalNotes': 'Ek Notlar',
        'hotel.notesPlaceholder': 'Diğer önemli bilgiler...',
        'hotel.bankAccount': 'Banka Hesabı',
        'hotel.settings.minibarPrices': 'Minibar Fiyatları',
        'hotel.settings.fixturePrices': 'Demirbaş Hasar Fiyatları',
        'hotel.noInfo': 'Otel bilgisi ayarlanmamış',
        'hotel.clickEdit': 'Eklemek için düzenleye tıklayın',
        'hotel.secure.title': 'Gizli Bilgiler (KBS / Acente)',
        'hotel.secure.encrypted': 'Şifreli Bölüm',
        'hotel.secure.safeCode': 'Kasa Şifresi',
        'hotel.secure.agency': 'Acente Girişleri (Extranet)',
        'hotel.secure.other': 'Diğer Kasa Bilgileri',
        'hotel.secure.kbs': 'KBS Giriş Bilgileri',
        'hotel.secure.safeInfo': 'Kasa ve Anahtar Bilgileri',

        // Log
        'log.new': 'Yeni Kayıt Girişi',
        'log.edit': 'Kaydı Düzenle',
        'log.typeLabel': 'Kayıt Tipi',
        'log.urgencyLabel': 'Aciliyet Seviyesi',
        'log.contentLabel': 'Açıklama',
        'log.roomNumberLabel': 'Oda Numarası (Opsiyonel)',
        'log.create': 'Kayıt Oluştur',
        'log.save': 'Değişiklikleri Kaydet',
        'log.enterContent': 'Lütfen bir açıklama girin',
        'log.mustLogin': 'Giriş yapmış olmalısınız',
        'log.aiHelp': 'AI Asistan',
        'log.roomPlaceholder': 'örn. 101',
        'log.feed.noActive': 'Aktif kayıt yok',
        'log.feed.noResolved': 'Çözülmüş kayıt yok',
        'log.feed.noArchived': 'Arşiv boş',
        'log.error.enterDescription': 'Lütfen bir açıklama girin',
        'log.error.mustBeLoggedIn': 'Giriş yapmış olmalısınız',

        // Sticky
        'sticky.pinnedCount': '{count} iğnelendi',

        // Shifts & Roster
        'shift.morning': 'Sabah',
        'shift.afternoon': 'Öğle',
        'shift.night': 'Gece',
        'shift.extra': 'Ekstra',
        'shift.off': 'İzinli',
        'shift.none': 'Yok',
        'shift.welcome': 'Hoşgeldiniz! Lütfen vardiya verilerinizi başlatın.',
        'shift.selectType': 'Vardiya Tipini Seçin',
        'shift.startingCash': 'Başlangıç Nakiti',
        'shift.proceed': 'Panele Devam Et',
        'shift.loggedAs': 'Giriş yapan',

        // App & Common
        'app.welcome': "Aetherius Relay'e Hoşgeldiniz",
        'app.description': 'Dijital devir teslim sisteminiz. Vardiyaları yönetin, kayıtları takip edin ve uyumluluğu sağlayın - hepsi tek bir yerde.',
        'app.activeShift': 'Aktif Vardiya',
        'app.openTickets': 'Açık Kayıtlar',
        'app.cashBalance': 'Kasa Bakiyesi',
        'app.systemTitle': 'Aetherius Relay Otel Operasyon Sistemi',

        'common.add': 'Ekle',
        'common.cancel': 'İptal',
        'common.edited': 'düzenlendi',
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
        'common.language': 'Dil Seçimi',
        'common.appearance': 'Görünüm Ayarları',
        'appearance.avatar_style': 'Profil Resmi Stili',
        'appearance.avatar.initials': 'Baş Harfler',
        'appearance.avatar.name': 'Tam İsim',
        'appearance.avatar.emoji': 'Emoji',
        'appearance.avatar.choose_emoji': 'Emoji Seç',
        'common.formatting.bulletList': 'Madde İşareti',
        'common.updateAvailable': 'Yeni sürüm mevcut',
        'common.updateDescription': 'En son özellikleri kullanmak için lütfen sayfayı yenileyin.',
        'common.refreshNow': 'Şimdi Yenile',
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
        'common.dismiss': 'Kapat',
        'common.backToHome': 'Anasayfaya Dön',
        'common.profile': 'Profil',
        'common.clear': 'Sohbeti Temizle',

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

        // Notes & Minibar
        'notes.activeCount': 'Aktif Kayıtlar',
        'notes.noNotes': 'Aktif kayıt bulunmuyor',
        'notes.aiHelp': 'AI Asistan',
        'notes.noFixturePrices': 'Yönetim tarafından demirbaş fiyatı ayarlanmamış.',
        'minibar.cola': 'Kola',
        'minibar.cola_zero': 'Kola Zero',
        'minibar.fanta': 'Fanta',
        'minibar.sprite': 'Sprite',
        'minibar.soda': 'Soda',
        'notes.anonymous': 'Anonim',
        'notes.edited': '(düzenlendi)',
        'notes.label': 'vardiya notları',

        // Notifications
        'notifications.title': 'Bildirimler',
        'notifications.markAsRead': 'Okundu işaretle',
        'notifications.markAllRead': 'Tümünü okundu işaretle',
        'notifications.noNotifications': 'Yeni bildirim yok',
        'notifications.viewAll': 'Tüm Aktiviteyi Gör',
        'notifications.duePayments.title': 'Bekleyen Ödemeler',
        'notifications.duePayments.content': '{count} satışta toplam {amount}€ tahsil edilmedi.',
        'notifications.compliance.pending': 'Vardiya {shift} uyum görevleri (KBS/Acente) hâlâ bekliyor. Lütfen tamamlayın.',

        // Feedback
        'feedback.placeholder': 'Şikayet veya geri bildiriminizi buraya yazın...',
        'feedback.submitSuccess': 'Başarıyla Gönderildi',
        'feedback.thankYou': 'Geri bildiriminiz için teşekkürler.',
        'feedback.submitAnonymous': 'Anonim Gönder',
        'feedback.recentTitle': 'Son Geri Bildirimler',
        'feedback.noComplaints': 'Gösterilecek şikayet yok.',
        'feedback.anonymous.title': 'Anonim Geri Bildirim',
        'feedback.anonymous.subtitle': 'Sesiniz güvenle duyulsun.',
        'feedback.privacy.title': 'Gizlilik Garantisi',
        'feedback.privacy.desc': 'Geri bildirimleri kullanıcılarla ilişkilendirmeden, otel düzeyinde topluyoruz. Veritabanı yöneticileri bile geri bildirimi hangi kullanıcının gönderdiğini göremez.',
        'feedback.submit.title': 'Anonim Şikayet Gönder',
        'feedback.submit.desc': 'Kimliğiniz tamamen gizlidir. Mesajınızla birlikte hiçbir kişisel veri saklanmaz.',
        'feedback.management.view': 'Yönetim Görünümü',

        // Messaging
        'messages.title': 'Mesajlar',
        'messages.search': 'Personel ara...',
        'messages.announcements': 'Genel Duyurular',
        'messages.broadcast': 'Tüm personele yayınla',
        'messaging.everyone': 'Herkese mesaj yaz',
        'messaging.gmOnly': 'Duyuruları sadece Genel Müdürler (GM) gönderebilir.',
        'messaging.placeholder': 'Mesaj ...',
        'messaging.noMessages': 'Henüz mesaj yok. Sohbeti başlatın!',
        'messaging.clearChatConfirm': 'Bu sohbeti temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz.',
        'messaging.deleteMessageConfirm': 'Bu mesajı silmek istediğinize emin misiniz?',
        'messaging.clearTooltip': 'Sohbeti Temizle',
        'messaging.deleteTooltip': 'Mesajı Sil',

        // Currency
        'currency.title': 'Döviz Kurları (TCMB) HER ZAMAN GÜNCEL OLMAYABİLİR!',
        'currency.buying': 'Döviz Alış (Bozma)',
        'currency.selling': 'Döviz Satış (Satış)',
        'currency.lastUpdated': 'Güncellendi',

        // Announcement
        'announcement.title': 'Önemli Duyuru',
        'announcement.deleteConfirm': 'Bu duyuruyu silmek istediğinize emin misiniz?',

        // Roster
        'roster.title': 'Haftalık Çizelge',
        'roster.currentWeek': 'Bu Hafta',
        'roster.noStaff': 'Personel bulunamadı',
        'roster.show': 'Çizelgede Göster',
        'roster.hide': 'Çizelgeden Gizle',
        'roster.unknown': 'Bilinmeyen Kullanıcı',

        // Tours
        'tours.catalogue.title': 'Tur Kataloğu',
        'tours.catalogue.desc': 'Mevcut turlara göz atın ve yerel satışları takip edin.',
        'tours.add': 'Yeni Tur Ekle',
        'tours.edit': 'Turu Düzenle',
        'tours.create': 'Yeni Tur Girişi Oluştur',
        'tours.form.name': 'Tur Adı',
        'tours.form.desc': 'Kısa Açıklama',
        'tours.form.basePrice': 'Baz Fiyat (EUR)',
        'tours.form.adultPrice': 'Yetişkin Fiyatı',
        'tours.form.child37Price': 'Çocuk (3-7y)',
        'tours.form.child03Price': 'Çocuk (0-3y)',
        'tours.form.operatingDays': 'Operasyon Günleri',
        'tours.noTours': 'Henüz katalogda tur bulunmuyor.',
        'tours.createFirst': 'İlkini oluştur',
        'tours.local': 'Yerel Tur',
        'tours.clickToLog': 'Satış kaydetmek için bir kategoriye tıklayın.',
        'tours.book.title': 'Yeni Rezervasyon: {name}',
        'tours.book.desc': 'Bu tur için rezervasyon detaylarını girin.',
        'tours.book.guestName': 'Misafir Adı',
        'tours.book.room': 'Oda #',
        'tours.book.pax': 'Kişi Sayısı',
        'tours.book.date': 'Tarih',
        'tours.book.totalPrice': 'Toplam Tutar',
        'tours.book.confirm': 'Rezervasyonu Onayla',

        // Sales
        'sales.tracker': 'Satış Takibi',
        'sales.new': 'Yeni Satış',
        'sales.newType': 'Yeni {label}',
        'sales.service': 'Servis',
        'sales.other': 'Diğer / Özel',
        'sales.customName': 'Özel tur adı girin...',
        'sales.pickupTime': 'Alış Saati',
        'sales.price': 'Fiyat',
        'sales.notes': 'Notlar',
        'sales.optionalNotes': 'Opsiyonel notlar...',
        'sales.create': 'Satış Oluştur',
        'sales.noSales': 'Henüz {label} satışı yok.',
        'sales.soldBy': 'Satan: {name}',
        'sales.selectTour': 'Tur Seçin',
        'sales.destinationPlaceholder': 'Varış Noktası (örn. Havalimanı)',
        'sales.details.service': 'Servis Detayları',
        'sales.details.financials': 'Finansal Veriler',
        'sales.details.pickup': 'Alış Saati',
        'sales.details.ticket': 'Bilet #',
        'sales.details.pax': 'Kişi Sayısı',
        'sales.details.total': 'Toplam Tutar',
        'sales.details.paid': 'Ödenen Tutar',
        'sales.details.collect': 'Ödeme Tahsil Et',
        'sales.details.remaining': 'Kalan',
        'sales.details.notes': 'Notlar',
        'sales.details.history': 'Ödeme Geçmişi',
        'sales.details.exchange': 'Kur Değeri',
        'sales.details.created': '{name} tarafından {date} tarihinde oluşturuldu',
        'sales.details.noNotes': 'Not eklenmemiş.',
        'sales.details.amountPlaceholder': 'Tutar...',
        'sales.details.valuePlaceholder': '{currency} karşılığı...',
        'sales.details.ticketPlaceholder': 'örn. T-12345',
        'sales.details.notesPlaceholder': 'Alış yeri, tercihler vb. hakkında notlar ekleyin.',
        'sales.details.deleteConfirm': 'Bu satış kaydını tamamen silmek istediğinizden emin misiniz?',
        'sales.details.save': 'Değişiklikleri Kaydet',
        'sales.details.cancel': 'İptal',
        'sales.details.person': 'Kişi',
        'sales.details.persons': 'Kişi',
        'sales.details.notSet': 'Ayarlanmadı',
        'sales.details.none': 'Yok',
        'sales.status.waiting': 'Bekliyor',
        'sales.status.confirmed': 'Onaylandı',
        'sales.status.pickup_pending': 'Alım Bekliyor',
        'sales.status.realized': 'Gerçekleşti',
        'sales.status.delivered': 'Teslim Edildi',
        'sales.status.cancelled': 'İptal Edildi',
        'sales.payment.pending': 'Bekliyor',
        'sales.payment.partial': 'Kısmi Ödeme',
        'sales.payment.paid': 'Ödendi',
        'sales.type.tour': 'Tur',
        'sales.type.transfer': 'Transfer',
        'sales.type.laundry': 'Çamaşırhane',
        'sales.type.other': 'Diğer',
        'sales.laundry.whites': 'Beyazlar (Adet)',
        'sales.laundry.colors': 'Renkliler (Adet)',
        'sales.laundry.ironing': 'Sadece Ütü',
        'sales.laundry.washing': 'Yıkama & Kurutma',
        'sales.laundry.washingAndIroning': 'Yıkama + Ütü',
        'sales.laundry.totalMachines': 'Toplam Makine',
        'sales.laundry.itemsCount': '{count} parça ({type})',
        'sales.laundry.ironingPieces': 'Ütüleme (Adet)',
        'sales.laundry.machine': 'makine',
        'sales.laundry.machines': 'makine',
        'sales.transfer.destination': 'Varış Noktası',
        'sales.transfer.pickup': 'Alış Yeri',
        'sales.transfer.flight': 'Uçuş Numarası',
        'sales.transfer.rest': 'Rest (Araçta)',
        'sales.addToNotes': 'Nöbet Notlarına Ekle',

        // Compliance
        'compliance.kbs.required': 'KBS Kontrolü Gerekli!',
        'compliance.kbs.pastTime': "Saat 23:00'ü geçti",
        'compliance.kbs.desc': 'KBS sistem kontrolü vardiyanız bitmeden tamamlanmalıdır. Bu zorunlu bir uyumluluk gerekliliğidir.',
        'compliance.kbs.remindLater': 'Sonra Hatırlat',
        'compliance.kbs.checkNow': "KBS'yi Şimdi Kontrol Et",
        'compliance.agency.label': 'Acente Mesajları Kontrol Edildi',
        'compliance.agency.desc': 'Tüm OTA mesajlarını (Booking, Expedia, vb.) kontrol edin',
        'compliance.kbs.label': 'KBS Sistemi Doğrulandı',
        'compliance.kbs.checklistDesc': "23:00'den önce günlük uyumluluk kontrolü",

        // Onboarding
        'onboarding.welcome.title': "Aetherius Relay'e Hoşgeldiniz",
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

        // Interactive Tour
        'tour.intro.title': "Aetherius Relay'e Hoşgeldiniz",
        'tour.intro.desc': 'Bu sizin dijital devir teslim platformunuz. Hadi hızlı bir tura çıkalım.',
        'tour.compliance.title': 'Vardiya Uyumluluğu',
        'tour.compliance.desc': 'Zorunlu KBS ve Acente kontrollerinizi buradan takip edin. Nabız atışı aciliyeti belirtir.',
        'tour.feed.title': 'Aktivite Akışı',
        'tour.feed.desc': 'Tüm misafir talepleri ve bakım kayıtları burada gerçek zamanlı görünür.',
        'tour.sales.title': 'Satış ve Turlar',
        'tour.sales.desc': 'Tur Satışlarını, İzin Günlerini ve misafir Geri Bildirimlerini yönetmek için sekmeler arası geçiş yapın.',
        'tour.notifications.title': 'Bildirimler',
        'tour.notifications.desc': 'İzin istekleri ve önemli mesajlardan haberdar olun.',
        'tour.profile.title': 'Profiliniz',
        'tour.profile.desc': 'Ayarlara, öğreticilere ve çıkış yapma ekranına buradan erişin.',

        // Daily Menu
        'menu.title': 'Personel Günlük Menüsü',
        'menu.content': 'Günün Menüsü',
        'menu.edit': 'Menüyü Düzenle',
        'menu.updateSuccess': 'Menü başarıyla güncellendi',
        'menu.noMenuToday': 'Bugün için henüz menü paylaşılmadı.',
        'menu.hours': 'Servis Saatleri',
        'menu.breakfastTime': 'Kahvaltı: 07:00 - 09:00',
        'menu.lunchTime': 'Öğle Yemeği: 12:00 - 13:30',
        'menu.dinnerTime': 'Akşam Yemeği: 17:00 - 18:30',

        // Fixtures
        'fixture.hand_towel': 'El Havlusu',
        'fixture.bath_towel': 'Banyo Havlusu',
        'fixture.bed_sheet': 'Çarşaf',
        'fixture.pillow_case': 'Yastık Kılıfı',
        'fixture.duvet_cover': 'Nevresim',
        'fixture.bathrobe': 'Bornoz',
        'fixture.mattress_protector': 'Alez',

        // Off Day
        'offday.management.title': 'İzin ve Vardiya Yönetimi',
        'offday.management.desc': 'Personel izin ve vardiya taleplerini yönetin.',
        'offday.pending': 'Bekleyen Talepler',
        'offday.history': 'Talep Geçmişi',
        'offday.petitions': 'Şikayet ve Dilekçeler',

        // AI Modal
        'ai.title': 'Aetherius Relay AI Asistanı',
        'ai.poweredBy': 'Gemini & Gemma tarafından desteklenmektedir',
        'ai.model': 'AI Modeli',
        'ai.mode.assistant': 'Asistan Modu',
        'ai.mode.quota': 'Kota Dengeli Mod',
        'ai.task.general': 'Genel Asistan İsteği',
        'ai.task.generalDesc': 'Bugün size nasıl yardımcı olabilirim?',
        'ai.task.incident': 'Olay Raporu',
        'ai.task.incidentDesc': 'Olayı açıklayın (Kim, Ne zaman, Nerede, Nasıl)...',
        'ai.task.email': 'Profesyonel E-posta İsteği',
        'ai.task.emailDesc': 'Alıcı kim ve ana mesajınız nedir?',
        'ai.task.review': 'Yorum Yanıtlama İsteği',
        'ai.task.reviewDesc': 'Misafir yorumunu buraya yapıştırın...',
        'ai.context.title': 'Otel Bilgi Bankası',
        'ai.context.desc': 'Oteliniz hakkındaki gerçekleri girin (kahvaltı saatleri, wifi şifresi, politikalar). AI bu bilgileri doğru yanıtlar üretmek için kullanacaktır.',
        'ai.context.save': 'Bağlamı Kaydet',
        'ai.generate': 'Oluştur',
        'ai.cancel': 'İptal',

        // Landing Page Navbar & Footer
        'landing.nav.features': 'Özellikler',
        'landing.nav.pricing': 'Fiyatlandırma',
        'landing.nav.status': 'Durum',
        'landing.nav.login': 'Giriş',
        'landing.nav.howItWorks': 'Nasıl Çalışır?',
        'landing.nav.blog': 'Blog',
        'landing.nav.updates': 'Güncellemeler',
        'landing.nav.getStarted': 'Hemen Başla',
        'landing.footer.privacy': 'Gizlilik Politikası',
        'landing.footer.terms': 'Hizmet Şartları',
        'landing.footer.status': 'Sistem Durumu',

        // Expansion Pages
        'features.title': 'Teknik Derinlemesine Bakış',
        'features.subtitle': 'Aetherius Relay, bir otelin günlük operasyonel ihtiyacı olan her şeyi tek bir platformda toplar.',
        'features.handovers.title': 'Dijital Vardiya Devir Teslimi',
        'features.handovers.desc': 'Kağıt kayıtların yerini alan, otomatik özetlenen ve güvenli vardiya transferleri.',
        'features.roster.title': 'Matrix Roster Sistemi',
        'features.roster.desc': 'GM için personeli sürükle-bırak ile planlayabildiği gelişmiş haftalık çizelge.',
        'features.ai.title': 'Gelişmiş AI Asistan',
        'features.ai.desc': 'Otel verilerine hakim, rapor hazırlayan ve operasyonel kararları destekleyen yapay zeka.',
        'features.analytics.title': 'Finansal Analiz & Satış',
        'features.analytics.desc': 'Günlük gelirleri, tur satışlarını ve ekstraları anlık takip edebileceğiniz finans modülü.',
        'features.messaging.title': 'İç Yazışma & Mesajlaşma',
        'features.messaging.desc': 'Ekip içi kopukluğu önleyen, görev odaklı dahili mesajlaşma altyapısı.',
        'features.cloud.title': 'Bulut Senkronizasyonu',
        'features.cloud.desc': 'Tüm veriler Cloudflare altyapısında, her cihazdan anlık olarak erişilebilir.',

        'howItWorks.title': 'Operasyonel Simya',
        'howItWorks.subtitle': 'Aetherius Relay, otel operasyonlarınızı dijitalleştirirken karmaşıklığı ortadan kaldırır.',
        'howItWorks.step1.title': 'Hızlı Kurulum',
        'howItWorks.step1.desc': 'Otelinizin verilerini 5 dakikada platforma aktarın ve ekibinizi davet edin.',
        'howItWorks.step2.title': 'Gerçek Zamanlı Takip',
        'howItWorks.step2.desc': 'Tüm operasyonel akışı, satışları ve notları canlı panelden izleyin.',
        'howItWorks.step3.title': 'Kusursuz Devir',
        'howItWorks.step3.desc': 'Vardiya değişimlerinde kritik bilgiler otomatik özetlenir ve yeni ekibe aktarılır.',
        'howItWorks.step4.title': 'Mobil Erişim',
        'howItWorks.step4.desc': 'Saha personeli mobil uygulama üzerinden her yerden veri girişi yapabilir.',
        'updates.title': 'Ürün Güncellemeleri',
        'updates.subtitle': 'Aetherius Relay sürekli gelişiyor. İşte platforma eklediğimiz en yeni özellikler.',
        'updates.v1.version': 'v1.2.0',
        'updates.v1.date': 'Şub 2026',
        'updates.v1.title': 'Yapay Zeka Devrimi',
        'updates.v1.desc': 'Google Gemini entegrasyonu ile otomatik vardiya özetleri ve önceliklendirme.',
        'updates.changelog': 'Tüm Değişiklikler',
        'blog.title': 'Aetherius Relay Blog',
        'blog.subtitle': 'Modern otel yönetimi için stratejiler ve içgörüler.',
        'blog.post1.title': 'Kağıt Log Defterlerinin Sonu',
        'blog.post1.excerpt': 'Modern otellerin neden fiziksel defterleri bırakıp dijital devir sistemlerine geçtiğini keşfedin.',
        'blog.post1.date': '12 Şub 2026',
        'blog.post1.content': 'Geleneksel kağıt log defterleri artık günümüzün hızlı tempolu otel operasyonları için yeterli değil. Bilginin kaybolması, okunaksız el yazıları ve geçmişe dönük arama yapmanın zorluğu operasyonel verimliliği düşürüyor. Aetherius Relay ile dijitalleşen log tutma süreci, anlık erişim, aranabilirlik ve veriye dayalı kararlar almanızı sağlar.',
        'blog.post2.title': 'AI ile ADR Maksimizasyonu',
        'blog.post2.excerpt': 'Yapay zekanın ön büro ekiplerine oda fiyatlarını gerçek zamanlı optimize etmede nasıl yardımcı olduğunu görün.',
        'blog.post2.date': '10 Şub 2026',
        'blog.post2.content': 'Oda fiyatlarını manuel olarak yönetmek artık geçmişte kaldı. Aetherius Relay AI, otelinizin doluluk oranlarını, rakip fiyatlarını ve yerel etkinlikleri analiz ederek en optimum ADR (Average Daily Rate) için fiyat önerileri sunar. Bu makalede, yapay zekanın gelir yönetiminde nasıl devrim yarattığını ve ön büro ekiplerinin bu araçları kullanarak nasıl daha karlı olabileceğini inceliyoruz.',
        'blog.readMore': 'Tamamını Oku',
        'blog.author.team': 'Aetherius Relay Ekibi',
        'blog.author.strategy': 'Ürün Stratejisi',
        'blog.category.hospitality': 'Konaklama',
        'blog.category.ai': 'AI & Veri',

        // Mobile Overview Grid
        'overview.menu.desc': 'Personel Yemeği',
        'overview.notes.desc': 'Kayıt & Devir',
        'overview.compliance.desc': 'KBS & Acente',
        'overview.hotel.desc': 'Kodlar & Wifi',
        'overview.calendar.desc': 'Olaylar & Vardiya',
        'overview.currency.desc': 'Döviz Kurları',
        'overview.roster.desc': 'Haftalık Program',

        // Mobile Operations Grid
        'operations.messaging.desc': 'Sohbet & Güncellemeler',
        'operations.feedback.desc': 'Misafir Sorunları',
        'operations.offdays.desc': 'Personel Programı',
        'operations.tours.desc': 'Aktivite Rezervasyonu',
        'operations.rooms.desc': 'Yönetim',
        'operations.sales.desc': 'İşlemler',
        'operations.pricing.desc': 'Fiyat Kartları',
        'operations.team.desc': 'Liderlik Tablosu',
        'operations.activity.desc': 'Sistem Kayıtları',
        'landing.hero.trusted': "500'den Fazla Otel Tarafından Kullanılıyor",
        'landing.hero.title.prefix': 'Yeni Nesil',
        'landing.hero.title.suffix': 'Konaklama',
        'landing.hero.subtitle': 'Modern oteller için akıllı işletim sistemi. Sorunsuz devir teslimler, gerçek zamanlı senkronizasyon ve operasyon otomasyonu.',
        'landing.hero.cta.primary': 'Ücretsiz Deneyin',
        'landing.hero.cta.secondary': 'Canlı Demo',
        'landing.features.title': 'Tam Kapsamlı Otel Operasyonları',
        'landing.features.subtitle': 'Modern bir oteli verimli bir şekilde yönetmek için ihtiyacınız olan her şey.',
        'landing.getApp.title': "Aetherius Relay'i İndirin",
        'landing.pricing.title': 'Otelini yükseltmeye hazır mısın?',
        'landing.pricing.subtitle': 'Operasyonlarını kolaylaştırmak için Aetherius Relay kullanan 500+ otele katılın.',
        'landing.pricing.cta': 'Planları İncele',
        'landing.getApp.appStore': 'App Store',
        'landing.getApp.appStoreSub': 'iOS için İndir',
        'landing.getApp.googlePlay': 'Google Play',
        'landing.getApp.googlePlaySub': 'Android için Edin',
        'landing.getApp.directApk': 'Doğrudan APK',
        'landing.getApp.directApkSub': 'Android Paketi',
        'landing.getApp.webApp': 'Web Uygulaması',
        'landing.getApp.webAppSub': 'Tarayıcıda Aç',
        'landing.footer.contact': 'Yönetici ile İletişim',
        'landing.footer.product': 'Ürün',
        'landing.footer.info': 'Bilgi',
        'landing.footer.support': 'Destek',
        'landing.footer.features': 'Özellikler',
        'landing.footer.pricing': 'Fiyatlandırma',
        'landing.footer.howItWorks': 'Nasıl Çalışır?',
        'landing.footer.demo': 'Canlı Demo',
        'landing.footer.blog': 'Blog',
        'landing.footer.updates': 'Güncellemeler',
        'landing.footer.rights': 'Tüm hakları saklıdır.',
        'landing.feature.mobile.title': 'Mobil Öncelikli',
        'landing.feature.mobile.desc': 'Hareket halindeki personel için tasarlandı. Her cihazda mükemmel çalışır.',
        'landing.feature.security.title': 'Askeri Düzeyde Güvenlik',
        'landing.feature.security.desc': 'En hassas verileriniz ve şifreleriniz için şifreli kasalar.',
        'landing.feature.sync.title': 'Gerçek Zamanlı Senkronizasyon',
        'landing.feature.sync.desc': 'Değişiklikler tüm cihazlarda anında güncellenir.',
        'landing.feature.messaging.title': 'Anlık Mesajlaşma',
        'landing.feature.messaging.desc': 'WhatsApp gruplarının yerini alan güvenli iç iletişim.',
        'landing.feature.handovers.title': 'Akıllı Devir Teslim',
        'landing.feature.handovers.desc': 'Vardiyalar arasında hiçbir şeyin kaybolmamasını sağlayan dijital kayıt defterleri.',
        'landing.feature.roster.title': 'Personel Vardiyası',
        'landing.feature.roster.desc': 'Otomatik bildirimli sürükle-bırak çizelgeleme.',
        'landing.feature.analytics.title': 'Analiz Paneli',
        'landing.feature.analytics.desc': 'Otel performansı ve verimliliğine dair görsel içgörüler.',
        'landing.feature.vault.title': 'Gizli Kasa',
        'landing.feature.vault.desc': 'Acente girişleri ve KBS için şifre korumalı depolama.',
        'landing.feature.tasks.title': 'Otomatik Görevler',
        'landing.feature.tasks.desc': 'Tekrarlayan kontrol listeleri her gün uyumluluğu sağlar.',

        'landing.footer.community': 'Topluluk',
        'landing.footer.download': 'Uygulamayı İndir',

        'download.title': "Aetherius Relay'i İndirin",
        'download.subtitle': 'Relay gücünü tüm cihazlarınıza taşıyın.',
        'community.title': 'Relay Topluluğu',
        'community.subtitle': 'Diğer konaklama profesyonelleriyle bağlantı kurun.',

        // Pricing Page
        'pricing.title': 'Planlar ve Fiyatlandırma',
        'pricing.subtitle': 'İşletmenizle büyüyen basit, şeffaf fiyatlandırma. Gizli ücret yok.',
        'pricing.popular': 'EN POPÜLER',
        'common.month': 'ay',
        'pricing.monthly': 'Aylık',
        'pricing.annual': 'Yıllık',
        'pricing.saveBadge': '%20 Tasarruf',
        'pricing.plan.lite': 'Lite',
        'pricing.plan.lite.desc': 'Dijital yolculuğuna başlayan küçük oteller için.',
        'pricing.plan.pro': 'Pro',
        'pricing.plan.pro.desc': 'Profesyonel operasyonlar için gelişmiş özellikler.',
        'pricing.plan.enterprise': 'Enterprise',
        'pricing.plan.enterprise.desc': 'Çoklu otel yönetimi ve API erişimi ile ölçeklenin.',
        'pricing.button.getStarted': 'Hemen Başla',
        'pricing.button.contact': 'Satışla Görüşün',
        'pricing.feature.shiftLogs': 'Dijital Vardiya Kayıtları',
        'pricing.feature.basicLogs': 'Temel Log Sistemi',
        'pricing.feature.support': 'Standart Destek',
        'pricing.feature.matrixRoster': 'Matrix Roster Sistemi',
        'pricing.feature.aiAssistant': 'AI Asistan Entegrasyonu',
        'pricing.feature.unlimitedLogs': 'Sınırsız Bulut Depolama',
        'pricing.feature.prioritySupport': 'Öncelikli Teknik Destek',
        'pricing.feature.multiHotel': 'Çoklu Otel Yönetimi',
        'pricing.feature.apiAccess': 'Harici API Erişimi',
        'pricing.feature.whiteLabel': 'White-label Seçenekleri',
        'pricing.feature.customSupport': '7/24 Özel Temsilci',
        'pricing.faq.title': 'Sıkça Sorulan Sorular',
        'pricing.faq.q1': 'Planımı daha sonra yükseltebilir miyim?',
        'pricing.faq.a1': 'Evet, dilediğiniz zaman ayarlar kısmından planınızı yükseltebilir veya düşürebilirsiniz.',
        'pricing.faq.q2': 'Ücretsiz deneme var mı?',
        'pricing.faq.a2': 'Lite planı küçük ekipler için sonsuza kadar ücretsizdir. Pro için 14 günlük deneme sunuyoruz.',
        'pricing.contactSales': 'Satış Ekibi',
        'pricing.price.custom': 'Özel',
        'pricing.needHelp': 'Seçim yapmakta zorlanıyor musunuz?',
        'pricing.back': 'Geri',

        // Demo Page
        'demo.title': 'İnteraktif Canlı Demo',
        'demo.subtitle': "Relay'in gücünü ilk elden deneyimleyin. Paneli keşfetmek için bir persona seçin.",
        'demo.gm': 'Genel Müdür',
        'demo.gm.desc': 'Tüm ayarlara, analizlere, personel yönetimine ve otel yapılandırmasına tam erişim.',
        'demo.staff': 'Personel',
        'demo.staff.desc': 'Günlük operasyonlar, vardiya kayıtları, mesajlaşma ve görev tamamlama için odaklanmış görünüm.',
        'demo.enter.gm': 'Yönetici Olarak Gir',
        'demo.enter.staff': 'Resepsiyonist Olarak Gir',
        'demo.back': 'Ana Sayfaya Dön',

        // Blacklist
        'blacklist.title': 'Yasaklı Misafirler (Kara Liste)',
        'blacklist.addGuest': 'Misafir Ekle',
        'blacklist.addTitle': 'Kara Listeye Ekle',
        'blacklist.firstName': 'Ad *',
        'blacklist.firstNamePlaceholder': 'Ahmet',
        'blacklist.lastName': 'Soyad',
        'blacklist.lastNamePlaceholder': 'Yılmaz',
        'blacklist.reason': 'Sebep *',
        'blacklist.reasonPlaceholder': 'Kara listeye alınma sebebi...',
        'blacklist.phone': 'Telefon Numarası/Numaraları',
        'blacklist.phonePlaceholder': '+90 532...',
        'blacklist.room': 'Oda Numarası/Numaraları',
        'blacklist.roomPlaceholder': '101, 102...',
        'blacklist.relatedPersons': 'İlgili Kişiler',
        'blacklist.relatedPlaceholder': 'Aile üyeleri veya arkadaşları...',
        'blacklist.submit': 'Kara Listeye Ekle',
        'blacklist.deleteConfirm': 'Bu misafiri kara listeden çıkarmak istediğinize emin misiniz?',
        'blacklist.empty': 'Kara listede misafir bulunmuyor.',
        'blacklist.addedBy': 'Ekleyen: {name} • {date}',
        'blacklist.reasonLabel': 'Sebep:',
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
