import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where, type Timestamp } from 'firebase/firestore'
import { Archive, Clipboard, Plus, RotateCcw, Save, Search, Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useRosterStore } from '@/stores/rosterStore'
import { Button } from '@/components/ui/button'
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
    const user = useAuthStore(state => state.user)
    const { activeStaff, subscribeToRoster } = useRosterStore()
    const [owned, setOwned] = useState<Note[]>([])
    const [shared, setShared] = useState<Note[]>([])
    const [view, setView] = useState<View>('active')
    const [search, setSearch] = useState('')
    const [tagFilter, setTagFilter] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
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
        }, () => toast.error('Kişisel notlar yüklenemedi.'))
        const stopShared = onSnapshot(query(notes, where('collaborator_ids', 'array-contains', user.uid)), snapshot => {
            setShared(snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Note)))
        }, () => toast.error('Paylaşılan notlar yüklenemedi.'))
        return () => { stopOwned(); stopShared() }
    }, [hotelId, user?.uid, user?.is_demo])
    useEffect(() => {
        if (!hotelId) return
        return subscribeToRoster(hotelId)
    }, [hotelId, subscribeToRoster])

    const notes = useMemo(() => [...new Map([...owned, ...shared].map(note => [note.id, note])).values()], [owned, shared])
    const selected = notes.find(note => note.id === selectedId)
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

    const choose = (note: Note) => {
        if (dirty && !window.confirm('Kaydedilmemiş değişiklikleri bırakmak istiyor musunuz?')) return
        setSelectedId(note.id)
        setDraft({ title: note.title, content: note.content, tags: note.tags || [], collaborator_ids: note.collaborator_ids || [] })
        setTagText((note.tags || []).join(', '))
        setDirty(false)
    }
    const create = async () => {
        if (!user) return
        if (dirty && !window.confirm('Kaydedilmemiş değişiklikleri bırakmak istiyor musunuz?')) return
        if (user.is_demo) { toast.info('Demo modunda kişisel not kaydı kullanılamıyor.'); return }
        try {
            const ref = await addDoc(collection(db, 'hotels', hotelId, 'personal_notes'), {
                owner_id: user.uid, title: 'Yeni not', content: '', tags: [], collaborator_ids: [], archived: false, deleted: false,
                created_at: serverTimestamp(), updated_at: serverTimestamp()
            })
            setSelectedId(ref.id)
            setDraft({ ...empty, title: 'Yeni not' })
            setTagText('')
            setDirty(false)
        } catch { toast.error('Not oluşturulamadı.') }
    }
    const save = async () => {
        if (!selected || !draft.title.trim() || saving) return
        setSaving(true)
        try {
            await updateDoc(doc(db, 'hotels', hotelId, 'personal_notes', selected.id), {
                title: draft.title.trim(), content: draft.content, tags: [...new Set(tagText.split(',').map(tag => tag.trim()).filter(Boolean))],
                ...(selected.owner_id === user?.uid ? { collaborator_ids: draft.collaborator_ids } : {}),
                updated_at: serverTimestamp()
            })
            setDirty(false)
            toast.success('Not kaydedildi.')
        } catch { toast.error('Not kaydedilemedi.') }
        finally { setSaving(false) }
    }
    const changeState = async (patch: Partial<Note>) => {
        if (!selected) return
        try {
            await updateDoc(doc(db, 'hotels', hotelId, 'personal_notes', selected.id), { ...patch, updated_at: serverTimestamp() })
            setSelectedId(null)
            setDirty(false)
        } catch { toast.error('Not güncellenemedi.') }
    }
    const remove = async () => {
        if (!selected || !window.confirm('Bu not kalıcı olarak silinsin mi?')) return
        try { await deleteDoc(doc(db, 'hotels', hotelId, 'personal_notes', selected.id)); setSelectedId(null) }
        catch { toast.error('Not silinemedi.') }
    }
    const updateDraft = (patch: Partial<typeof draft>) => { setDraft(current => ({ ...current, ...patch })); setDirty(true) }

    return <section className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-xl font-semibold">Kişisel notlar</h2><p className="text-sm text-muted-foreground">Fikirlerini sakla, etiketle ve seçtiğin ekip arkadaşlarınla paylaş.</p></div>
            <Button onClick={create}><Plus className="mr-2 h-4 w-4" />Yeni not</Button>
        </header>
        <nav className="flex flex-wrap gap-2" aria-label="Kişisel not görünümü">
            {([['active','Notlarım'],['shared','Paylaşılan'],['archived','Arşiv'],['trash','Çöp kutusu']] as [View,string][]).map(([key,label]) =>
                <Button key={key} type="button" size="sm" variant={view === key ? 'default' : 'outline'} onClick={() => { setView(key); setSelectedId(null) }}>{label}</Button>)}
        </nav>
        <div className="grid min-h-[30rem] gap-4 lg:grid-cols-[minmax(15rem,19rem)_1fr]">
            <aside className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                <label className="relative block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Notlarda ara" value={search} onChange={event => setSearch(event.target.value)} placeholder="Başlık, metin veya etiket ara" className="pl-9" /></label>
                <select aria-label="Etikete göre filtrele" value={tagFilter} onChange={event => setTagFilter(event.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"><option value="">Tüm etiketler</option>{tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}</select>
                <div className="max-h-[32rem] space-y-2 overflow-y-auto">
                    {visible.map(note => <button key={note.id} type="button" onClick={() => choose(note)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedId === note.id ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted'}`}>
                        <strong className="block truncate text-sm">{note.title || 'Başlıksız not'}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{note.content || 'İçerik yok'}</span>
                        <span className="mt-2 block text-[11px] text-muted-foreground">{note.updated_at?.toDate?.().toLocaleString('tr-TR') || 'Az önce'} · {(note.tags || []).join(', ')}</span>
                    </button>)}
                    {!visible.length && <p className="p-4 text-sm text-muted-foreground">Bu görünümde not yok.</p>}
                </div>
            </aside>
            <div className="min-w-0 rounded-xl border border-border p-4">
                {!selected ? <div className="grid min-h-80 place-items-center text-center text-sm text-muted-foreground">Bir not seç veya yeni not oluştur.</div> : <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{selected.owner_id === user?.uid ? 'Bana ait' : 'Benimle paylaşıldı'} · {selected.created_at?.toDate?.().toLocaleString('tr-TR')}</span><div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(`${draft.title}\n\n${draft.content}`); toast.success('Not kopyalandı.') } catch { toast.error('Kopyalanamadı.') } }}><Clipboard className="mr-1 h-4 w-4" />Kopyala</Button>
                        {selected.owner_id === user?.uid && <Button size="sm" variant="outline" onClick={() => changeState(selected.deleted ? { deleted: false } : { archived: !selected.archived })}>{selected.deleted ? <RotateCcw className="mr-1 h-4 w-4" /> : <Archive className="mr-1 h-4 w-4" />}{selected.deleted ? 'Geri al' : selected.archived ? 'Arşivden çıkar' : 'Arşivle'}</Button>}
                        {selected.owner_id === user?.uid && <Button size="sm" variant="outline" onClick={() => selected.deleted ? remove() : changeState({ deleted: true })}><Trash2 className="mr-1 h-4 w-4" />{selected.deleted ? 'Kalıcı sil' : 'Sil'}</Button>}
                    </div></div>
                    <Input aria-label="Not başlığı" value={draft.title} onChange={event => updateDraft({ title: event.target.value })} placeholder="Not başlığı" className="h-12 text-lg font-semibold" />
                    <Textarea aria-label="Not içeriği" value={draft.content} onChange={event => updateDraft({ content: event.target.value })} placeholder="Buraya yazın veya metin yapıştırın..." className="min-h-64 resize-y text-sm leading-6" />
                    <label className="block space-y-1 text-sm"><span className="font-medium">Etiketler</span><Input value={tagText} onChange={event => { setTagText(event.target.value); setDirty(true) }} placeholder="Örn. görev, misafir, fikir" /><span className="text-xs text-muted-foreground">Etiketleri virgülle ayırın.</span></label>
                    {selected.owner_id === user?.uid && <div className="space-y-2 rounded-lg border border-border p-3"><div className="flex items-center gap-2 text-sm font-medium"><Share2 className="h-4 w-4" />Birlikte düzenle</div><p className="text-xs text-muted-foreground">Seçtiğin kişiler bu notu görebilir ve düzenleyebilir.</p><div className="flex flex-wrap gap-2">{activeStaff.filter(member => member.uid !== user.uid).map(member => <label key={member.uid} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs"><input type="checkbox" checked={draft.collaborator_ids.includes(member.uid)} onChange={event => updateDraft({ collaborator_ids: event.target.checked ? [...draft.collaborator_ids, member.uid] : draft.collaborator_ids.filter(id => id !== member.uid) })} />{member.name}</label>)}</div></div>}
                    <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{dirty ? 'Kaydedilmemiş değişiklikler' : 'Tüm değişiklikler kayıtlı'}</span><Button onClick={save} disabled={!dirty || !draft.title.trim() || saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Kaydediliyor' : 'Kaydet'}</Button></div>
                </div>}
            </div>
        </div>
    </section>
}
