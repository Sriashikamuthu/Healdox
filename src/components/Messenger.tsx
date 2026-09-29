import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ArrowLeft, Search, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Connection {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  otherParticipant?: Connection;
}

export default function Messenger() {

  const { user } = useAuth();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);


  const selectedConversationUser =
    conversations.find(
      (c) => c.id === selectedConversation
    )?.otherParticipant;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* =============================
    LOAD CONNECTIONS
  ============================= */

  useEffect(() => {

    if (!user) return;

    const init = async () => {

      // 🔥 Load connections first
      const connectionsData =
        await loadConnections();

      // 🔥 Pass fresh data directly
      await loadConversations(
        connectionsData
      );

    };

    init();

  }, [user]);

  /* =============================
    LOAD MESSAGES WHEN SELECTED
  ============================= */

  useEffect(() => {

    if (!selectedConversation) return;

    loadMessages(selectedConversation);

  }, [selectedConversation]);

  /* =============================
    AUTO SCROLL
  ============================= */

  const initialLoad = useRef(true);

  useEffect(() => {

    if (initialLoad.current) {

      initialLoad.current = false;
      return;

    }

    scrollToBottom();

  }, [messages]);

  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  };

  /* ==============================
    LOAD ACCEPTED CONNECTIONS
  ============================== */

  const loadConnections = async () => {

    if (!user) return [];

    try {

      const res = await fetch(
        `http://localhost:5000/connections/accepted/${user.id}`
      );

      const data = await res.json();

      const uniqueMap = new Map();

      data.forEach((c: any) => {

        const id =
          c.connected_user_id ||
          c.user_id ||
          c.id;

        if (!uniqueMap.has(id)) {

          uniqueMap.set(id, {

            id: id,

            full_name:
              c.full_name ||
              c.username ||
              c.name ||
              "Unknown",

            avatar_url:
              c.avatar_url || null,

            role:
              c.role || "user"

          });

        }

      });

      const uniqueConnections =
        Array.from(uniqueMap.values());

      setConnections(uniqueConnections);

      return uniqueConnections; // ⭐ CRITICAL

    }

    catch (err) {

      console.error(
        "Connections load error:",
        err
      );

      return [];

    }

  };

  /* ==============================
    LOAD CONVERSATIONS (FIXED)
  ============================== */

  const loadConversations = async (connectionsData: any[]) => {

    if (!user) return;

    try {

      const res = await fetch(
        `http://localhost:5000/conversations/${user.id}`
      );

      const data = await res.json();

      console.log("Conversations API:", data);

      const uniqueMap = new Map();

      data.forEach((c: any) => {

        if (!uniqueMap.has(c.conversation_id)) {

          uniqueMap.set(
            c.conversation_id,
            c
          );

        }

      });

      const uniqueData =
        Array.from(uniqueMap.values());

      const formatted =
        uniqueData.map((c: any) => {

        const ids =
          c.conversation_id.split("_");

        const otherUserId =
          ids[0] === user.id
            ? ids[1]
            : ids[0];

        const otherUser =
          connectionsData.find(
            (conn: any) =>
              String(conn.id) ===
              String(otherUserId)
          );

        return {

          id: c.conversation_id,

          otherParticipant:
            otherUser
              ? otherUser
              : {
                  id: otherUserId,
                  full_name: "Unknown",
                  avatar_url: null,
                  role: "user"
                }

        };

      });

      setConversations(formatted);

      if (formatted.length > 0) {

        setSelectedConversation(
          formatted[0].id
        );

      }

    }

    catch (err) {

      console.error(
        "Conversation load error:",
        err
      );

    }

    finally {

      setLoading(false);

    }

  };

  /* ==============================
     LOAD MESSAGES
  ============================== */

  const loadMessages = async (
    conversationId: string
  ) => {

    try {

      console.log(
        "Loading messages for:",
        conversationId
      );

      const res = await fetch(
        `http://localhost:5000/chats/${conversationId}`
      );

      const data = await res.json();

      console.log("Messages API:", data);

      const formatted = data.map(
        (msg: any) => ({

          id: msg.id,

          sender_id: msg.sender_id,

          content:
            msg.message ||
            msg.content,

          created_at:
            msg.created_at

        })
      );

      setMessages(formatted);

    }

    catch (err) {

      console.error(
        "Message load error:",
        err
      );

    }

  };

  /* ==============================
     SEND MESSAGE
  ============================== */

  const sendMessage = async (e?: React.FormEvent) => {

    if (e) e.preventDefault();

    if (!newMessage.trim()) return;

    if (!selectedConversation) {

      console.error(
        "No conversation selected"
      );

      return;

    }

    try {

      const res = await fetch(
        "http://localhost:5000/chat",
        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            message: newMessage,

            user_id: user.id,

            conversation_id:
              selectedConversation

          })

        }
      );

      if (!res.ok) {

        console.error("Send failed");

        return;

      }

      setNewMessage("");

      await loadMessages(
        selectedConversation
      );

    }

    catch (err) {

      console.error(
        "Send error:",
        err
      );

    }

  };

  /* ==============================
    START NEW CHAT — FIXED
  ============================== */

  const startNewConversation = async (connectionId: string) => {

    try {

      const res = await fetch(
        "http://localhost:5000/chat/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user1: user.id,
            user2: connectionId
          })
        }
      );

      const data = await res.json();

      const newConversationId =
        data.conversation_id;

      /* Find selected connection */

      const selectedUser =
        connections.find(
          (c) => c.id === connectionId
        );

      if (!selectedUser) return;

      /* Create conversation object manually */

      const newConversation = {

        id: newConversationId,

        otherParticipant: selectedUser

      };

      /* Add to left panel immediately */

      setConversations((prev) => [

        newConversation,

        ...prev

      ]);

      /* Select it */

      setSelectedConversation(
        newConversationId
      );

      setShowNewChat(false);

    }

    catch (err) {

      console.error(
        "Start chat error:",
        err
      );

    }

  };

  /* ==============================
     FILTER SEARCH
  ============================== */

  const filteredConnections = connections.filter(conn =>
    (conn.full_name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  /* ==============================
     LOADING UI
  ============================== */

  if (loading) {

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  }

  /* ==============================
     UI (UNCHANGED)
  ============================== */

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="w-full">

        <div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ height: 'calc(70vh - 2rem)' }}
        >

          <div className="flex h-full">

            {/* ================= LEFT PANEL ================= */}

            <div
              className={`${selectedConversation && 'hidden md:block'} 
              w-full md:w-80 
              border-r border-gray-200 
              flex flex-col`}
            >

              <div className="p-4 border-b">

                <div className="flex items-center justify-between mb-4">

                  <h2 className="text-xl font-bold text-gray-900">
                    Messages
                  </h2>

                  <button
                    onClick={() => setShowNewChat(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  >

                    <MessageCircle className="w-6 h-6" />

                  </button>

                </div>

              </div>

              {/* Conversation List */}

              <div className="flex-1 overflow-y-auto">

                {conversations.length === 0 ? (

                  <div className="p-8 text-center">

                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />

                    <p className="text-gray-500">
                      No conversations yet
                    </p>

                  </div>

                ) : (

                  conversations.map((conversation) => (

                    <button
                      key={conversation.id}
                      onClick={() =>
                        setSelectedConversation(conversation.id)
                      }
                      className="w-full p-3 border-b hover:bg-gray-50 text-left flex items-center gap-3"
                    >

                      {/* Avatar */}

                      <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">

                        {conversation.otherParticipant?.avatar_url ? (

                          <img
                            src={conversation.otherParticipant.avatar_url}
                            className="w-full h-full object-cover"
                          />

                        ) : (

                          <div className="flex items-center justify-center h-full text-white font-bold">

                            {conversation.otherParticipant?.full_name?.charAt(0) || "U"}

                          </div>

                        )}

                      </div>

                      {/* Username */}

                      <div className="font-medium">

                        {conversation.otherParticipant?.full_name || "User"}

                      </div>

                    </button>

                  ))

                )}

              </div>

            </div>

            {/* ================= RIGHT PANEL ================= */}

            <div className="flex-1 flex flex-col">

              {selectedConversation ? (

                <>

                  {/* Header */}

                  <div className="p-4 border-b flex items-center gap-3 bg-white">

                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">

                      {selectedConversationUser?.avatar_url ? (

                        <img
                          src={selectedConversationUser.avatar_url}
                          className="w-full h-full object-cover"
                        />

                      ) : (

                        <div className="flex items-center justify-center h-full text-white font-bold">

                          {selectedConversationUser?.full_name?.charAt(0) || "U"}

                        </div>

                      )}

                    </div>

                    <div className="font-semibold text-gray-900">

                      {selectedConversationUser?.full_name || "User"}

                    </div>

                  </div>

                  {/* Messages */}

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {messages.length === 0 ? (

                      <div className="text-center text-gray-400">

                        No messages yet

                      </div>

                    ) : (

                      messages.map((message) => (

                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >

                          <div
                            className={`px-4 py-2 rounded-2xl border max-w-xs ${
                              message.sender_id === user.id
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-900"
                            }`}
                          >

                            {message.content}

                          </div>

                        </div>

                      ))

                    )}

                    <div ref={messagesEndRef} />

                  </div>

                  {/* Input */}

                  <form
                    onSubmit={(e) => sendMessage(e)}
                    className="p-4 border-t bg-white"
                  >

                    <div className="flex space-x-2">

                      <input
                        value={newMessage}
                        onChange={(e) =>
                          setNewMessage(e.target.value)
                        }
                        placeholder="Type message..."
                        className="flex-1 px-4 py-2 border rounded-full"
                      />

                      <button
                        type="submit"
                        className="p-2 bg-blue-600 text-white rounded-full"
                      >

                        <Send className="w-5 h-5" />

                      </button>

                    </div>

                  </form>

                </>

              ) : (

                <div className="flex items-center justify-center h-full text-gray-400">

                  Select conversation

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* ================= MODAL ================= */}

      {showNewChat && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">

          <div className="bg-white rounded-lg max-w-md w-full p-6">

            <div className="flex justify-between mb-4">

              <h3 className="text-xl font-bold">
                New Conversation
              </h3>

              <button
                onClick={() => setShowNewChat(false)}
              >

                <X />

              </button>

            </div>

            <input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="w-full border p-2 rounded"
            />

            <div className="mt-4 max-h-96 overflow-y-auto">

              {filteredConnections.map((connection) => (

                <button
                  key={connection.id}
                  onClick={() =>
                    startNewConversation(connection.id)
                  }
                  className="w-full p-3 hover:bg-gray-50 text-left"
                >

                  {connection.full_name}

                </button>

              ))}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}