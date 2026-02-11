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
    const isMountedRef = useRef(true)
    const convRequestCountRef = useRef(0)
    const msgRequestCountRef = useRef(0)

    // Handle mount/unmount
    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    const fetchConversations = useCallback(async () => {
        if (!user) return
        const currentReqId = ++convRequestCountRef.current
        setIsLoadingConvs(true)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            if (isMountedRef.current && convRequestCountRef.current === currentReqId) {
                controller.abort()
                setIsLoadingConvs(false)
                console.warn('Conversations fetch timed out')
            }
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
            if (!isMountedRef.current || convRequestCountRef.current !== currentReqId) return

            // Fetch unread counts... (rest of logic)
            const convIds = data.map((c: { id: string }) => c.id)

            let unreadCounts: Record<string, number> = {}
            if (convIds.length > 0) {
                const { data: unreadData } = await supabase
                    .from('messages')
                    .select('conversation_id')
                    .in('conversation_id', convIds)
                    .neq('sender_id', user.id)
                    .eq('is_read', false)
                    .abortSignal(controller.signal)

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
            if (!isMountedRef.current || convRequestCountRef.current !== currentReqId) return
            if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return
            console.error('Error fetching conversations:', err)
        } finally {
            clearTimeout(timeoutId)
            if (isMountedRef.current && convRequestCountRef.current === currentReqId) {
                setIsLoadingConvs(false)
            }
        }
    }, [user, supabase])

    const fetchMessages = useCallback(async (convId: string) => {
        const currentReqId = ++msgRequestCountRef.current
        setIsLoadingMsgs(true)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            if (isMountedRef.current && msgRequestCountRef.current === currentReqId) {
                controller.abort()
                setIsLoadingMsgs(false)
                console.warn('Messages fetch timed out')
            }
        }, 10000)

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true })
                .limit(100)
                .abortSignal(controller.signal)

            if (error) throw error
            if (!isMountedRef.current || msgRequestCountRef.current !== currentReqId) return

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
                        .abortSignal(controller.signal)
                }
            }
        } catch (err: any) {
            if (!isMountedRef.current || msgRequestCountRef.current !== currentReqId) return
            if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return
            console.error('Error fetching messages:', err)
        } finally {
            clearTimeout(timeoutId)
            if (isMountedRef.current && msgRequestCountRef.current === currentReqId) {
                setIsLoadingMsgs(false)
            }
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
            <div className="min-h-screen bg-surface-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-primary-500" />
                </div>
                <h1 className="text-3xl font-black text-surface-900 mb-4">You need to be logged in</h1>
                <p className="text-surface-600 mb-8 max-w-sm">Please log in to your account to view your messages and chat with others.</p>
                <div className="flex gap-4">
                    <Link href="/login" className="btn-primary px-8">Log In</Link>
                    <Link href="/" className="btn-secondary px-8">Home</Link>
                </div>
            </div>
        )
    }

    const currentConv = conversations.find(c => c.id === selectedConvId)

    return (
        <div className="h-screen bg-surface-50 flex flex-col overflow-hidden">
            <Header />

            <main className="flex-1 pt-20 md:pt-28 md:pb-4 md:px-4 overflow-hidden flex items-stretch h-dvh">
                <div className="max-w-7xl mx-auto w-full flex h-full premium-card overflow-hidden md:rounded-2xl rounded-none border-x-0 md:border">
                    {/* Chat Sidebar */}
                    <div className={`w-full md:w-80 border-r border-surface-100 flex flex-col ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-surface-100">
                            <h1 className="text-xl font-black text-surface-900 mb-4">Messages</h1>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    className="w-full bg-surface-50 border border-surface-200 rounded-xl pl-10 pr-4 py-2 text-sm text-surface-900 focus:border-primary-500 transition-colors outline-none"
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
                                        className={`w-full p-4 flex gap-3 items-center hover:bg-primary-50/50 transition-colors border-b border-surface-100 ${selectedConvId === chat.id ? 'bg-primary-50' : ''} ${chat.unread_count > 0 ? 'bg-primary-100/30' : ''}`}
                                    >
                                        <div className="relative shrink-0">
                                            {chat.other_party.avatar_url ? (
                                                <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-sm shrink-0">
                                                    <Image src={chat.other_party.avatar_url} alt={chat.other_party.full_name} fill className="object-cover" sizes="48px" />
                                                </div>
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
                                                <span className={`font-black truncate ${chat.unread_count > 0 ? 'text-surface-900' : 'text-surface-900'}`}>{chat.other_party.full_name}</span>
                                                <span className="text-[10px] text-surface-500 uppercase font-bold shrink-0">{formatRelativeTime(chat.updated_at)}</span>
                                            </div>
                                            <p className={`text-xs truncate ${chat.unread_count > 0 ? 'text-primary-600 font-bold' : 'text-surface-600'}`}>{chat.listing?.title || 'Chat'}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-surface-400 text-sm font-bold">No conversations yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={`flex-1 flex flex-col bg-white ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                        {selectedConvId && currentConv ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-2.5 md:p-4 border-b border-surface-100 flex justify-between items-center bg-white">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setSelectedConvId(null)} className="md:hidden p-2 -ml-2 text-surface-400">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden shrink-0 shadow-sm">
                                            {currentConv.other_party.avatar_url ? (
                                                <Image src={currentConv.other_party.avatar_url} alt={currentConv.other_party.full_name} fill className="object-cover" sizes="40px" />
                                            ) : (
                                                currentConv.other_party.full_name[0].toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-surface-900 font-black leading-none mb-1">{currentConv.other_party.full_name}</h2>
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online</p>
                                        </div>
                                    </div>
                                    <Link href={`/listing/${currentConv.listing_id}`} className="text-[10px] md:text-xs font-bold text-primary-400 bg-primary-500/10 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-primary-500/20 transition-all shrink-0">
                                        View Listing
                                    </Link>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 p-2.5 md:p-6 overflow-y-auto flex flex-col">
                                    <div className="bg-red-50 border border-red-100 p-2.5 md:p-3 rounded-2xl flex items-start gap-2 md:gap-3 mb-4">
                                        <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-[9px] md:text-xs text-red-800 font-bold italic leading-relaxed">
                                            ⚠️ Safety: Never share OTPs or financial details. Meet in public places.
                                        </p>
                                    </div>

                                    {/* Vertical Spacer to push messages to bottom */}
                                    {!isLoadingMsgs && messages.length > 0 && <div className="flex-1" />}

                                    {isLoadingMsgs ? (
                                        <div className="flex justify-center py-8 flex-1 items-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                                    ) : (
                                        <div className="space-y-3 md:space-y-4">
                                            {messages.map((msg, idx) => {
                                                const isMe = msg.sender_id === user?.id
                                                return (
                                                    <div key={msg.id} className={`flex gap-2.5 md:gap-3 max-w-[85%] md:max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                                        <div className={`p-2.5 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${isMe
                                                            ? 'bg-primary-600 text-white rounded-tr-none shadow-md md:shadow-lg shadow-primary-500/20'
                                                            : 'bg-surface-100 border border-surface-200 text-surface-800 rounded-tl-none'
                                                            }`}>
                                                            {msg.content}
                                                            <div className={`text-[8px] md:text-[9px] mt-1 font-bold uppercase opacity-50 ${isMe ? 'text-right' : ''}`}>
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} className="pt-2" />
                                </div>

                                {/* Input Area */}
                                <div className="p-2.5 md:p-4 border-t border-surface-100 bg-white">
                                    <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Message..."
                                            className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm text-surface-900 focus:border-primary-500 transition-colors outline-none"
                                        />
                                        <button
                                            disabled={isSending || !newMessage.trim()}
                                            className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shrink-0 shadow-lg shadow-primary-500/20"
                                        >
                                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-50">
                                <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mb-6">
                                    <Send className="w-10 h-10 text-surface-300" />
                                </div>
                                <h2 className="text-2xl font-black text-surface-900 mb-2">Your private space to chat</h2>
                                <p className="text-surface-600 max-w-sm font-medium">Select a conversation from the left to start chatting with buyers and sellers.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
