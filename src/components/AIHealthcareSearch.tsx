import { useState } from 'react';
import { Brain, Send, AlertTriangle, Loader } from 'lucide-react';
import { useAuth } from "../contexts/AuthContext";

type Message = {
  role: "user" | "bot";
  text: string;
};

export function AIHealthcareSearch() {

  const { user } = useAuth();

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState([]);

  const handleNewChat = () => {
    const newId = "chat-" + Date.now(); // unique chat id

    setConversationId(newId);
    setMessages([]); // clear old chat
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');

    // Add user message + typing
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "bot", text: "Typing..." }
    ]);

    const currentQuestion = question;
    setQuestion('');

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentQuestion,
          user_id: user?.id,
          conversation_id: conversationId || crypto.randomUUID()
        }),
      });

      const text = await response.text();

      let data = null;

      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON response:", text);
      }

      // Save conversation id
      if (data && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Replace typing with real reply
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "bot", text: data.reply || "No reply received" }
      ]);

    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "bot", text: "Error: Failed to fetch" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FETCH ALL CONVERSATIONS
  const fetchConversations = async () => {
    try {
      const res = await fetch(`http://localhost:5000/conversations/${user?.id}`);
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations");
    }
  };

  // 🔥 LOAD SELECTED CHAT
  const loadChat = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/chats/${id}`);
      const data = await res.json();

      const formatted = data.flatMap(chat => ([
        { role: "user", text: chat.message },
        { role: "bot", text: chat.reply }
      ]));

      setMessages(formatted);
      setConversationId(id);
      setShowHistory(false);
    } catch (err) {
      console.error("Failed to load chat");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg shadow-sm p-6 border-2 border-blue-200 sticky top-24">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center shadow-md">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-600">VELA</h2>
            <p className="text-xs text-gray-600">Your AI Healthcare Assistant</p>
          </div>
        </div>

        {/* 🔥 BUTTONS */}
        <div className="flex gap-2">
          <button
            onClick={handleNewChat}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
          >
            + New Chat
          </button>

          <button
            onClick={() => {
              setShowHistory(!showHistory);
              fetchConversations();
            }}
            className="bg-gray-200 px-3 py-1 rounded-md text-sm"
          >
            📜 History
          </button>
        </div>

      </div>

      {/* DISCLAIMER */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-md p-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <p className="text-xs text-yellow-800">
            <span className="font-semibold">Medical Disclaimer:</span> VELA provides general health information only.
          </p>
        </div>
      </div>

      {showHistory && (
        <div className="bg-white border rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-gray-400 text-sm">No chats yet</p>
          ) : (
            conversations.map((conv, i) => (
              <div
                key={i}
                onClick={() => loadChat(conv.conversation_id)}
                className="cursor-pointer p-2 hover:bg-gray-100 rounded text-sm"
              >
                🗨️ Chat {i + 1}
              </div>
            ))
          )}
        </div>
      )}

      {/* 🔥 CHAT MESSAGES (MOVED ABOVE INPUT) */}
      <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-sm space-y-3 max-h-80 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm">Start conversation...</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-lg text-sm max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* INPUT */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask VELA..."
            rows={3}
            className="w-full px-4 py-3 pr-12 border-2 border-blue-300 rounded-lg focus:outline-none resize-none text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* SUGGESTIONS */}
      <div className="mt-5 text-xs text-gray-600 bg-white rounded-lg p-4 border border-blue-200">
        <p className="font-bold text-sm">Ask VELA about:</p>
        <ul className="mt-2 space-y-1">
          <li>• Symptoms & conditions</li>
          <li>• Treatments & medications</li>
          <li>• Lifestyle advice</li>
          <li>• Test results</li>
          <li>• Mental health</li>
        </ul>
      </div>
    </div>
  );
}