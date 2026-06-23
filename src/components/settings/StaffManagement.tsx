import { useState } from 'react'
import { Plus, PowerOff, ShieldCheck, Briefcase, Users, Loader2 } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRosterStore } from '@/stores/rosterStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { createSecondaryUser } from '@/lib/createSecondaryUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

export function StaffManagement() {
    const { t } = useLanguageStore()
    const hotel = useHotelStore(state => state.hotel)
    const staff = useRosterStore(state => state.staff)
    const [showInactive, setShowInactive] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Form states
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<UserRole>('receptionist')

    const activeStaff = staff.filter(s => s.status !== 'inactive')
    const inactiveStaff = staff.filter(s => s.status === 'inactive')
    const displayedStaff = showInactive ? staff : activeStaff

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!hotel?.id) return

        if (password.length < 6) {
            toast.error(t('auth.error.passwordLength') || 'Password must be at least 6 characters')
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
            toast.success('User successfully created and added to the hotel!')
            setDialogOpen(false)
            // Reset form
            setName('')
            setEmail('')
            setPassword('')
            setRole('receptionist')
        } catch (error: any) {
            console.error('Error creating user:', error)
            toast.error(error.message || 'Failed to create user')
        } finally {
            setIsCreating(false)
        }
    }

    const handleToggleStatus = async (uid: string, currentStatus: string | undefined) => {
        const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive'
        const action = newStatus === 'inactive' ? 'Deactivated' : 'Reactivated'
        try {
            await updateDoc(doc(db, 'users', uid), { 
                status: newStatus,
                deactivated_at: newStatus === 'inactive' ? new Date().toISOString() : null
            })
            toast.success(`Employee ${action}`)
        } catch (error) {
            toast.error(`Failed to change status`)
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
                        { role: 'GM', count: gmCount, icon: ShieldCheck, color: 'text-rose-400' },
                        { role: t('auth.role.receptionist') || 'Receptionist', count: receptionCount, icon: Briefcase, color: 'text-blue-400' },
                        { role: t('auth.role.staff') || 'Other Staff', count: otherCount, icon: Users, color: 'text-muted-foreground' }
                    ].map((item, i) => (
                    <Card key={i} className="glass">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <item.icon className={cn("w-5 h-5", item.color)} />
                                <Badge variant="outline">{item.count} {item.count === 1 ? t('common.person') || 'person' : t('common.persons') || 'persons'}</Badge>
                            </div>
                            <h3 className="font-bold text-lg">{item.role}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Active staff</p>
                        </CardContent>
                    </Card>
                ))})()}
            </div>

            <Card className="glass">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div>
                        <CardTitle>Team Directory</CardTitle>
                        <CardDescription>Manage active staff and create new accounts</CardDescription>
                    </div>
                    
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create Staff Account</DialogTitle>
                                <DialogDescription>
                                    Add a new employee to your hotel. This will create their login credentials automatically.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. jane@hotel.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Initial Password</Label>
                                    <Input id="password" type="text" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="receptionist">Receptionist</SelectItem>
                                            <SelectItem value="housekeeping">Housekeeping</SelectItem>
                                            <SelectItem value="gm">General Manager</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={isCreating} className="w-full mt-4">
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
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
                            {showInactive ? "Hide Inactive Staff" : `Show Inactive Staff (${inactiveStaff.length})`}
                        </Button>
                    </div>
                    
                    <div className="space-y-3">
                        {displayedStaff.map((member) => (
                            <div key={member.uid} className={cn(
                                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                member.status === 'inactive' ? "bg-muted/10 border-border/20 opacity-70" : "bg-muted/20 border-border/40"
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                        member.role === 'gm' ? "bg-rose-500/20 text-rose-400" : 
                                        member.role === 'receptionist' ? "bg-blue-500/20 text-blue-400" : "bg-zinc-500/20 text-zinc-400"
                                    )}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            {member.name}
                                            {member.status === 'inactive' && (
                                                <Badge variant="outline" className="text-[10px] py-0 px-1 border-rose-500/30 text-rose-400">Inactive</Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground capitalize flex items-center gap-2">
                                            {member.role === 'gm' ? 'General Manager' : member.role}
                                            {member.deactivated_at && member.status === 'inactive' && (
                                                <span className="text-[10px] opacity-70">
                                                    • Deactivated {new Date(member.deactivated_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleStatus(member.uid, member.status)}
                                    className={cn(
                                        "text-xs gap-1.5",
                                        member.status === 'inactive' ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                    )}
                                >
                                    {member.status === 'inactive' ? (
                                        <>Activate</>
                                    ) : (
                                        <><PowerOff className="w-3.5 h-3.5" /> Deactivate</>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
