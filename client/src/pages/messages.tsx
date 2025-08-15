import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Search, Edit, Phone, Video, Send, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";
import { UserNameWithBadge } from "@/components/ui/user-name-with-badge";
import type { User } from "@shared/schema";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    badgeImageUrl?: string;
    isOnline?: boolean;
  };
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  lastMessageAt: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    badgeImageUrl?: string;
  };
}

export default function MessagesPage() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Extract conversation ID from URL params
  const [path, search] = location.split('?');
  const urlParams = new URLSearchParams(search || '');
  const selectedConversationId = urlParams.get('conversation');

  const handleSelectConversation = (conversationId: string) => {
    navigate(`/messages?conversation=${conversationId}`);
  };

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", selectedConversationId, "messages"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && selectedConversationId) {
      sendMessage.mutate(messageText.trim());
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Tin nhắn</h1>
          <p className="text-gray-400">
            Trò chuyện với bạn bè và gia đình
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-xl shadow-xl border border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Cuộc trò chuyện</h2>
                <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                  <Edit className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin nhắn..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {conversations.length === 0 ? (
                <div className="text-center p-8">
                  <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Bắt đầu trò chuyện với bạn bè
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversationId === conversation.id
                          ? "bg-blue-600/20 border-l-4 border-blue-500"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={() => handleSelectConversation(conversation.id)}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <div className="relative">
                        <img
                          src={conversation.otherUser.profileImage || "/default-avatar.jpg"}
                          alt={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                          className="w-12 h-12 rounded-full border-2 border-gray-600"
                        />
                        {conversation.otherUser.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          <UserNameWithBadge 
                            firstName={conversation.otherUser.firstName}
                            lastName={conversation.otherUser.lastName}
                            badgeImageUrl={conversation.otherUser.badgeImageUrl}
                          />
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-400 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <div className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">Chọn một cuộc trò chuyện</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedConversation.otherUser.profileImage || "/default-avatar.jpg"}
                      alt={`${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
                      className="w-10 h-10 rounded-full border-2 border-gray-600"
                    />
                    <div>
                      <h3 className="font-medium text-white">
                        <UserNameWithBadge 
                          firstName={selectedConversation.otherUser.firstName}
                          lastName={selectedConversation.otherUser.lastName}
                          badgeImageUrl={selectedConversation.otherUser.badgeImageUrl}
                        />
                      </h3>
                      <p className="text-sm text-gray-400">
                        {selectedConversation.otherUser.isOnline ? "Đang online" : "Offline"}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Chưa có tin nhắn nào</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Gửi tin nhắn để bắt đầu cuộc trò chuyện
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender.id === user.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              message.sender.id === user.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-white"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender.id === user.id ? "text-blue-100" : "text-gray-400"
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <form onSubmit={handleSendMessage} className="flex space-x-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-sm"
                      data-testid="input-message"
                    />
                    <Button
                      type="submit"
                      disabled={!messageText.trim() || sendMessage.isPending}
                      className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 py-3 text-white"
                      data-testid="button-send-message"
                    >
                      {sendMessage.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Create New Chat FAB */}
        <div className="fixed bottom-6 right-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors">
            <Edit className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}