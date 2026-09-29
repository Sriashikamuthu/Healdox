import { useState, useEffect } from 'react';
import { Plus, User, Calendar, Stethoscope, FileText, AlertCircle, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AddDependentModal } from './AddDependentModal';
import { ChildMedicalRecordsModal } from './ChildMedicalRecordsModal';
import { PediatricConsultationRequestModal } from './PediatricConsultationRequestModal';

interface DependentChild {
  id: string;
  parent_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group?: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  notes?: string;
  created_at: string;
}

interface ChildHealthIssue {
  id: string;
  child_id: string;
  issue_title: string;
  symptoms_description: string;
  severity: string;
  status: string;
  symptom_started_date: string;
}

export function DependentChildrenManager() {
  const { user } = useAuth();
  const [children, setChildren] = useState<DependentChild[]>([]);
  const [selectedChild, setSelectedChild] = useState<DependentChild | null>(null);
  const [healthIssues, setHealthIssues] = useState<ChildHealthIssue[]>([]);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [medicalRecordsModalOpen, setMedicalRecordsModalOpen] = useState(false);
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchHealthIssues(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {

    try {

      const res = await fetch(

        `http://localhost:5000/dependents/${user?.id}`

      );

      if (!res.ok) {

        throw new Error("Failed to fetch dependents");

      }

      const data = await res.json();

      setChildren(data || []);

      if (data.length > 0 && !selectedChild) {

        setSelectedChild(data[0]);

      }

    }

    catch (error) {

      console.error("Error fetching children:", error);

    }

    finally {

      setLoading(false);

    }

  };

  const fetchHealthIssues = async (childId: string) => {

    try {

      const res = await fetch(

        `http://localhost:5000/dependent-health/${childId}`

      );

      if (!res.ok) return;

      const data = await res.json();

      setHealthIssues(data || []);

    }

    catch (error) {

      console.error("Error fetching health issues:", error);

    }

  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age === 0) {
      const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;
      return `${months} month${months !== 1 ? 's' : ''}`;
    }

    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      mild: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      severe: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">My Dependents</h2>
            <p className="text-gray-600 text-sm mt-1">Manage your dependents' health records and consultations</p>
          </div>
          <button
            onClick={() => setAddChildModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Dependent
          </button>
        </div>

        {children.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Dependents Added</h3>
            <p className="text-gray-600 mb-4">Add your dependent's profile to manage their health records and consultations</p>
            <button
              onClick={() => setAddChildModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Dependent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedChild?.id === child.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {child.full_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{child.full_name}</p>
                      <p className="text-sm text-gray-600">{calculateAge(child.date_of_birth)} old</p>
                      <p className="text-xs text-gray-500 capitalize">{child.gender}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedChild && (
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedChild.full_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {calculateAge(selectedChild.date_of_birth)} • {selectedChild.gender.charAt(0).toUpperCase() + selectedChild.gender.slice(1)}
                      </p>
                    </div>
                    {selectedChild.blood_group && (
                      <div className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 border border-gray-200">
                        {selectedChild.blood_group}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedChild.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedChild.allergies.length > 0 && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Allergies</p>
                        <p className="text-sm font-medium text-red-600">
                          {selectedChild.allergies.join(', ')}
                        </p>
                      </div>
                    )}
                    {selectedChild.chronic_conditions.length > 0 && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Chronic Conditions</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedChild.chronic_conditions.join(', ')}
                        </p>
                      </div>
                    )}
                    {selectedChild.current_medications.length > 0 && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Current Medications</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedChild.current_medications.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedChild.notes && (
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{selectedChild.notes}</p>
                    </div>
                  )}
                </div>

                {healthIssues.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Active Health Issues</h4>
                    </div>
                    <div className="space-y-2">
                      {healthIssues.map((issue) => (
                        <div key={issue.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-gray-900">{issue.issue_title}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{issue.symptoms_description}</p>
                          <p className="text-xs text-gray-500">
                            Started: {new Date(issue.symptom_started_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setMedicalRecordsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    <FileText className="w-5 h-5" />
                    Medical Records
                  </button>
                  <button
                    onClick={() => setConsultationModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Stethoscope className="w-5 h-5" />
                    Request Consultation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddDependentModal
        isOpen={addChildModalOpen}
        onClose={() => setAddChildModalOpen(false)}
        onSuccess={fetchChildren}
      />

      {selectedChild && (
        <>
          <ChildMedicalRecordsModal
            isOpen={medicalRecordsModalOpen}
            onClose={() => setMedicalRecordsModalOpen(false)}
            child={selectedChild}
          />
          <PediatricConsultationRequestModal
            isOpen={consultationModalOpen}
            onClose={() => setConsultationModalOpen(false)}
            child={selectedChild}
            onSuccess={() => {
              setConsultationModalOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}
