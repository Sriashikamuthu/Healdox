import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function CounsellingSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user?.id) return;

    const res = await fetch(
      `http://localhost:5000/counselling-sessions/${user?.id}`
    );

    const data = await res.json();
    setSessions(data);
  };

  const filtered = sessions.filter(
    (s) => s.status === activeTab
  );

  // return (
  //   <div className="bg-white rounded-lg shadow-sm p-4 border">
      
  //     <h3 className="text-lg font-semibold mb-2">
  //       My Counselling Sessions
  //     </h3>

  //     <p className="text-sm text-gray-500 mb-3">
  //       Manage your counselling appointments
  //     </p>

  //     {/* Disclaimer */}
  //     <div className="bg-yellow-50 border border-yellow-300 rounded-md p-3 text-xs text-yellow-800 mb-4">
  //       Reminder: Counselling sessions are for guidance only.
  //       Always consult your PCP for medical decisions.
  //     </div>

  //     {/* Tabs */}
  //     <div className="flex gap-4 text-sm mb-4">
  //       {["pending", "scheduled", "completed"].map((tab) => (
  //         <button
  //           key={tab}
  //           onClick={() => setActiveTab(tab)}
  //           className={`capitalize pb-1 ${
  //             activeTab === tab
  //               ? "text-orange-600 border-b-2 border-orange-500"
  //               : "text-gray-500"
  //           }`}
  //         >
  //           {tab}
  //         </button>
  //       ))}
  //     </div>

  //     {/* Content */}
  //     {filtered.length === 0 ? (
  //       <p className="text-sm text-gray-500">
  //         No {activeTab} counselling sessions.
  //       </p>
  //     ) : (
  //       <div className="space-y-3">
  //         {filtered.map((session) => (
  //           <div
  //             key={session.id}
  //             className="border rounded-md p-3 text-sm"
  //           >
  //             <p className="font-semibold">{session.topic}</p>
  //             <p className="text-gray-500">
  //               {session.description}
  //             </p>
  //           </div>
  //         ))}
  //       </div>
  //     )}
  //   </div>
  // );
}