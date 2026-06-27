import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useGroups, useUserGroups, useGroupMembers } from "@/hooks/use-api";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Users,
  Crown,
  X,
  User,
} from "lucide-react";

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
  groupId?: number;
  groupName?: string;
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  managerId: number;
  createdAt: Date;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  
  const { data: managerGroups } = user?.role === "manager" || user?.role === "admin" 
    ? useGroups() 
    : { data: undefined };
  const { data: refereeGroups } = user?.role === "referee" 
    ? useUserGroups() 
    : { data: undefined };
  const { data: members } = useGroupMembers(selectedGroup?.id || 0);
    
  const allGroups = (managerGroups || refereeGroups || []) as Group[];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }

    // Auto-select first group if available
    if (allGroups.length > 0 && !selectedGroup) {
      setSelectedGroup(allGroups[0]);
    }

    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [user, selectedGroup]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!selectedGroup) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/chat`, { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Lỗi gửi tin nhắn", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isMe = (senderId: number) => user?.id === senderId;

  if (loading) {
    return (
      <div className="flex items-center justify-center max-h-[90vh] bg-background pb-3">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  if (allGroups.length === 0) {
    return (
      <div className="flex flex-col max-h-[90vh] bg-background pb-3">
        <div className="bg-card border-b border-border px-3 py-2 flex items-center gap-2 flex-shrink-0 transition-colors">
          <button onClick={() => setLocation("/profile")} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="font-medium text-foreground text-sm">Chat Nhóm</div>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>Bạn chưa tham gia nhóm nào</p>
            <p className="text-sm mt-1">Liên hệ Manager để được thêm vào nhóm</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[90vh] bg-background pb-3">
      {/* Header */}
      <div className="bg-card border-b border-border px-3 py-2 flex items-center gap-2 flex-shrink-0 transition-colors">
        <button onClick={() => setLocation("/profile")} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        
        {/* Group Name - no dropdown */}
        <div className="flex-1 font-medium text-foreground text-sm truncate">
          {selectedGroup?.name || "Chat Nhóm"}
        </div>
        
        {/* Members button */}
        <button 
          onClick={() => setShowMembers(!showMembers)} 
          className="p-1.5 hover:bg-accent rounded-lg transition-colors"
        >
          <Users className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Members list */}
      {showMembers && selectedGroup && (
        <div className="bg-card border-b border-border px-3 py-2 flex-shrink-0 overflow-y-auto max-h-32 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Thành viên ({members?.length || 0})</span>
            <button onClick={() => setShowMembers(false)} className="p-1">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {members?.map((m) => (
              <div key={m.id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-foreground">{m.user.fullName || m.user.username}</span>
                {m.role === "admin" && <Crown className="w-3 h-3 text-orange-500" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Chưa có tin nhắn nào</p>
            <p className="text-xs">Hãy gửi tin nhắn đầu tiên!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${isMe(msg.senderId) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[70%] md:max-w-[60%] ${
                  isMe(msg.senderId) ? "order-2" : "order-1"
                }`}
              >
                {!isMe(msg.senderId) && (
                  <div className="flex items-center gap-2 mb-1">
                    {msg.senderRole === "manager" && (
                      <Crown className="w-3 h-3 text-orange-500" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                      {msg.senderName}
                      {msg.senderRole === "manager" && (
                        <span className="text-orange-500 ml-1">(QL)</span>
                      )}
                    </span>
                  </div>
                )}
                <div
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl text-sm sm:text-base ${
                    isMe(msg.senderId)
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-card text-foreground rounded-bl-md shadow-sm border border-border"
                  }`}
                >
                  <p className="break-words">{msg.message}</p>
                </div>
                <div
                  className={`text-[10px] sm:text-xs text-muted-foreground mt-1 ${
                    isMe(msg.senderId) ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - cố định ở dưới, trên BottomNav */}
      <form onSubmit={handleSend} className="bg-card border-t border-border p-3 flex-shrink-0 pb-0 transition-colors">
        <div className="flex gap-2">
          <input
            id="message-input"
            name="message"
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !selectedGroup}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
