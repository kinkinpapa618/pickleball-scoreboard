import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Crown, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: window.innerHeight - 120 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadId, setLastReadId] = useState(() => {
    const saved = localStorage.getItem("chat_last_read_id");
    return saved ? parseInt(saved) : 0;
  });
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const savedLastReadId = parseInt(localStorage.getItem("chat_last_read_id") || "0");
      setLastReadId(savedLastReadId);
      
      if (!isOpen) {
        const newUnread = messages.filter(m => m.id > savedLastReadId).length;
        setUnreadCount(newUnread);
      }
    }
  }, [messages, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/chat", { credentials: "same-origin" });
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    setPosition(prev => ({
      x: Math.max(0, Math.min(prev.x + deltaX, window.innerWidth - 60)),
      y: Math.max(0, Math.min(prev.y + deltaY, window.innerHeight - 60))
    }));
    setDragStart({ x: clientX, y: clientY });
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <>
      {/* Floating Icon */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="fixed z-[100] cursor-move touch-none"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
            if (messages.length > 0) {
              const latestId = Math.max(...messages.map(m => m.id));
              setLastReadId(latestId);
              localStorage.setItem("chat_last_read_id", latestId.toString());
            }
          }}
          className="w-14 h-14 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:bg-blue-600 transition-colors relative"
        >
          <MessageCircle className="w-7 h-7" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-[101] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-colors"
          style={{
            left: "5%",
            top: "20%",
            width: "90%",
            maxWidth: "500px",
            height: "60%",
            maxHeight: "600px",
          }}
        >
          {/* Header */}
          <div className="bg-blue-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">Chat nhóm</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Chưa có tin nhắn</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = user?.id === msg.senderId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] ${isMe ? "order-2" : "order-1"}`}>
                      {!isMe && (
                        <div className="flex items-center gap-2 mb-1">
                          {msg.senderRole === "manager" ? (
                            <Crown className="w-4 h-4 text-orange-500" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
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
                        className={`px-3 py-2 rounded-2xl ${
                          isMe
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-card text-foreground rounded-bl-md shadow-sm border border-border"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                      <div
                        className={`text-[10px] text-muted-foreground mt-1 ${
                          isMe ? "text-right" : "text-left"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="bg-card border-t border-border p-3 flex-shrink-0 transition-colors"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
