'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Search, Send, MapPin, ShieldAlert, MoreVertical, Phone, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface Conversation {
    id: string
    listing_id: string
    buyer_id: string
    seller_id: string
    last_message?: string
    updated_at: string
    unread_count: number
    other_party: {
        id: string
        full_name: string
        avatar_url: string
    }
    listing?: {
        title: string
        images: string[]
    }
}

interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    created_at: string
    is_read: boolean
}

export default function MessagesContent() {
    const supabase = useMemo(() => createClient(), [])
    const { user, isLoading: authLoading } = useAuth()
    const searchParams = useSearchParams()
    const initialConvId = searchParams.get('conv')

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConvId)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoadingConvs, setIsLoadingConvs] = useState(true)
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    const fetchConversations = useCallback(async () => {
        if (!user) return
        setIsLoadingConvs(true)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            controller.abort()
            setIsLoadingConvs(false)
            console.log('Conversations fetch timed out')
        }, 10000)

        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    listing:listings(title, images),
                    buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url),
                    seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url)
                `)
                .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                .order('updated_at', { ascending: false })
                .limit(50)
                .abortSignal(controller.signal)

            if (error) throw error

            // Fetch unread counts for all conversations
            const convIds = data.map((c: { id: string }) => c.id)

            let unreadCounts: Record<string, number> = {}
            if (convIds.length > 0) {
                const { data: unreadData } = await supabase
                    .from('messages')
                    .select('conversation_id')
                    .in('conversation_id', convIds)
                    .neq('sender_id', user.id)
                    .eq('is_read', false)

                // Count unread messages per conversation
                unreadData?.forEach((msg: { conversation_id: string }) => {
                    unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1
                })
            }

            const formatted = data.map((conv: any) => {
                const otherParty = conv.buyer_id === user.id ? conv.seller : conv.buyer
                return {
                    ...conv,
                    other_party: otherParty,
                    unread_count: unreadCounts[conv.id] || 0
                }
            })

            setConversations(formatted)
        } catch (err: any) {
            // Ignore abort errors during cleanup
            if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return
            console.error('Error fetching conversations:', err)
        } finally {
            clearTimeout(timeoutId)
            setIsLoadingConvs(false)
        }
    }, [user, supabase])

    const fetchMessages = useCallback(async (convId: string) => {
        setIsLoadingMsgs(true)
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true })
                .limit(100)

            if (error) throw error
            setMessages(data || [])

            // Mark messages from the other party as read
            if (user && data && data.length > 0) {
                const unreadMessageIds = data
                    .filter((msg: Message) => msg.sender_id !== user.id && !msg.is_read)
                    .map((msg: Message) => msg.id)

                if (unreadMessageIds.length > 0) {
                    await supabase
                        .from('messages')
                        .update({ is_read: true })
                        .in('id', unreadMessageIds)
                }
            }
        } catch (err) {
            console.error('Error fetching messages:', err)
        } finally {
            setIsLoadingMsgs(false)
        }
    }, [user, supabase])

    useEffect(() => {
        let isMounted = true
        if (user) {
            const timeoutId = setTimeout(() => {
                if (isMounted) fetchConversations()
            }, 100)
            return () => {
                isMounted = false
                clearTimeout(timeoutId)
            }
        }
    }, [user, fetchConversations])

    useEffect(() => {
        let isMounted = true
        let channel: ReturnType<typeof supabase.channel> | null = null

        if (selectedConvId) {
            fetchMessages(selectedConvId)

            channel = supabase
                .channel(`conv:${selectedConvId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConvId}`
                }, (payload: { new: Message }) => {
                    if (!isMounted) return
                    const newMsg = payload.new
                    setMessages(prev => [...prev.filter(m => m.id !== newMsg.id), newMsg])

                    setConversations(prev => prev.map(c =>
                        c.id === selectedConvId
                            ? { ...c, updated_at: new Date().toISOString() }
                            : c
                    ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))
                })
                .subscribe()
        }

        return () => {
            isMounted = false
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [selectedConvId, supabase, fetchMessages])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConvId || !user || isSending) return

        setIsSending(true)
        const msgContent = newMessage.trim()
        setNewMessage('')

        try {
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: selectedConvId,
                    sender_id: user.id,
                    content: msgContent
                })

            if (msgError) throw msgError

            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', selectedConvId)

        } catch (err) {
            console.error('Error sending message:', err)
            setNewMessage(msgContent)
        } finally {
            setIsSending(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-primary-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">You need to be logged in</h1>
                <p className="text-dark-400 mb-8 max-w-sm">Please log in to your account to view your messages and chat with others.</p>
                <div className="flex gap-4">
                    <Link href="/login" className="btn-primary px-8">Log In</Link>
                    <Link href="/" className="btn-secondary px-8">Home</Link>
                </div>
            </div>
        )
    }

    const currentConv = conversations.find(c => c.id === selectedConvId)

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-4 px-4 overflow-hidden flex items-stretch">
                <div className="max-w-7xl mx-auto w-full flex glass-card overflow-hidden">
                    {/* Chat Sidebar */}
                    <div className={`w-full md:w-80 border-r border-white/5 flex flex-col ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-white/5">
                            <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-primary-500 transition-colors outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoadingConvs ? (
                                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                            ) : conversations.length > 0 ? (
                                conversations.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSelectedConvId(chat.id)}
                                        className={`w-full p-4 flex gap-3 items-center hover:bg-white/5 transition-colors border-b border-white/5 ${selectedConvId === chat.id ? 'bg-white/5' : ''} ${chat.unread_count > 0 ? 'bg-primary-500/5' : ''}`}
                                    >
                                        <div className="relative shrink-0">
                                            {chat.other_party.avatar_url ? (
                                                <Image src={chat.other_party.avatar_url} alt={chat.other_party.full_name} width={48} height={48} className="rounded-2xl" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shrink-0">
                                                    {chat.other_party.full_name[0].toUpperCase()}
                                                </div>
                                            )}
                                            {chat.unread_count > 0 && (
                                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                                                    {chat.unread_count > 9 ? '9+' : chat.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <span className={`font-bold truncate ${chat.unread_count > 0 ? 'text-white' : 'text-white'}`}>{chat.other_party.full_name}</span>
                                                <span className="text-[10px] text-dark-500 uppercase font-bold shrink-0">{formatRelativeTime(chat.updated_at)}</span>
                                            </div>
                                            <p className={`text-xs truncate ${chat.unread_count > 0 ? 'text-primary-400 font-medium' : 'text-dark-400'}`}>{chat.listing?.title || 'Chat'}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-dark-400 text-sm">No conversations yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={`flex-1 flex flex-col bg-dark-900/20 ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                        {selectedConvId && currentConv ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-dark-900/40">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setSelectedConvId(null)} className="md:hidden p-2 -ml-2 text-dark-400">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                                            {currentConv.other_party.avatar_url ? (
                                                <Image src={currentConv.other_party.avatar_url} alt={currentConv.other_party.full_name} width={40} height={40} className="rounded-xl" />
                                            ) : (
                                                currentConv.other_party.full_name[0].toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-white font-bold leading-none mb-1">{currentConv.other_party.full_name}</h2>
                                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Online</p>
                                        </div>
                                    </div>
                                    <Link href={`/listing/${currentConv.listing_id}`} className="text-xs font-bold text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-lg hover:bg-primary-500/20 transition-all">
                                        View Listing
                                    </Link>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl flex items-start gap-3 mb-8">
                                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-200/60 italic leading-relaxed">
                                            ⚠️ Safety First: Never share OTPs or personal financial details. Meet in public campus areas for the exchange.
                                        </p>
                                    </div>

                                    {isLoadingMsgs ? (
                                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isMe = msg.sender_id === user?.id
                                            return (
                                                <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isMe
                                                        ? 'bg-primary-500 text-white rounded-tr-none shadow-lg shadow-primary-500/20'
                                                        : 'bg-white/5 border border-white/5 text-dark-200 rounded-tl-none'
                                                        }`}>
                                                        {msg.content}
                                                        <div className={`text-[9px] mt-1 font-bold uppercase opacity-50 ${isMe ? 'text-right' : ''}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-white/5 bg-dark-900/40">
                                    <form onSubmit={handleSendMessage} className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Write a message..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary-500 transition-colors outline-none"
                                        />
                                        <button
                                            disabled={isSending || !newMessage.trim()}
                                            className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                                    <Send className="w-10 h-10 text-dark-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Your private space to chat</h2>
                                <p className="text-dark-400 max-w-sm">Select a conversation from the left to start chatting with buyers and sellers.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
