import { useState } from 'react'
import { Wrench, Package, KeyRound } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { MaintenanceQueue } from '@/components/maintenance/MaintenanceQueue'
import { LostAndFoundModule } from '@/components/lostfound/LostAndFoundModule'
import { CardsAndLoansPanel } from '@/components/loans/CardsAndLoansPanel'
import { cn } from '@/lib/utils'

export type AssetTab = 'maintenance' | 'lostfound' | 'cards-loans'

interface AssetManagementModuleProps {
    initialTab?: AssetTab
}

export function AssetManagementModule({ initialTab = 'maintenance' }: AssetManagementModuleProps) {
    const { language } = useLanguageStore()
    const [activeTab, setActiveTab] = useState<AssetTab>(initialTab)

    const tabs: { id: AssetTab; label: { tr: string; en: string; ru: string }; icon: typeof Wrench }[] = [
        {
            id: 'maintenance',
            label: { tr: 'Bakım ve Arıza', en: 'Maintenance', ru: 'Обслуживание' },
            icon: Wrench
        },
        {
            id: 'lostfound',
            label: { tr: 'Kayıp Eşya', en: 'Lost & Found', ru: 'Забытые вещи' },
            icon: Package
        },
        {
            id: 'cards-loans',
            label: { tr: 'Kart ve Ödünç', en: 'Cards & Loans', ru: 'Карты и займы' },
            icon: KeyRound
        }
    ]

    return (
        <div className="space-y-4">
            {/* Sub-navigation Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-muted/40 rounded-2xl border border-border/50 backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none',
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
                {activeTab === 'maintenance' && <MaintenanceQueue />}
                {activeTab === 'lostfound' && <LostAndFoundModule />}
                {activeTab === 'cards-loans' && <CardsAndLoansPanel />}
            </div>
        </div>
    )
}
