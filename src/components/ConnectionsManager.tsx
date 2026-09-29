import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from '../utils/date';

export function ConnectionsManager() {

  const { user } = useAuth();

  const [connections, setConnections] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<'connections' | 'pending' | 'sent'>('pending');

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {

    if (user) {
      loadConnections();
    }

  }, [user]);

  async function loadConnections() {

    if (!user) return;

    try {

      console.log("Loading pending for:", user.id);

      // ✅ Get pending requests
      const pendingRes = await fetch(
        `http://localhost:5000/connections/pending/${user.id}`
      );

      const pendingData = await pendingRes.json();

      console.log("Pending data:", pendingData);

      // ✅ Get all users (for names later if needed)
      const usersRes = await fetch(
        `http://localhost:5000/users`
      );

      const users = await usersRes.json();

      console.log("Users:", users);

      // Pending requests (receiver side)
      setPendingRequests(pendingData);

      // Sent requests
      const sent = pendingData.filter(
        c => c.sender_id === user.id
      );

      setSentRequests(sent);

      // Accepted connections (optional later)
      setConnections([]);

    }
    catch (err) {

      console.error("Load error:", err);

    }
    finally {

      setLoading(false);

    }

  }

  async function handleAccept(id: number) {

    try {

      const res = await fetch(
        "http://localhost:5000/connections/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            connection_id: id
          })
        }
      );

      const data = await res.json();

      console.log("Accept response:", data);

      loadConnections();

    }
    catch (err) {

      console.error(err);
      alert("Accept failed");

    }

  }

  async function handleReject(id: number) {

    try {

      const res = await fetch(
        `http://localhost:5000/connections/reject/${id}`,
        {
          method: "PUT"
        }
      );

      if (!res.ok) {

        throw new Error("Reject failed");

      }

      loadConnections();

    }
    catch (err) {

      console.error(err);
      alert("Reject failed");

    }

  }

  async function handleRemove(id: number) {

    try {

      const res = await fetch(
        `http://localhost:5000/connections/remove/${id}`,
        {
          method: "DELETE"
        }
      );

      if (!res.ok) {

        throw new Error("Remove failed");

      }

      loadConnections();

    }
    catch (err) {

      console.error(err);
      alert("Remove failed");

    }

  }

  const filterConnections = (items: any[]) => {

    if (!searchTerm) return items;

    return items.filter(item => {

      const text =
        (item.sender_name || "").toLowerCase();

      return text.includes(
        searchTerm.toLowerCase()
      );

    });

  };

  if (loading) {

    return (
      <div className="flex justify-center items-center h-64">
        Loading connections...
      </div>
    );

  }

  const filteredPending =
    filterConnections(pendingRequests);

  return (

    <div className="w-full px-4 py-8">

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">

        {/* Header */}

        <div className="flex items-center gap-3 mb-6">

          <Users className="h-8 w-8 text-blue-600" />

          <h2 className="text-2xl font-bold text-gray-800">
            My Connections
          </h2>

        </div>

        {/* Stats Cards (Icons restored) */}

        <div className="grid grid-cols-3 gap-4 mb-6">

          <div className="bg-blue-50 rounded-lg p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-blue-600 font-medium">
                  Connections
                </p>

                <p className="text-2xl font-bold text-blue-800">
                  {connections.length}
                </p>

              </div>

              <UserCheck className="h-8 w-8 text-blue-400" />

            </div>

          </div>

          <div className="bg-yellow-50 rounded-lg p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-yellow-600 font-medium">
                  Pending
                </p>

                <p className="text-2xl font-bold text-yellow-800">
                  {pendingRequests.length}
                </p>

              </div>

              <Clock className="h-8 w-8 text-yellow-400" />

            </div>

          </div>

          <div className="bg-gray-50 rounded-lg p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-600 font-medium">
                  Sent
                </p>

                <p className="text-2xl font-bold text-gray-800">
                  {sentRequests.length}
                </p>

              </div>

              <UserPlus className="h-8 w-8 text-gray-400" />

            </div>

          </div>

        </div>

        {/* Search */}

        <div className="mb-4 relative">

          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />

        </div>

        {/* Tabs */}

        <div className="flex gap-2 border-b">

          <button
            onClick={() => setActiveTab('pending')}
            className="px-6 py-3 font-medium"
          >
            Pending Requests ({pendingRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('connections')}
            className="px-6 py-3 font-medium"
          >
            My Connections ({connections.length})
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className="px-6 py-3 font-medium"
          >
            Sent Requests ({sentRequests.length})
          </button>

        </div>

      </div>

      {/* Pending Requests */}

      {activeTab === 'pending' && (

        filteredPending.length === 0
          ? (

            <div className="bg-white rounded-lg shadow-md p-8 text-center">

              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />

              <p className="text-gray-600">
                No pending connection requests
              </p>

            </div>

          )
          : (

            filteredPending.map(request => (

              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md p-6 mb-4"
              >

                <div className="flex justify-between items-center">

                  <div>

                    <p className="font-semibold">
                      Sender:
                    </p>

                    <p className="text-sm text-gray-600">
                      {request.sender_name}
                    </p>

                    <p className="text-sm text-gray-500 mt-2">
                      {formatDistanceToNow(
                        request.created_at
                      )} ago
                    </p>

                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        handleAccept(request.id)
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle size={16}/>
                      Accept
                    </button>

                    <button
                      onClick={() =>
                        handleReject(request.id)
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <XCircle size={16}/>
                      Reject
                    </button>

                  </div>

                </div>

              </div>

            ))

          )

      )}

    </div>

  );

}