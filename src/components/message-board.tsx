
"use client";
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { useCollection } from '@/firebase/firestore/hooks';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Message } from '@/lib/types';
import { users as staticUsers } from '@/lib/data';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export function MessageBoard({ bookingId }: { bookingId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const messagesPath = `bookings/${bookingId}/messages`;
  const { data: messages, isLoading } = useCollection<Message>(messagesPath);

  const sortedMessages = (messages || [])
    .filter(msg => msg.createdAt)
    .sort((a,b) => a.createdAt.seconds - b.createdAt.seconds);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);
  

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !firestore) return;

    setIsSending(true);
    
    try {
      const messageData: Omit<Message, 'id' | 'createdAt'> & { createdAt: any } = {
        text: newMessage.trim(),
        senderId: user.id,
        senderName: user.name,
        bookingId: bookingId,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(firestore, messagesPath), messageData);
      
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
      toast({
        variant: 'destructive',
        title: "Error sending message",
        description: (error as Error).message || "An unknown error occurred."
      })
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      <CardHeader>
        <CardTitle>Message Board</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {isLoading && <p>Loading messages...</p>}
            {!isLoading && sortedMessages.length === 0 && (
                <div className="text-center text-muted-foreground pt-8">No messages yet. Start the conversation!</div>
            )}
            {sortedMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${msg.senderId === user?.id ? 'justify-end' : ''}`}
              >
                {msg.senderId !== user?.id && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={(staticUsers.find(u => u.id === msg.senderId) || {}).avatarUrl} />
                        <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                <div className={`flex flex-col gap-1 ${msg.senderId === user?.id ? 'items-end' : ''}`}>
                    <div
                      className={`max-w-xs rounded-lg p-3 text-sm ${
                          msg.senderId === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.imageUrl && (
                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                          <Image src={msg.imageUrl} alt="attached image" width={200} height={200} className="rounded-md mb-2 max-w-full h-auto" />
                        </a>
                      )}
                      {msg.text && <p>{msg.text}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {msg.senderName} - {msg.createdAt ? format(msg.createdAt.toDate(), 'p') : ''}
                    </span>
                </div>
                 {msg.senderId === user?.id && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            disabled={isSending}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
