import { useState, useEffect } from 'react';
import { User, Upload, X, FileText, Image, Film, File, Download, Trash2, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AIHealthcareSearch } from './AIHealthcareSearch';
import CounsellingSessions from './CounsellingSessions';

interface MedicalRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string;
  uploaded_at: string;
}

interface ConsultationRequest {
  id: string;
  message: string;
  status: string;
  created_at: string;
  professional: {
    id: string;
    full_name: string;
    role: string;
    specialization?: string;
  };
}

export function PatientProfile() {
  const { user, setUser } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<'image' | 'xray' | 'video' | 'document'>('image');
  const [error, setError] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user?.avatar_url) {
      setProfilePicturePreview(user.avatar_url);
    }
  }, [user?.avatar_url]);

  const fetchRecords = async () => {
    try {

      const res = await fetch(
        `http://localhost:5000/medical-records/${user?.id}`
      );

      const data = await res.json();

      setRecords(data || []);

    } catch (error) {

      console.error("Error fetching medical records:", error);

    } finally {

      setLoading(false);

    }
  };

  const fetchConsultationRequests = async () => {
    try {

      const res = await fetch(
        `http://localhost:5000/consultation-requests/${user?.id}`
      );

      const data = await res.json();

      setConsultationRequests(data || []);

    } catch (error) {

      console.error(
        "Error fetching consultation requests:",
        error
      );

    }
  };

  // ✅ THEN call them
  useEffect(() => {

    if (user?.id) {

      fetchRecords();
      fetchConsultationRequests();

    }

  }, [user?.id]);  

  const downloadFile = async (record: MedicalRecord) => {

    try {

      const url =
        `http://localhost:5000/uploads/${record.file_path}`;

      const a = document.createElement("a");

      a.href = url;
      a.download = record.file_name;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (error) {

      console.error("Download error:", error);
      alert("Failed to download file");

    }

  };

  const deleteFile = async (record: MedicalRecord) => {

    if (!confirm("Delete this file?")) return;

    try {

      const res = await fetch(
        `http://localhost:5000/delete-medical-record/${record.id}`,
        {
          method: "DELETE"
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      fetchRecords();

    } catch (error) {

      console.error("Delete error:", error);
      alert("Failed to delete file");

    }

  };  

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const updateProfilePicture = async () => {

    if (!profilePicture) return;

    try {

      setUpdatingProfile(true);

      const formData = new FormData();
      formData.append("avatar", profilePicture);
      formData.append("user_id", user.id);

      const res = await fetch("http://localhost:5000/upload-profile", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      console.log("Upload response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // ✅ 🔥 THIS IS THE IMPORTANT PART
      const updatedUser = {
        ...user,
        avatar_url: data.file_url
      };

      setUser(updatedUser); // update context
      localStorage.setItem("user", JSON.stringify(updatedUser)); // persist

      alert("Profile picture updated successfully!");

    } catch (err) {

      console.error("UPLOAD ERROR:", err);
      alert("Upload failed");

    } finally {

      setUpdatingProfile(false);

    }

  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = fileType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File size must be less than ${fileType === 'video' ? '100MB' : '10MB'}`);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !user?.id) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("user_id", user.id);
      formData.append("file_type", fileType);
      formData.append("description", description);

      const res = await fetch(
        "http://localhost:5000/upload-medical-record",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      alert("File uploaded successfully!");

      setSelectedFile(null);
      setDescription("");

      fetchRecords(); // refresh list

    } catch (err: any) {

      console.error("UPLOAD ERROR:", err);
      setError(err.message || "Upload failed");

    } finally {

      setUploading(false);

    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-8 h-8 text-blue-600" />;
      case 'xray':
        return <FileText className="w-8 h-8 text-purple-600" />;
      case 'video':
        return <Film className="w-8 h-8 text-red-600" />;
      case 'document':
        return <File className="w-8 h-8 text-green-600" />;
      default:
        return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your profile and medical records</p>
            </div>
            <a
              href="/medical-suggestions"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Medical Suggestions
            </a>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Privacy & Security</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your medical records are private and secure</li>
              <li>Only you can access and manage your files</li>
              <li>Files are encrypted and stored securely</li>
              <li>Never share sensitive information publicly</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Picture</h2>
        <div className="flex items-center gap-6">

          {/* IMAGE PREVIEW */}
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-gray-300">
            {profilePicturePreview ? (
              <img
                src={profilePicturePreview}
                alt="Profile"
                className="w-full h-full object-cover"/>
            ) : (
              <User className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex-1 flex items-center gap-3">

            <label className="cursor-pointer inline-block">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md">
                <Upload className="w-4 h-4" />
                <span>{profilePicture ? "Change Photo" : "Upload Photo"}</span>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </label>

            {/* ✅ SAVE BUTTON ALWAYS VISIBLE */}
            <button
              onClick={updateProfilePicture}
              disabled={!profilePicture || updatingProfile}
              className={`px-4 py-2 rounded-md text-white transition 
                ${profilePicture ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}
              `}
            >
              {updatingProfile ? "Saving..." : "Save"}
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Max 5MB, JPG, PNG or GIF
            </p>

          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Consultation Requests</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading requests...</div>
        ) : consultationRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No consultation requests yet. Visit the "Find Physicians" page to request a consultation.
          </div>
        ) : (
          <div className="space-y-4">
            {consultationRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        Dr. {request.professional.full_name}
                      </h3>
                      {request.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {request.status === 'accepted' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Accepted
                        </span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          <XCircle className="w-3 h-3" />
                          Declined
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 capitalize mb-2">
                      {request.professional.specialization || request.professional.role.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {request.message}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Requested on {new Date(request.created_at).toLocaleDateString()} at{' '}
                  {new Date(request.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Medical Records</h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="image">Medical Image</option>
                <option value="xray">X-Ray / Scan</option>
                <option value="video">Video</option>
                <option value="document">Document / Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select File
              </label>
              <label className="cursor-pointer block">
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm truncate">
                    {selectedFile ? selectedFile.name : 'Choose file'}
                  </span>
                </div>
                <input
                  type="file"
                  accept={
                    fileType === 'video'
                      ? 'video/*'
                      : fileType === 'document'
                      ? '.pdf,.doc,.docx,.txt'
                      : 'image/*'
                  }
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this file..."
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            onClick={uploadFile}
            disabled={!selectedFile || uploading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Medical Records</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No medical records uploaded yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getFileIcon(record.file_type)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadFile(record)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFile(record)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-medium text-gray-900 text-sm mb-1 truncate" title={record.file_name}>
                  {record.file_name}
                </h3>

                <div className="space-y-1 text-xs text-gray-600">
                  <p className="capitalize">{record.file_type}</p>
                  <p>{formatFileSize(record.file_size)}</p>
                  <p>{new Date(record.uploaded_at).toLocaleDateString()}</p>
                </div>

                {record.description && (
                  <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                    {record.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <AIHealthcareSearch />
          <CounsellingSessions />
        </div>
      </div>
    </div>
  );
}
