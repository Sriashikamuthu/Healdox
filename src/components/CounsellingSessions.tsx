import { useEffect, useState } from "react";
import { Clock, CheckCircle, ClipboardList } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
 
interface CounsellingProvider {
  id: string;
  username?: string;
  full_name?: string;
  role?: string;
}
 
interface CounsellingSession {
  id: string;
  message: string;
  status: string;
  created_at: string;
  provider_response?: string;
  response_date?: string;
  provider?: CounsellingProvider;
}
 
type TabType = "pending" | "scheduled" | "completed";
 
const STATUS_FOR_TAB: Record<TabType, string> = {
  pending: "pending",
  scheduled: "accepted",
  completed: "completed"
};
 
export default function CounsellingSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CounsellingSession[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    fetchSessions();
  }, [user]);
 
  const fetchSessions = async () => {
 
    if (!user?.id) {
      setLoading(false);
      return;
    }
 
    setLoading(true);
    setError("");
 
    try {
 
      const res = await fetch(
        `http://localhost:5000/counselling-sessions/${user.id}`
      );
 
      if (!res.ok) {
        throw new Error("Request failed");
      }
 
      const data = await res.json();
 
      setSessions(Array.isArray(data) ? data : []);
 
    } catch (err) {
 
      console.error("Error fetching counselling sessions:", err);
      setError("Unable to load counselling sessions. Please try again.");
      setSessions([]);
 
    } finally {
 
      setLoading(false);
 
    }
 
  };
 
  const getTopic = (message: string) => {
    if (!message) return "Counselling Session";
    const match = message.match(/^Topic:\s*(.+)$/m);
    return match ? match[1].trim() : message.split("\n")[0];
  };
 
  const getProviderName = (session: CounsellingSession) =>
    session.provider?.full_name ||
    session.provider?.username ||
    "Provider";
 
  const filtered = sessions.filter(
    (s) => s.status === STATUS_FOR_TAB[activeTab]
  );
 
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border">
 
      <h3 className="text-lg font-semibold mb-2">
        My Counselling Sessions
      </h3>
 
      <p className="text-sm text-gray-500 mb-3">
        Manage your counselling appointments
      </p>
 
      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-md p-3 text-xs text-yellow-800 mb-4">
        Reminder: Counselling sessions are for guidance only.
        Always consult your PCP for medical decisions.
      </div>
 
      {/* Tabs */}
      <div className="flex gap-4 text-sm mb-4">
        {(["pending", "scheduled", "completed"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize pb-1 ${
              activeTab === tab
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
 
      {/* Content */}
      {loading ? (
 
        <p className="text-sm text-gray-500">Loading sessions...</p>
 
      ) : error ? (
 
        <p className="text-sm text-red-600">{error}</p>
 
      ) : sessions.length === 0 ? (
 
        <div className="text-center py-4">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-1">
            No counselling sessions yet.
          </p>
          <p className="text-xs text-gray-400">
            Visit "Find Physicians" to request a counselling session.
          </p>
        </div>
 
      ) : filtered.length === 0 ? (
 
        <p className="text-sm text-gray-500">
          No {activeTab} counselling sessions.
        </p>
 
      ) : (
 
        <div className="space-y-3">
          {filtered.map((session) => (
            <div
              key={session.id}
              className="border rounded-md p-3 text-sm"
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <p className="font-semibold break-words">
                  {getTopic(session.message)}
                </p>
 
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    activeTab === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : activeTab === "scheduled"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {activeTab === "pending" && <Clock className="w-3 h-3" />}
                  {activeTab === "scheduled" && <CheckCircle className="w-3 h-3" />}
                  {activeTab === "pending"
                    ? "Pending"
                    : activeTab === "scheduled"
                    ? "Scheduled"
                    : "Completed"}
                </span>
              </div>
 
              <p className="text-gray-600 mb-1">
                Dr. {getProviderName(session)}
              </p>
 
              {session.provider_response && (
                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Provider note: </span>
                  {session.provider_response}
                </p>
              )}
 
              <p className="text-gray-400 text-xs">
                Requested {new Date(session.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
 
      )}
    </div>
  );
}
 