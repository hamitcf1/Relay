import { useState } from 'react'
import { Plus, PowerOff, ShieldCheck, Briefcase, Users, Loader2, Eye, EyeOff, Edit3, Mail, Lock } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRosterStore } from '@/stores/rosterStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { createSecondaryUser, updateStaffCredentials } from '@/lib/createSecondaryUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { UserRole, StaffMember } from '@/types'

export function StaffManagement() {
    const { t } = useLanguageStore()
    const hotel = useHotelStore(state => state.hotel)
    const staff = useRosterStore(state => state.staff)
    const [showInactive, setShowInactive] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Password visibility toggle per staff member
    const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({})

    // Edit Staff Modal states
    const [editMember, setEditMember] = useState<StaffMember | null>(null)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editPassword, setEditPassword] = useState('')
    const [editRole, setEditRole] = useState<UserRole>('receptionist')
    const [showEditPassword, setShowEditPassword] = useState(false)
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    // Create Form states
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<UserRole>('receptionist')

    const activeStaff = staff.filter(s => s.status !== 'inactive')
    const inactiveStaff = staff.filter(s => s.status === 'inactive')
    const displayedStaff = showInactive ? staff : activeStaff

    const togglePasswordVisibility = (uid: string) => {
        setShowPasswordMap(prev => ({ ...prev, [uid]: !prev[uid] }))
    }

    const openEditModal = (member: StaffMember) => {
        setEditMember(member)
        setEditName(member.name || '')
        setEditEmail(member.email || '')
        setEditPassword(member.password || '')
        setEditRole((member.role as UserRole) || 'receptionist')
        setShowEditPassword(false)
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editMember || !hotel?.id) return

        setIsSavingEdit(true)
        try {
            await updateStaffCredentials({
                uid: editMember.uid,
                name: editName,
                email: editEmail,
                password: editPassword,
                role: editRole
            })
            toast.success('Personel giriş bilgileri ve şifresi başarıyla güncellendi!')
            setEditMember(null)
        } catch (error: any) {
            console.error('Error updating staff credentials:', error)
            toast.error(error.message || 'Giriş bilgileri güncellenemedi')
        } finally {
            setIsSavingEdit(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!hotel?.id) return

        if (password.length < 6) {
            toast.error(t('auth.error.passwordLength') || 'Şifre en az 6 karakter olmalıdır')
            return
        }

        setIsCreating(true)
        try {
            await createSecondaryUser({
                name,
                email,
                password,
                role,
                hotelId: hotel.id
            })
            toast.success('Personel hesabı ve giriş şifresi oluşturuldu!')
            setDialogOpen(false)
            // Reset form
            setName('')
            setEmail('')
            setPassword('')
            setRole('receptionist')
        } catch (error: any) {
            console.error('Error creating user:', error)
            toast.error(error.message || 'Personel oluşturulamadı')
        } finally {
            setIsCreating(false)
        }
    }

    const handleToggleStatus = async (uid: string, currentStatus: string | undefined) => {
        if (hotel?.id === 'demo-hotel-id') { toast.info(t('staffManagement.demoBlocked')); return }
        const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive'
        const action = newStatus === 'inactive' ? 'Devre dışı bırakıldı' : 'Yeniden aktifleştirildi'
        try {
            await updateDoc(doc(db, 'users', uid), { 
                status: newStatus,
                deactivated_at: newStatus === 'inactive' ? new Date().toISOString() : null
            })
            toast.success(`Personel ${action}`)
        } catch (error) {
            toast.error(`Durum değiştirilemedi`)
            console.error(error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(() => {
                    const gmCount = activeStaff.filter(s => s.role === 'gm').length
                    const receptionCount = activeStaff.filter(s => s.role === 'receptionist').length
                    const otherCount = activeStaff.filter(s => s.role !== 'gm' && s.role !== 'receptionist').length

                    return [
                        { role: 'GM (Yönetici)', count: gmCount, icon: ShieldCheck, color: 'text-rose-400' },
                        { role: t('auth.role.receptionist') || 'Resepsiyonist', count: receptionCount, icon: Briefcase, color: 'text-blue-400' },
                        { role: t('auth.role.staff') || 'Diğer Personel', count: otherCount, icon: Users, color: 'text-muted-foreground' }
                    ].map((item, i) => (
                    <Card key={i} className="glass">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <item.icon className={cn("w-5 h-5", item.color)} />
                                <Badge variant="outline">{item.count} {item.count === 1 ? 'Kişi' : 'Kişi'}</Badge>
                            </div>
                            <h3 className="font-bold text-lg">{item.role}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Aktif çalışanlar</p>
                        </CardContent>
                    </Card>
                ))})()}
            </div>

            <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div>
                        <CardTitle>Ekip Dizini & Giriş Bilgileri Yönetimi</CardTitle>
                        <CardDescription>Personel e-posta ve şifrelerini görüntüleyin, güncelleyin veya yeni kullanıcı ekleyin</CardDescription>
                    </div>
                    
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Yeni Personel Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Personel Hesabı Oluştur</DialogTitle>
                                <DialogDescription>
                                    Yeni personel bilgileri ve giriş şifresini belirleyin.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Ad Soyad</Label>
                                    <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Ahmet Yılmaz" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-posta Adresi</Label>
                                    <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Örn: ahmet@otel.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Giriş Şifresi</Label>
                                    <Input id="password" type="text" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Görevi / Rolü</Label>
                                    <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="receptionist">Resepsiyonist</SelectItem>
                                            <SelectItem value="housekeeping">Kat Hizmetleri</SelectItem>
                                            <SelectItem value="gm">Genel Müdür (GM)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={isCreating} className="w-full mt-4">
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hesabı Oluştur'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex justify-end mb-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowInactive(!showInactive)}
                            className={cn("text-xs", showInactive ? "text-primary" : "text-muted-foreground")}
                        >
                            {showInactive ? "Pasif Personeli Gizle" : `Pasif Personeli Göster (${inactiveStaff.length})`}
                        </Button>
                    </div>
                    
                    <div className="space-y-3">
                        {displayedStaff.map((member) => {
                            const isPasswordVisible = !!showPasswordMap[member.uid]

                            return (
                                <div key={member.uid} className={cn(
                                    "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-colors gap-3",
                                    member.status === 'inactive' ? "bg-muted/10 border-border/20 opacity-70" : "bg-muted/20 border-border/40"
                                )}>
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={cn(
                                            "w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0",
                                            member.role === 'gm' ? "bg-rose-500/20 text-rose-400" : 
                                            member.role === 'receptionist' ? "bg-blue-500/20 text-blue-400" : "bg-zinc-500/20 text-zinc-400"
                                        )}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                <span className="truncate">{member.name}</span>
                                                {member.status === 'inactive' && (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-1 border-rose-500/30 text-rose-400">Pasif</Badge>
                                                )}
                                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                                    {member.role === 'gm' ? 'Genel Müdür' : member.role === 'receptionist' ? 'Resepsiyonist' : member.role}
                                                </Badge>
                                            </div>

                                            {/* CREDENTIALS ROW FOR ADMIN / GM */}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3.5 h-3.5 text-primary/70" />
                                                    <strong className="text-foreground">{member.email || 'E-posta tanımlanmamış'}</strong>
                                                </span>
                                                <span className="flex items-center gap-1 font-mono">
                                                    <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                                                    Şifre: <strong className="text-foreground font-semibold">
                                                        {isPasswordVisible ? (member.password || '123456') : '••••••••'}
                                                    </strong>
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePasswordVisibility(member.uid)}
                                                        className="ml-1 text-muted-foreground hover:text-foreground p-0.5"
                                                        title={isPasswordVisible ? "Şifreyi Gizle" : "Şifreyi Göster"}
                                                    >
                                                        {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
                                                    </button>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditModal(member)}
                                            className="h-8 text-xs gap-1 border-border/80"
                                        >
                                            <Edit3 className="w-3.5 h-3.5 text-primary" />
                                            Bilgileri Düzenle
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleStatus(member.uid, member.status)}
                                            className={cn(
                                                "h-8 text-xs gap-1.5",
                                                member.status === 'inactive' ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                            )}
                                        >
                                            {member.status === 'inactive' ? (
                                                <>Aktifleştir</>
                                            ) : (
                                                <><PowerOff className="w-3.5 h-3.5" /> Pasife Al</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* EDIT STAFF CREDENTIALS MODAL */}
            {editMember && (
                <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-primary" />
                                Personel Giriş Bilgilerini Düzenle
                            </DialogTitle>
                            <DialogDescription>
                                {editMember.name} için kullanıcı adı, e-posta ve şifre bilgilerini güncelleyebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="editName" className="text-xs font-semibold">Ad Soyad</Label>
                                <Input 
                                    id="editName" 
                                    required 
                                    value={editName} 
                                    onChange={e => setEditName(e.target.value)} 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editEmail" className="text-xs font-semibold">Giriş E-postası</Label>
                                <Input 
                                    id="editEmail" 
                                    type="email" 
                                    required 
                                    value={editEmail} 
                                    onChange={e => setEditEmail(e.target.value)} 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editPassword" className="text-xs font-semibold">Giriş Şifresi</Label>
                                <div className="relative">
                                    <Input 
                                        id="editPassword" 
                                        type={showEditPassword ? "text" : "password"} 
                                        required 
                                        minLength={6} 
                                        value={editPassword} 
                                        onChange={e => setEditPassword(e.target.value)} 
                                        className="pr-10 font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPassword(!showEditPassword)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <span className="text-[10px] text-muted-foreground">Şifre en az 6 karakter olmalıdır.</span>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editRole" className="text-xs font-semibold">Görevi / Rolü</Label>
                                <Select value={editRole} onValueChange={(v: UserRole) => setEditRole(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="receptionist">Resepsiyonist</SelectItem>
                                        <SelectItem value="housekeeping">Kat Hizmetleri</SelectItem>
                                        <SelectItem value="gm">Genel Müdür (GM)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditMember(null)}>
                                    İptal
                                </Button>
                                <Button type="submit" size="sm" disabled={isSavingEdit} className="bg-primary">
                                    {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet ve Güncelle'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
