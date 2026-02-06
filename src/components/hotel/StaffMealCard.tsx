import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Utensils,
    Coffee,
    Moon,
    Edit2,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardTitle } from '@/components/ui/card'
import { useLanguageStore } from '@/stores/languageStore'
import { StaffMealEditor } from './StaffMealEditor'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'
import { formatDisplayDateTime } from '@/lib/utils'
import { useStaffMealStore } from '@/stores/staffMealStore'
import { useAuthStore } from '@/stores/authStore'

interface StaffMealCardProps {
    hotelId: string
    canEdit: boolean
}

export function StaffMealCard({ hotelId, canEdit }: StaffMealCardProps) {
    const { t, language } = useLanguageStore()
    const { user } = useAuthStore()
    const { todayMenu, updateMenu, loading } = useStaffMealStore()

    const [isEditing, setIsEditing] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false) // Renamed 'saving' to 'isUpdating'
    // const [editMenu, setEditMenu] = useState('') // No longer needed, StaffMealEditor manages its own state

    const handleEdit = () => {
        // setEditMenu(todayMenu?.menu || '') // No longer needed
        setIsEditing(true)
    }

    const handleSave = async (editedMenu: string) => { // Modified to accept editedMenu
        if (!hotelId || !user) return
        setIsUpdating(true)
        try {
            await updateMenu(hotelId, editedMenu, user.uid, user.name)
            setIsEditing(false)
        } catch (error) {
            console.error('Error saving menu:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
    }

    if (loading && !todayMenu) {
        return (
            <div className="glass glass-hover rounded-2xl border border-zinc-800/50 flex flex-col">
                <div className="p-6 pb-3">
                    <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-indigo-400" />
                        {t('menu.title')}
                    </CardTitle>
                </div>
                <div className="p-6 pt-0 flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500/50" />
                </div>
            </div>
        )
    }

    return (
        <CollapsibleCard
            id="staff-meal"
            title={
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-indigo-400" />
                    {t('menu.title')}
                </CardTitle>
            }
            headerActions={
                canEdit && !isEditing && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleEdit()
                        }}
                        className="hover:bg-indigo-500/10 hover:text-indigo-400 h-8 w-8 p-0"
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                )
            }
            className="bg-zinc-900 border-zinc-800"
        >
            <div className="pt-2">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <StaffMealEditor
                                defaultValue={todayMenu?.menu || ''}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                loading={isUpdating}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-5"
                        >
                            {todayMenu && todayMenu.menu.trim() !== '' ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-zinc-800/30 rounded-xl border border-zinc-800/50 group">
                                        <div className="flex items-center gap-2 mb-3 px-1">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                                                {t('menu.content')}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-zinc-800/50" />
                                        </div>
                                        <ul className="space-y-1.5 list-none">
                                            {todayMenu.menu.split('\n').filter(line => line.trim() !== '').map((item, index) => (
                                                <li key={index} className="text-sm text-zinc-200 leading-relaxed flex items-start gap-2 group/item">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500/40 group-hover/item:bg-indigo-400 transition-colors shrink-0" />
                                                    {item.trim()}
                                                </li>
                                            ))}
                                            {(!todayMenu.menu || todayMenu.menu.trim() === '') && (
                                                <li className="text-sm text-zinc-500 italic">{t('common.none')}</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 px-1">
                                        <span className="text-[9px] text-zinc-600 uppercase tracking-tighter">
                                            {language === 'tr'
                                                ? `${todayMenu.updated_by_name || t('common.staff')} ${t('common.by')}`
                                                : `${t('common.by')} ${todayMenu.updated_by_name || t('common.staff')}`}
                                        </span>
                                        <span className="text-[9px] text-zinc-600 uppercase tracking-tighter">
                                            {formatDisplayDateTime(todayMenu.updated_at)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-3 opacity-60">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <Utensils className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium max-w-[180px]">
                                        {t('menu.noMenuToday')}
                                    </p>
                                    {canEdit && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit()
                                            }}
                                            className="border-zinc-800 text-zinc-400 hover:text-white h-7"
                                        >
                                            {t('menu.edit')}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Fixed Service Hours Section */}
                <div className="pt-2 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                            {t('menu.hours')}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-800/20 py-1.5 px-2 rounded-lg border border-zinc-800/30">
                            <Coffee className="w-3 h-3 text-amber-500/70" />
                            {t('menu.breakfastTime')}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-800/20 py-1.5 px-2 rounded-lg border border-zinc-800/30">
                            <Utensils className="w-3 h-3 text-emerald-500/70" />
                            {t('menu.lunchTime')}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-800/20 py-1.5 px-2 rounded-lg border border-zinc-800/30">
                            <Moon className="w-3 h-3 text-indigo-500/70" />
                            {t('menu.dinnerTime')}
                        </div>
                    </div>
                </div>
            </div>
        </CollapsibleCard>
    )
}
