import { useMemo, useState } from 'react'
import { Megaphone, Search, Users } from 'lucide-react'
import type { StaffMember } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useLanguageStore } from '@/stores/languageStore'
import { useWorkspaceDirty } from '@/hooks/useWorkspaceDirty'
import { cn } from '@/lib/utils'

type Audience = 'all' | 'selected'

interface AnnouncementComposerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staff: StaffMember[]
    onSend: (announcement: { title: string; content: string; recipientIds: string[]; recipientNames: string[]; audience: Audience }) => Promise<void>
}

export function AnnouncementComposer({ open, onOpenChange, staff, onSend }: AnnouncementComposerProps) {
    const { language } = useLanguageStore()
    const [audience, setAudience] = useState<Audience>('all')
    const [selected, setSelected] = useState<string[]>([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [search, setSearch] = useState('')
    const [sending, setSending] = useState(false)
    useWorkspaceDirty('announcement-compose', open && Boolean(title.trim() || content.trim() || selected.length))

    const copy = language === 'tr' ? {
        title: 'Duyuru oluştur', description: 'Duyuruyu tüm personele veya seçtiğiniz kişilere tam ekran bildirim olarak gönderin.',
        all: 'Tüm personel', allHint: 'Otelin tüm kullanıcıları', selected: 'Seçili kişiler', selectedHint: 'Belirlediğiniz ekip üyeleri',
        titleLabel: 'Duyuru başlığı', titlePlaceholder: 'Kısa ve açıklayıcı bir başlık', messageLabel: 'Duyuru metni', messagePlaceholder: 'Ekibin bilmesi gerekenleri yazın…',
        search: 'Personel ara', cancel: 'İptal', send: 'Duyuruyu gönder', count: (n: number) => `${n} kişi seçildi`, choose: 'En az bir kişi seçin',
    } : language === 'ru' ? {
        title: 'Создать объявление', description: 'Отправьте полноэкранное объявление всему персоналу или выбранным людям.',
        all: 'Весь персонал', allHint: 'Все пользователи отеля', selected: 'Выбранные люди', selectedHint: 'Указанные сотрудники',
        titleLabel: 'Заголовок объявления', titlePlaceholder: 'Краткий заголовок', messageLabel: 'Текст объявления', messagePlaceholder: 'Напишите, что должна знать команда…',
        search: 'Поиск сотрудника', cancel: 'Отмена', send: 'Отправить объявление', count: (n: number) => `Выбрано: ${n}`, choose: 'Выберите хотя бы одного человека',
    } : {
        title: 'Create announcement', description: 'Send a full-screen announcement to all staff or selected people.',
        all: 'All staff', allHint: 'Every user at this hotel', selected: 'Selected people', selectedHint: 'Specific team members',
        titleLabel: 'Announcement title', titlePlaceholder: 'A short, clear title', messageLabel: 'Announcement message', messagePlaceholder: 'Write what the team needs to know…',
        search: 'Search staff', cancel: 'Cancel', send: 'Send announcement', count: (n: number) => `${n} ${n === 1 ? 'person' : 'people'} selected`, choose: 'Select at least one person',
    }

    const filteredStaff = useMemo(() => staff.filter(member => member.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [search, staff])
    const canSend = title.trim() && content.trim() && (audience === 'all' || selected.length > 0) && !sending

    const reset = () => {
        setAudience('all'); setSelected([]); setTitle(''); setContent(''); setSearch('')
    }

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next)
        if (!next) reset()
    }

    const handleSend = async () => {
        if (!canSend) return
        setSending(true)
        try {
            const recipients = staff.filter(member => selected.includes(member.uid))
            await onSend({ title: title.trim(), content: content.trim(), audience, recipientIds: recipients.map(member => member.uid), recipientNames: recipients.map(member => member.name) })
            handleOpenChange(false)
        } finally {
            setSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="grid h-[min(90dvh,56rem)] w-[min(94vw,76rem)] max-w-none grid-rows-[auto_1fr_auto] overflow-hidden p-0">
                <DialogHeader className="border-b border-border px-6 py-5 pr-16">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Megaphone className="h-5 w-5" /></div>
                        <div><DialogTitle>{copy.title}</DialogTitle><DialogDescription className="mt-1">{copy.description}</DialogDescription></div>
                    </div>
                </DialogHeader>

                <div className="grid min-h-0 gap-0 overflow-y-auto md:grid-cols-[minmax(18rem,0.8fr)_minmax(22rem,1.2fr)] md:overflow-hidden">
                    <div className="space-y-5 border-b border-border p-5 md:overflow-y-auto md:border-b-0 md:border-r">
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                            {(['all', 'selected'] as Audience[]).map(option => (
                                <button key={option} type="button" onClick={() => setAudience(option)} aria-pressed={audience === option} className={cn('rounded-xl border p-4 text-left transition-colors', audience === option ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/60')}>
                                    <span className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4" />{option === 'all' ? copy.all : copy.selected}</span>
                                    <span className="mt-1 block text-xs text-muted-foreground">{option === 'all' ? copy.allHint : copy.selectedHint}</span>
                                </button>
                            ))}
                        </div>
                        {audience === 'selected' && <>
                            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder={copy.search} className="pl-9" /></div>
                            <p className="text-xs font-medium text-muted-foreground">{selected.length ? copy.count(selected.length) : copy.choose}</p>
                            <div className="space-y-1">
                                {filteredStaff.map(member => <label key={member.uid} className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 hover:bg-muted/60">
                                    <input type="checkbox" checked={selected.includes(member.uid)} onChange={() => setSelected(current => current.includes(member.uid) ? current.filter(id => id !== member.uid) : [...current, member.uid])} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                                    <UserAvatar user={member as any} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{member.name}</span><span className="block text-[10px] uppercase text-muted-foreground">{member.role}</span></span>
                                </label>)}
                            </div>
                        </>}
                    </div>
                    <div className="space-y-5 p-5 md:overflow-y-auto md:p-7">
                        <label className="block space-y-2"><span className="text-sm font-semibold">{copy.titleLabel}</span><Input aria-label={copy.titleLabel} value={title} onChange={event => setTitle(event.target.value)} placeholder={copy.titlePlaceholder} maxLength={100} /></label>
                        <label className="block space-y-2"><span className="text-sm font-semibold">{copy.messageLabel}</span><Textarea aria-label={copy.messageLabel} value={content} onChange={event => setContent(event.target.value)} placeholder={copy.messagePlaceholder} className="min-h-56 resize-none md:min-h-80" maxLength={3000} /></label>
                    </div>
                </div>
                <DialogFooter className="border-t border-border bg-muted/20 px-5 py-4">
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>{copy.cancel}</Button>
                    <Button type="button" disabled={!canSend} onClick={handleSend}><Megaphone className="mr-2 h-4 w-4" />{copy.send}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
