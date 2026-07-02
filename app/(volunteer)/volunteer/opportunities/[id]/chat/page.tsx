'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { haptic } from '@/lib/haptic';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

export default function OpportunityChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['chat', id],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/chat/${id}?page=${pageParam}&limit=50`).then((r) => r.data),
    getNextPageParam: (last) => {
      const totalPages = Math.ceil(last.total / last.limit);
      return last.page < totalPages ? last.page + 1 : undefined;
    },
    initialPageParam: 1,
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const allMessages = data?.pages.flatMap((p) => p.data) ?? [];

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post(`/chat/${id}`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', id] });
      setInput('');
      haptic.light();
    },
    onError: () => {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMutation.mutate(input.trim());
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && allMessages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages.length, autoScroll]);

  // Track scroll position to toggle auto-scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-brand-surface rounded-t-2xl">
        <Link
          href={`/volunteer/opportunities/${id}`}
          onClick={() => haptic.light()}
          className="cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-brand-muted hover:text-brand-text" />
        </Link>
        <MessageCircle className="w-5 h-5 text-brand" />
        <h1 className="font-heading font-semibold text-sm text-brand-text">Discussion</h1>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-brand-surface/50"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-10 h-10 text-brand-muted/40 mb-3" />
            <p className="text-sm text-brand-muted">No messages yet.</p>
            <p className="text-xs text-brand-muted/60 mt-1">
              Be the first to start a conversation!
            </p>
          </div>
        ) : (
          <>
            {hasNextPage && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  loading={isFetchingNextPage}
                >
                  Load earlier messages
                </Button>
              </div>
            )}
            {allMessages.map((msg: Message) => {
              const isMe = msg.user.id === user?.id;
              const time = new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-brand text-white rounded-br-md'
                        : 'bg-muted text-brand-text rounded-bl-md'
                    }`}
                  >
                    {!isMe && (
                      <p className="text-[10px] font-semibold text-brand-muted mb-0.5">
                        {msg.user.name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-0.5 text-right ${
                        isMe ? 'text-white/60' : 'text-brand-muted/60'
                      }`}
                    >
                      {time}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 p-4 border-t border-brand-border bg-brand-surface rounded-b-2xl">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          rows={1}
          maxLength={2000}
          className="flex-1 rounded-xl border border-brand-border bg-background px-4 py-2.5 text-sm
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none max-h-32"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sendMutation.isPending}
          loading={sendMutation.isPending}
          size="icon"
          className="h-10 w-10 rounded-xl flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
