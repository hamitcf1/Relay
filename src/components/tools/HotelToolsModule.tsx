import { useState } from 'react'
import { Info, CalendarDays, Utensils, CircleDollarSign, UserX } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { HotelInfoPanel } from '@/components/hotel/HotelInfoPanel'
import { CalendarWidget } from '@/components/calendar/CalendarWidget'
import { StaffMealCard } from '@/components/hotel/StaffMealCard'
import { CurrencyWidget } from '@/components/dashboard/CurrencyWidget'
import { BlacklistModule } from '@/components/dashboard/BlacklistModule'
import { cn } from '@/lib/utils'

export type HotelToolTab = 'hotel-info' | 'calendar' | 'menu' | 'currency' | 'blacklist'

interface HotelToolsModuleProps {
    hotelId: string
    canEdit?: boolean
    initialTab?: HotelToolTab
}

export function HotelToolsModule({ hotelId, canEdit, initialTab = 'hotel-info' }: HotelToolsModuleProps) {
    const { language } = useLanguageStore()
    const [activeTab, setActiveTab] = useState<HotelToolTab>(initialTab)

    const tabs: { id: HotelToolTab; label: { tr: string; en: string; ru: string }; icon: typeof Info }[] = [
        {
            id: 'hotel-info',
            label: { tr: 'Otel Bilgileri', en: 'Hotel Info', ru: 'Информация' },
            icon: Info
        },
        {
            id: 'calendar',
            label: { tr: 'Takvim', en: 'Calendar', ru: 'Календарь' },
            icon: CalendarDays
        },
        {
            id: 'menu',
            label: { tr: 'Personel Menüsü', en: 'Staff Menu', ru: 'Меню' },
            icon: Utensils
        },
        {
            id: 'currency',
            label: { tr: 'Kur Çevirici', en: 'Currency', ru: 'Валюты' },
            icon: CircleDollarSign
        },
        {
            id: 'blacklist',
            label: { tr: 'Kara Liste', en: 'Blacklist', ru: 'Чёрный список' },
            icon: UserX
        }
    ]

    return (
        <div className="space-y-4">
            {/* Sub-navigation Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-muted/40 rounded-2xl border border-border/50 backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-1.5 w-full">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex flex-1 sm:flex-initial items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none',
                                    isActive
                                        ? 'bg-background text-primary shadow-sm border border-primary/25'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                                <span>{tab.label[language as 'tr' | 'en' | 'ru'] || tab.label.en}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Contents */}
            <div>
                {activeTab === 'hotel-info' && <HotelInfoPanel hotelId={hotelId} canEdit={Boolean(canEdit)} />}
                {activeTab === 'calendar' && <CalendarWidget hotelId={hotelId} />}
                {activeTab === 'menu' && <StaffMealCard hotelId={hotelId} canEdit={Boolean(canEdit)} />}
                {activeTab === 'currency' && <CurrencyWidget />}
                {activeTab === 'blacklist' && <BlacklistModule hotelId={hotelId} />}
            </div>
        </div>
    )
}
