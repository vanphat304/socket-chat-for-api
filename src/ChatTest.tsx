import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { Conversation, Message } from "./chat";
import type { Socket } from "socket.io-client";
import MatchingModal from "./MatchingModal";
import SubscriptionModal from "./SubscriptionModal";
import "./MatchingModal.css";
import "./SubscriptionModal.css";
import MatchDecisionModal from "./MatchDecisionModal";
import { API_URL, API_URL_SOCKET, ChatSocketEvent } from "./config";
import IcebreakerModal from "./IcebreakerModal";

interface MatchedUser {
  id: number;
  email: string;
  lastName: string;
  avatar: string;
  age: number;
  height: number;
  city: string;
  countryCode: string;
  universityName: string;
  commonHobbiesCount: number;
  commonHobbies: string[];
  matchScore: number;
  distance: number;
}

interface MatchFoundData {
  conversationId: number;
  matchedUser: MatchedUser;
  remainingMatches: number;
}

const ChatTest: React.FC = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<any | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isFirstChatModalOpen, setIsFirstChatModalOpen] = useState(false);
  const [isMatchDecisionModalOpen, setIsMatchDecisionModalOpen] =
    useState(false);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isIcebreakerModalOpen, setIsIcebreakerModalOpen] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    console.log("Initializing socket connection...");
    if (!token || !user) return;

    const newSocket = io(API_URL_SOCKET, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      query: {
        conversationId: selectedConversation?.id,
      },
    } as any);

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    newSocket.on(ChatSocketEvent.NEW_MESSAGE, (message: Message) => {
      console.log("New message received:", message);
      if (selectedConversation?.id === message.conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    newSocket.on(ChatSocketEvent.USER_JOINED_CONVERSATION, (data) => {
      console.log("User joined conversation:", data);
      if (selectedConversation?.id === data.conversationId) {
        const fetchMessages = async () => {
          try {
            const response = await fetch(
              `${API_URL}/chat/conversations/${data.conversationId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const responseData = await response.json();
            const sortedMessages = (responseData.messages || []).sort(
              (a: Message, b: Message) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            setMessages(sortedMessages);
          } catch (error) {
            console.error("Error fetching messages:", error);
          }
        };
        fetchMessages();
      }
    });

    newSocket.on(ChatSocketEvent.PARTNER_OUT_IN_FIRST_CHAT, (data) => {
      console.log("Partner out in first chat:", data);
      
      // Show message to user
      alert(data.message || 'Your partner does not want to continue chat with you');
      
      // Close modals
      setIsFirstChatModalOpen(false);
      setIsMatchDecisionModalOpen(false);
      
      // Fetch updated conversations list
      const fetchConversations = async () => {
        try {
          const response = await fetch(`${API_URL}/chat/conversations`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const responseData = await response.json();
          const sortedConversations = responseData.data.sort((a: Conversation, b: Conversation) => {
            const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt).getTime();
            const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt).getTime();
            return timeA - timeB;
          });
          setConversations(sortedConversations);
        } catch (error) {
          console.error("Error fetching conversations:", error);
        }
      };
      
      fetchConversations();
    });

    newSocket.on(ChatSocketEvent.NEW_MESSAGE_NOTIFICATION, (notification) => {
      console.log("New notification:", notification);
      setNotifications((prev) => [...prev, notification]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === notification.conversationId
            ? {
                ...conv,
                unreadCount: notification.unreadCount,
                lastMessage: notification.message,
              }
            : conv
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, selectedConversation?.id]);

  // Fetch conversations

  const markMessagesAsRead = async (conversationId: number) => {
    try {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    markMessagesAsRead(conversation.id);
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`${API_URL}/chat/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log("Conversations:", data);
        // Sort conversations by last message time, newest at bottom
        const sortedConversations = data.data.sort((a: Conversation, b: Conversation) => {
          const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt).getTime();
          const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt).getTime();
          return timeA - timeB; // Oldest first, newest last
        });
        setConversations(sortedConversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Update the scroll behavior
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update message fetching
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !token) return;

      try {
        const response = await fetch(
          `${API_URL}/chat/conversations/${selectedConversation.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        // Sort messages in reverse chronological order (oldest to newest)
        const sortedMessages = (data.messages || []).sort(
          (a: Message, b: Message) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).reverse(); // Reverse to show oldest at top, newest at bottom

        setMessages(sortedMessages);
        setCurrentConversation(data);

        if (data.chatStatus === "FIRST_CHAT") {
          setIsFirstChatModalOpen(true);
          setTimeout(() => {
            setIsFirstChatModalOpen(false);
            setIsMatchDecisionModalOpen(true);
          }, 10000);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedConversation, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await fetch(API_URL+"/s3/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUploading(false);
      if (data.success && data.fileUrl) {
        return data.fileUrl;
      }
      return null;
    } catch (error) {
      setUploading(false);
      console.error("File upload error:", error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!socket || !selectedConversation || (!newMessage.trim() && !file))
      return;
    let fileUrl: string | null = null;
    let filetype: string | null = null;
    
    if (file) {
      const uploadedFileUrl = await uploadFile(file);
      if (!uploadedFileUrl) return;
      fileUrl = uploadedFileUrl;
      if (file.type.startsWith("image/")) filetype = "image";
      else if (file.type.startsWith("video/")) filetype = "video";
      else if (file.type === "application/pdf") filetype = "pdf";
      else filetype = "file";
    }

    try {
      await socket.emit("sendMessage", {
        conversationId: selectedConversation.id,
        content: newMessage,
        fileUrl,
        filetype,
      });
      
      setNewMessage("");
      setFile(null);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleOutInFirstChat = async () => {
    if (!currentConversation || !token) return;

    try {
      // First emit the socket event
      socket?.emit(ChatSocketEvent.OUT_IN_FIRST_CHAT, {
        conversationId: currentConversation.id
      });

      // Close modals immediately
      setIsFirstChatModalOpen(false);
      setIsMatchDecisionModalOpen(false);

      // Wait for 1 second before fetching updated data
      setTimeout(async () => {
        try {
          const response = await fetch(`${API_URL}/chat/conversations`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const responseData = await response.json();
          const sortedConversations = responseData.data.sort((a: Conversation, b: Conversation) => {
            const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt).getTime();
            const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt).getTime();
            return timeA - timeB;
          });
          setConversations(sortedConversations);
        } catch (error) {
          console.error("Error fetching conversations:", error);
        }
      }, 1000);

    } catch (error) {
      console.error("Error sending out in first chat:", error);
    }
  };

  const handleMatchFound = async (data: MatchFoundData) => {
    // Update remaining matches in the user object
    if (user) {
      user.remainingMatchesToday = data.remainingMatches;
    }

    // Fetch the new conversation
    try {
      const response = await fetch(
        `${API_URL}/chat/conversations/${data.conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const conversationData = await response.json();

      // Add the new conversation to the list
      setConversations((prev) => {
        const exists = prev.some((conv) => conv.id === data.conversationId);
        if (!exists) {
          return [...prev, conversationData];
        }
        return prev;
      });

      // Select the new conversation
      setSelectedConversation(conversationData);
    } catch (error) {
      console.error("Error fetching new conversation:", error);
    }
  };

  const handleMatchDecision = async (isMatch: boolean) => {
    if (!currentConversation || !token) return;

    try {
      await fetch(`${API_URL}/chat/confirm-match/${currentConversation.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isMatch }),
      });

      setIsMatchDecisionModalOpen(false);
    } catch (error) {
      console.error("Error sending match decision:", error);
    }
  };

  return (
    <div className="chat-test-container">
      <div className="conversations-list">
        <div className="conversations-header">
          <div className="header-top">
            <h2>Conversations</h2>
            <div className="header-buttons">
              <button
                className="find-match-button"
                onClick={() => setIsMatchingModalOpen(true)}
              >
                Find Match
              </button>
              <button
                className="subscription-button"
                onClick={() => setIsSubscriptionModalOpen(true)}
              >
                Subscription
              </button>
            </div>
          </div>
          <div className="matching-info">
            <div className="matching-stats">
              <span className="stat-label">Matches Today:</span>
              <span className="stat-value">
                {user?.numberOfMatchesToday || 0}/
                {user?.subscription.tier === "PREMIUM"
                  ? "UNLIMITED"
                  : user?.maxMatchesPerDay || 0}
              </span>
            </div>
            <div className="matching-stats">
              <span className="stat-label">Remaining:</span>
              <span className="stat-value">
                {user?.subscription.tier === "PREMIUM"
                  ? "UNLIMITED"
                  : user?.remainingMatchesToday || 0}
              </span>
            </div>
          </div>
        </div>
        {conversations.map((conv) => {
          const otherParticipant = conv.participants.find(p => p.id !== user?.id);
          return (
            <div
              key={conv.id}
              className={`conversation-item ${
                selectedConversation?.id === conv.id ? "selected" : ""
              }`}
              onClick={() => handleConversationClick(conv)}
            >
              <div className="conversation-info">
                <div className="conversation-user">
                  {otherParticipant?.avatar && (
                    <img 
                      src={otherParticipant.avatar} 
                      alt={otherParticipant.firstName}
                      className="user-avatar" 
                    />
                  )}
                  <span className="conversation-name">
                    {otherParticipant?.firstName || "Unknown"}
                  </span>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="unread-count">{conv.unreadCount}</span>
                )}
              </div>
              <div className="last-message">
                <span className="message-content">
                  {conv.lastMessage?.content || "No messages"}
                </span>
                <span className="message-time">
                  {conv.lastMessage && new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedConversation ? (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-content">
              <h3>
                Chat with{" "}
                {selectedConversation.participants.find(
                  (p) => p.id !== user?.id
                )?.firstName || "Unknown"}
              </h3>
              <button 
                className="icebreaker-button"
                onClick={() => setIsIcebreakerModalOpen(true)}
              >
                Icebreaker Questions
              </button>
            </div>
          </div>
          <div className="messages-container">
            <div className="messages">
              {messages.map((message) => {
                const isSent = message.senderId === user?.id;
                const otherParticipant = selectedConversation.participants.find(
                  p => p.id !== user?.id
                );
                const senderName = isSent ? user?.firstName : otherParticipant?.firstName;

                return (
                  <div
                    key={message.id}
                    className={`message ${isSent ? 'sent' : 'received'}`}
                  >
                    <div className="message-sender">
                      {senderName}
                    </div>
                    <div className="message-bubble">
                      <div className="message-content">
                        {message.content}
                        {message.fileUrl && (
                          <div className="message-file">
                            {message.filetype === 'image' ? (
                              <img src={message.fileUrl} alt="Shared file" />
                            ) : (
                              <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                                View File
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isSent && (
                        <span className="read-status">
                          {message.isRead ? '✓✓' : '✓'}
                          {message.readAt && (
                            <span className="read-time">
                              Read at {new Date(message.readAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={uploading}
            />
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ marginLeft: 8, width: "80px" }}
            />
            <button onClick={handleSendMessage} disabled={uploading}>
              {uploading ? "Uploading..." : `Send by ${user?.firstName}`}
            </button>
            {file && <span style={{ marginLeft: 8 }}>{file.name}</span>}
          </div>
        </div>
      ) : (
        <div className="no-conversation-selected">
          <p>Select a conversation to start chatting</p>
        </div>
      )}

      {isMatchingModalOpen && (
        <MatchingModal
          isOpen={true}
          onClose={() => setIsMatchingModalOpen(false)}
          onMatchFound={handleMatchFound}
        />
      )}

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {isFirstChatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>New Match!</h2>
            <p>You have just matched with someone. Start your conversation!</p>
          </div>
        </div>
      )}

      <MatchDecisionModal
        isOpen={isMatchDecisionModalOpen}
        onClose={() => setIsMatchDecisionModalOpen(false)}
        onMatch={() => handleMatchDecision(true)}
        onPass={() => handleMatchDecision(false)}
        onOutInFirstChat={handleOutInFirstChat}
      />

      <IcebreakerModal
        isOpen={isIcebreakerModalOpen}
        onClose={() => setIsIcebreakerModalOpen(false)}
        socket={socket}
        conversationId={selectedConversation?.id || 0}
        userId={user?.id || 0}
      />
    </div>
  );
};

export default ChatTest;
