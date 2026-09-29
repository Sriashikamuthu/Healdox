import React from "react";

import { Shield } from "lucide-react";

export function AdminDashboard() {

  return (
    <div className="max-w-7xl mx-auto p-6">

      <div className="bg-white rounded-lg shadow-md p-6">

        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-blue-600" />

          <h2 className="text-2xl font-bold text-gray-800">
            Admin Dashboard
          </h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">

          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Admin Module Temporarily Disabled
          </h3>

          <p className="text-yellow-700">
            This feature used Supabase and is being migrated to PostgreSQL.
          </p>

          <p className="text-gray-600 mt-2">
            The system will continue to work normally.
          </p>

        </div>

      </div>

    </div>
  );
}