'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Users2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { Group } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchGroups = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('group_members')
      .select('groups(*)')
      .eq('user_id', user.id)

    const groupList = (data || []).map((gm: any) => gm.groups).filter(Boolean)
    setGroups(groupList)
    setLoading(false)
  }, [])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: group, error } = await supabase
        .from('groups')
        .insert({ name: name.trim(), description: description.trim() || null, created_by: user.id, currency: 'USD' })
        .select()
        .single()

      if (error) throw error

      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      })

      setGroups((prev) => [group, ...prev])
      setName('')
      setDescription('')
      setDialogOpen(false)
      toast.success('Group created!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-1 h-4 w-4" /> New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Group name</Label>
                <Input id="name" placeholder="Trip to Bali" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="desc">Description (optional)</Label>
                <Input id="desc" placeholder="Summer vacation 2025" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Group
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center">
          <Users2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">No groups yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create a group to start splitting expenses</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card key={group.id} className="border-0 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <Users2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.description || formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
