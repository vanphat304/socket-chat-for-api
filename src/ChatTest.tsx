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

  // Initialize socket connection
  useEffect(() => {
    console.log("Initializing socket connection...");
    if (!token || !user) return;

    console.log("Token:", token);
    console.log("User:", user);

    const newSocket = io(API_URL_SOCKET, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      query: {
        conversationId: selectedConversation?.id,
      },
    } as any);

    console.log("New socket:", newSocket);

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
        setMessages((prev) => [...prev, message]);
      }
    });

    newSocket.on("newMessageNotification", (notification) => {
      console.log("New notification:", notification);
      setNotifications((prev) => [...prev, notification]);
      // Update conversation unread count
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

    // newSocket.on('messageRead', (data) => {
    //   console.log('Message read:', data);
    //   if (selectedConversation?.id === data.conversationId) {
    //     setMessages(prev => prev.map(msg =>
    //       msg.id === data.messageId ? { ...msg, isRead: true } : msg
    //     ));
    //   }
    // });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, selectedConversation?.id]);

  // Fetch conversations

  const markAsRead = async (conversationId: number) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );

    try {
      await fetch(`${API_URL}/chat/conversations/${conversationId}/read`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
      });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
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
        setConversations(data.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Fetch messages when conversation is selected
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

        setMessages(data.messages || []);
        setCurrentConversation(data);

        // Check if this is a first chat
        if (data.chatStatus === "FIRST_CHAT") {
          setIsFirstChatModalOpen(true);

          // Show match decision modal after 10 seconds
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

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const response = await fetch("http://localhost:4000/v1/s3/upload", {
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
      if (!uploadedFileUrl) return; // Don't send if upload failed
      fileUrl = uploadedFileUrl;
      // Determine filetype (simple check)
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
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    if (!socket) return;

    try {
      await socket.emit("markAsRead", { messageId });
    } catch (error) {
      console.error("Error marking message as read:", error);
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
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${
              selectedConversation?.id === conv.id ? "selected" : ""
            }`}
            onClick={() => {
              setSelectedConversation(conv);
              markAsRead(conv.id);
            }}
          >
            <div className="conversation-info">
              <span className="conversation-name">
                {conv.participants?.find((p) => p.userId !== user?.id)?.user
                  ?.firstName || "Unknown"}
              </span>
              {conv.unreadCount > 0 && (
                <span className="unread-count">{conv.unreadCount}</span>
              )}
            </div>
            <div className="last-message">
              {conv.lastMessage?.content || "No messages"}
            </div>
          </div>
        ))}
      </div>

      {selectedConversation ? (
        <div className="chat-window">
          <div className="chat-header">
            <h3>
              Chat with{" "}
              {selectedConversation.participants?.find(
                (p) => p.userId !== user?.id
              )?.user.firstName || "Unknown"}
            </h3>
          </div>
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.senderId === user?.id ? "sent" : "received"
                }`}
                onMouseEnter={() =>
                  !message.isRead && handleMarkAsRead(message.id)
                }
              >
                <div className="message-content">
                  {message.content}
                  {/* Show file if present */}
                  {message.fileUrl && (
                    <img
                      src={message.fileUrl}
                      alt="sent file"
                      style={{ maxWidth: 200, display: "block", marginTop: 8 }}
                    />
                  )}
                </div>
                <div className="message-meta">
                  <span className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                  {message.senderId === user?.id && (
                    <span className="read-status">
                      {message.isRead ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
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
      />
    </div>
  );
};

export default ChatTest;
