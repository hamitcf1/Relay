import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where, type Timestamp } from 'firebase/firestore'
import { motion } from 'framer-motion'
import { Archive, Clipboard, Edit3, NotebookPen, Plus, RotateCcw, Save, Search, Share2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { cn, formatDisplayDateTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useRosterStore } from '@/stores/rosterStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useWorkspaceDirty } from '@/hooks/useWorkspaceDirty'

type Note = {
    id: string
    owner_id: string
    title: string
    content: string
    tags: string[]
    collaborator_ids: string[]
    archived: boolean
    deleted: boolean
    created_at?: Timestamp
    updated_at?: Timestamp
}
type View = 'active' | 'shared' | 'archived' | 'trash'
const empty = { title: '', content: '', tags: [] as string[], collaborator_ids: [] as string[] }

export function PersonalNotes({ hotelId }: { hotelId: string }) {
    const { t } = useLanguageStore()
    const user = useAuthStore(state => state.user)
    const { activeStaff, subscribeToRoster } = useRosterStore()
    const [owned, setOwned] = useState<Note[]>([])
    const [shared, setShared] = useState<Note[]>([])
    const [view, setView] = useState<View>('active')
    const [search, setSearch] = useState('')
    const [tagFilter, setTagFilter] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draft, setDraft] = useState(empty)
    const [dirty, setDirty] = useState(false)
    const [tagText, setTagText] = useState('')
    const [saving, setSaving] = useState(false)
    useWorkspaceDirty('personal-note', dirty)

    useEffect(() => {
        if (!hotelId || !user?.uid || user.is_demo) return
        const notes = collection(db, 'hotels', hotelId, 'personal_notes')
        const stopOwned = onSnapshot(query(notes, where('owner_id', '==', user.uid)), snapshot => {
            setOwned(snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Note)))
        }, () => toast.error(t('personalNotes.loadFailed')))
        const stopShared = onSnapshot(query(notes, where('collaborator_ids', 'array-contains', user.uid)), snapshot => {
            setShared(snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Note)))
        }, () => toast.error(t('personalNotes.sharedLoadFailed')))
        return () => { stopOwned(); stopShared() }
    }, [hotelId, user?.uid, user?.is_demo, t])
    useEffect(() => {
        if (!hotelId) return
        return subscribeToRoster(hotelId)
    }, [hotelId, subscribeToRoster])

    const notes = useMemo(() => [...new Map([...owned, ...shared].map(note => [note.id, note])).values()], [owned, shared])
    const editing = notes.find(note => note.id === editingId)
    const tags = [...new Set(notes.flatMap(note => note.tags || []))].sort()
    const visible = notes.filter(note => {
        if (view === 'trash') return note.deleted && note.owner_id === user?.uid
        if (note.deleted) return false
        if (view === 'archived') return note.archived
        if (note.archived) return false
        if (view === 'shared' && note.owner_id === user?.uid && !(note.collaborator_ids || []).length) return false
        const text = `${note.title} ${note.content} ${(note.tags || []).join(' ')}`.toLocaleLowerCase('tr')
        return text.includes(search.toLocaleLowerCase('tr')) && (!tagFilter || note.tags?.includes(tagFilter))
    }).sort((a, b) => (b.updated_at?.toMillis?.() || 0) - (a.updated_at?.toMillis?.() || 0))

    const openEditor = (note: Note) => {
        if (dirty && !window.confirm(t('personalNotes.leaveConfirm'))) return
        setEditingId(note.id)
        setDraft({ title: note.title, content: note.content, tags: note.tags || [], collaborator_ids: note.collaborator_ids || [] })
        setTagText((note.tags || []).join(', '))
        setDirty(false)
    }
    const closeEditor = () => {
        if (dirty && !window.confirm(t('personalNotes.leaveConfirm'))) return
        setEditingId(null)
        setDirty(false)
    }
    const create = async () => {
        if (!user) return
        if (user.is_demo) { toast.info(t('personalNotes.demoBlocked')); return }
        try {
            const ref = await addDoc(collection(db, 'hotels', hotelId, 'personal_notes'), {
                owner_id: user.uid, title: 'Yeni not', content: '', tags: [], collaborator_ids: [], archived: false, deleted: false,
                created_at: serverTimestamp(), updated_at: serverTimestamp()
            })
            setEditingId(ref.id)
            setDraft({ ...empty, title: 'Yeni not' })
            setTagText('')
            setDirty(false)
        } catch { toast.error(t('personalNotes.createFailed')) }
    }
    const save = async () => {
        if (!editing || !draft.title.trim() || saving) return
        setSaving(true)
        try {
            await updateDoc(doc(db, 'hotels', hotelId, 'personal_notes', editing.id), {
                title: draft.title.trim(), content: draft.content, tags: [...new Set(tagText.split(',').map(tag => tag.trim()).filter(Boolean))],
                ...(editing.owner_id === user?.uid ? { collaborator_ids: draft.collaborator_ids } : {}),
                updated_at: serverTimestamp()
            })
            setDirty(false)
            toast.success(t('personalNotes.saved'))
        } catch { toast.error(t('personalNotes.saveFailed')) }
        finally { setSaving(false) }
    }
    const patchNote = async (note: Note, patch: Partial<Note>) => {
        try {
            await updateDoc(doc(db, 'hotels', hotelId, 'personal_notes', note.id), { ...patch, updated_at: serverTimestamp() })
            if (editingId === note.id) { setEditingId(null); setDirty(false) }
        } catch { toast.error(t('personalNotes.updateFailed')) }
    }
    const purge = async (note: Note) => {
        if (!window.confirm(t('personalNotes.purgeConfirm'))) return
        try {
            await deleteDoc(doc(db, 'hotels', hotelId, 'personal_notes', note.id))
            if (editingId === note.id) { setEditingId(null); setDirty(false) }
        } catch { toast.error(t('personalNotes.deleteFailed')) }
    }
    const copyBody = async (note: Note) => {
        try { await navigator.clipboard.writeText(note.content || ''); toast.success(t('personalNotes.copied')) }
        catch { toast.error(t('personalNotes.copyFailed')) }
    }
    const updateDraft = (patch: Partial<typeof draft>) => { setDraft(current => ({ ...current, ...patch })); setDirty(true) }
    const views: [View, string][] = [
        ['active', t('personalNotes.viewActive')],
        ['shared', t('personalNotes.viewShared')],
        ['archived', t('personalNotes.viewArchived')],
        ['trash', t('personalNotes.viewTrash')],
    ]

    return <section className="mx-auto w-full max-w-[90rem] space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h2 className="text-2xl font-bold text-foreground">{t('personalNotes.title')}</h2>
                <p className="text-muted-foreground text-sm">{t('personalNotes.desc')}</p>
            </div>
            <Button onClick={create} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('personalNotes.add')}
            </Button>
        </header>

        <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-2" aria-label={t('personalNotes.title')}>
                {views.map(([key, label]) =>
                    <Button key={key} type="button" size="sm" variant={view === key ? 'default' : 'outline'} onClick={() => { setView(key); setEditingId(null) }}>{label}</Button>)}
            </nav>
            <label className="relative ml-auto block min-w-56 flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input aria-label={t('personalNotes.search')} value={search} onChange={event => setSearch(event.target.value)} placeholder={t('personalNotes.searchPlaceholder')} className="pl-9" />
            </label>
            <select aria-label={t('personalNotes.allTags')} value={tagFilter} onChange={event => setTagFilter(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm sm:w-48">
                <option value="">{t('personalNotes.allTags')}</option>
                {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {visible.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
                    <NotebookPen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">{t('personalNotes.empty')}</p>
                    {view === 'active' && <Button variant="link" className="text-primary mt-2" onClick={create}>{t('personalNotes.createFirst')}</Button>}
                </div>
            ) : visible.map(note => {
                const isOwner = note.owner_id === user?.uid
                const body = note.content || ''
                const words = body.trim() ? body.trim().split(/\s+/).length : 0
                const chars = body.length
                return <motion.div key={note.id} layout>
                    <Card className="bg-card border-border hover:border-primary/50 transition-all overflow-hidden flex flex-col h-full group">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                    {isOwner ? t('personalNotes.ownBadge') : t('personalNotes.sharedBadge')}
                                </Badge>
                                <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        aria-label={`${t('personalNotes.edit')}: ${note.title || t('personalNotes.untitled')}`}
                                        title={t('personalNotes.edit')}
                                        onClick={() => openEditor(note)}
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        aria-label={`${t('personalNotes.copyBody')}: ${note.title || t('personalNotes.untitled')}`}
                                        title={t('personalNotes.copyBody')}
                                        onClick={() => copyBody(note)}
                                    >
                                        <Clipboard className="w-3.5 h-3.5" />
                                    </Button>
                                    {isOwner && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                            aria-label={`${note.archived ? t('personalNotes.unarchive') : t('personalNotes.archive')}: ${note.title || t('personalNotes.untitled')}`}
                                            title={note.archived ? t('personalNotes.unarchive') : t('personalNotes.archive')}
                                            onClick={() => patchNote(note, note.archived ? { archived: false } : { archived: true })}
                                        >
                                            {note.archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                        </Button>
                                    )}
                                    {isOwner && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            aria-label={`${note.deleted ? t('personalNotes.purge') : t('personalNotes.moveToTrash')}: ${note.title || t('personalNotes.untitled')}`}
                                            title={note.deleted ? t('personalNotes.purge') : t('personalNotes.moveToTrash')}
                                            onClick={() => note.deleted ? purge(note) : patchNote(note, { deleted: true })}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardTitle className="text-foreground">{note.title || t('personalNotes.untitled')}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">{note.content || t('personalNotes.noBody')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2 flex-1 flex flex-col">
                            <div className="flex flex-wrap gap-1 mb-2">
                                {(note.tags || []).map(tag => (
                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md font-bold uppercase">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    type="button"
                                    onClick={() => openEditor(note)}
                                    className="group/note w-full rounded-xl border border-border bg-muted/30 p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{t('personalNotes.preview')}</span>
                                        <Edit3 className="w-3 h-3 text-muted-foreground group-hover/note:text-primary opacity-0 group-hover/note:opacity-100 transition-all" />
                                    </div>
                                    <p className="text-lg font-bold text-foreground">
                                        {words.toLocaleString('tr')}
                                        <span className="text-xs text-muted-foreground ml-1 font-normal">{t('personalNotes.unitWords')} ({chars.toLocaleString('tr')} {t('personalNotes.unitChars')})</span>
                                    </p>
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-xl border border-border bg-muted/30 p-2.5">
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{t('personalNotes.updated')}</p>
                                        <p className="text-sm font-bold text-foreground">{note.updated_at?.toDate ? formatDisplayDateTime(note.updated_at.toDate()) : '—'}</p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-muted/30 p-2.5">
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">{t('personalNotes.created')}</p>
                                        <p className="text-sm font-bold text-foreground">{note.created_at?.toDate ? formatDisplayDateTime(note.created_at.toDate()) : '—'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-border/50">
                                <p className="text-[10px] text-muted-foreground italic text-center">{t('personalNotes.clickToEdit')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            })}
        </div>

        <Dialog open={!!editing} onOpenChange={open => !open && closeEditor()}>
            <DialogContent className="bg-card border-border sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground">{editing?.title ? t('personalNotes.edit') : t('personalNotes.create')}</DialogTitle>
                    <DialogDescription>{t('personalNotes.desc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-muted-foreground uppercase font-bold" htmlFor="personal-note-title">{t('personalNotes.form.title')}</label>
                        <Input
                            id="personal-note-title"
                            value={draft.title}
                            onChange={event => updateDraft({ title: event.target.value })}
                            placeholder={t('personalNotes.untitled')}
                            className="h-12 bg-background border-border text-lg font-semibold"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-muted-foreground uppercase font-bold" htmlFor="personal-note-body">{t('personalNotes.form.body')}</label>
                        <Textarea
                            id="personal-note-body"
                            value={draft.content}
                            onChange={event => updateDraft({ content: event.target.value })}
                            placeholder={t('personalNotes.noBody')}
                            className="min-h-56 resize-y bg-background border-border text-sm leading-6"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-muted-foreground uppercase font-bold" htmlFor="personal-note-tags">{t('personalNotes.form.tags')}</label>
                        <Input
                            id="personal-note-tags"
                            value={tagText}
                            onChange={event => { setTagText(event.target.value); setDirty(true) }}
                            className="bg-background border-border"
                        />
                        <p className="text-xs text-muted-foreground">{t('personalNotes.form.tagsHint')}</p>
                    </div>
                    {editing?.owner_id === user?.uid && (
                        <div className="space-y-2 rounded-lg border border-border p-3">
                            <div className="flex items-center gap-2 text-sm font-medium"><Share2 className="h-4 w-4" />{t('personalNotes.share')}</div>
                            <p className="text-xs text-muted-foreground">{t('personalNotes.shareHint')}</p>
                            <div className="flex flex-wrap gap-2">
                                {activeStaff.filter(member => member.uid !== user?.uid).map(member => (
                                    <label key={member.uid} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={draft.collaborator_ids.includes(member.uid)}
                                            onChange={event => updateDraft({ collaborator_ids: event.target.checked ? [...draft.collaborator_ids, member.uid] : draft.collaborator_ids.filter(id => id !== member.uid) })}
                                        />
                                        {member.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="items-center sm:items-center sm:justify-between">
                    <span className={cn('text-xs text-muted-foreground', dirty && 'text-amber-500')}>{dirty ? t('personalNotes.unsaved') : t('personalNotes.allSaved')}</span>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="ghost" onClick={closeEditor}><X className="mr-1 h-4 w-4" />{t('common.cancel')}</Button>
                        <Button onClick={save} disabled={!draft.title.trim() || saving}>
                            <Save className="mr-2 h-4 w-4" />{saving ? t('personalNotes.saving') : t('common.save')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </section>
}
