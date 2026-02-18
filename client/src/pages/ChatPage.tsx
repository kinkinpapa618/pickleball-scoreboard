import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Users,
  Crown,
} from "lucide-react";

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }

    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
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
    if (!newMessage.trim()) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <button onClick={() => setLocation("/profile")} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-slate-900">Nhóm Chat</h1>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
          <Users className="w-4 h-4" />
          <span>Manager & Referees</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
            <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 mb-3 opacity-30" />
            <p className="text-sm sm:text-base">Chưa có tin nhắn nào</p>
            <p className="text-xs sm:text-sm">Hãy gửi tin nhắn đầu tiên!</p>
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
                    <span className="text-xs font-medium text-slate-600">
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
                      : "bg-white text-slate-900 rounded-bl-md shadow-sm border border-slate-100"
                  }`}
                >
                  <p className="break-words">{msg.message}</p>
                </div>
                <div
                  className={`text-[10px] sm:text-xs text-slate-400 mt-1 ${
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

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t border-slate-200 p-3 sm:p-4 flex-shrink-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 sm:py-3 text-sm sm:text-base text-slate-900 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white p-2 sm:p-3 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </form>
    </div>
  );
}
