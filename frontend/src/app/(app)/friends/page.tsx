'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { UserPlus, Search, Check, X, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { formatCurrency } from '@/lib/currency'

interface FriendWithBalance extends Profile {
  balance: number
  currency: string
  friendship_id: string
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendWithBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchFriends = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: friendships } = await supabase
      .from('friendships')
      .select('*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    const friendList: FriendWithBalance[] = (friendships || []).map((f: any) => {
      const friend = f.requester_id === user.id ? f.addressee : f.requester
      return { ...friend, balance: 0, currency: 'USD', friendship_id: f.id }
    })

    setFriends(friendList)
    setLoading(false)
  }, [])

  useEffect(() => { fetchFriends() }, [fetchFriends])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user?.id || '')
        .limit(5)
      setSearchResults(data || [])
    } finally {
      setSearching(false)
    }
  }

  const sendFriendRequest = async (toUserId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: toUserId,
      status: 'pending',
    })

    if (error) {
      toast.error('Already sent or already friends')
    } else {
      toast.success('Friend request sent!')
      setDialogOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Friends</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <UserPlus className="mr-1 h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Find Friends</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email, phone, or name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching} className="bg-indigo-600 hover:bg-indigo-700">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {searchResults.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                        {p.display_name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{p.display_name}</p>
                      <p className="text-xs text-muted-foreground">{p.email || p.phone}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => sendFriendRequest(p.id)} className="bg-indigo-600 hover:bg-indigo-700">
                    Add
                  </Button>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-sm text-center text-muted-foreground py-4">No users found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : friends.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">No friends yet</p>
          <p className="text-sm text-muted-foreground mt-1">Search for people by email or phone</p>
        </div>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <Card key={friend.friendship_id} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700">
                    {friend.display_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{friend.display_name}</p>
                  <p className="text-xs text-muted-foreground">{friend.email || friend.phone}</p>
                </div>
                <div className="text-right">
                  {friend.balance === 0 ? (
                    <Badge variant="secondary" className="text-xs">Settled</Badge>
                  ) : friend.balance > 0 ? (
                    <p className="text-sm font-semibold text-green-600">+{formatCurrency(friend.balance, friend.currency)}</p>
                  ) : (
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(Math.abs(friend.balance), friend.currency)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
