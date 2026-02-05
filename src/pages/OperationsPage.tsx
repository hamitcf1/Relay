import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    MessageCircle,
    ShieldAlert,
    CalendarDays,
    Map,
    CreditCard,
    ChevronLeft
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessagingPanel } from '@/components/messaging/MessagingPanel'
import { FeedbackSection } from '@/components/feedback/FeedbackSection'
import { OffDayScheduler } from '@/components/staff/OffDayScheduler'
import { TourCatalogue } from '@/components/tours/TourCatalogue'
import { SalesPanel } from '@/components/sales/SalesPanel'

export function OperationsPage() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('messaging')

    return (
        <AppShell>
            <div className="space-y-8 pb-12">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-zinc-500 hover:text-white -ml-2"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Dashboard
                    </Button>
                </motion.div>

                {/* Main Content */}
                <Tabs defaultValue="messaging" className="space-y-8" onValueChange={setActiveTab}>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold text-white tracking-tight">Operations Hub</h1>
                            <p className="text-zinc-500 text-lg font-sans">Manage hotel communication, feedback, and services in one place.</p>
                        </div>
                        <TabsList className="bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 h-12">
                            <TabsTrigger value="messaging" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4">
                                <MessageCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">Messaging</span>
                            </TabsTrigger>
                            <TabsTrigger value="feedback" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="hidden sm:inline">Complaints</span>
                            </TabsTrigger>
                            <TabsTrigger value="off-days" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4">
                                <CalendarDays className="w-4 h-4" />
                                <span className="hidden sm:inline">Off-Days</span>
                            </TabsTrigger>
                            <TabsTrigger value="tours" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4">
                                <Map className="w-4 h-4" />
                                <span className="hidden sm:inline">Tours</span>
                            </TabsTrigger>
                            <TabsTrigger value="sales" className="rounded-lg gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4">
                                <CreditCard className="w-4 h-4" />
                                <span className="hidden sm:inline">Satışlar</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <TabsContent value="messaging" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                            <MessagingPanel />
                        </TabsContent>
                        <TabsContent value="feedback" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                            <FeedbackSection />
                        </TabsContent>
                        <TabsContent value="off-days" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                            <OffDayScheduler />
                        </TabsContent>
                        <TabsContent value="tours" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                            <TourCatalogue />
                        </TabsContent>
                        <TabsContent value="sales" className="mt-0 ring-0 focus-visible:ring-0 outline-none">
                            <SalesPanel />
                        </TabsContent>
                    </motion.div>
                </Tabs>
            </div>
        </AppShell>
    )
}
