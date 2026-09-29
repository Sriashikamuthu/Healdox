import { useState, useEffect } from 'react';
import { Camera, Save, AlertTriangle, User } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

export function PhysicianProfile() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    specialty: '',
    license_number: '',
    institution: '',
    medicine_system: '',
    country: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        specialty: profile.specialty || '',
        license_number: profile.license_number || '',
        institution: profile.institution || '',
        medicine_system: profile.medicine_system || '',
        country: profile.country || '',
      });

      if (profile.avatar_url) {
        fetchProfilePicture(profile.avatar_url);
      }
    }
  }, [profile]);

  const fetchProfilePicture = async (path: string) => {
    try {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      setProfilePictureUrl(data.publicUrl);
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setProfilePicture(file);
    }
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture || !profile?.id) return;

    setUpdatingProfile(true);
    try {
      const fileExt = profilePicture.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profilePicture, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfilePicture(null);
      setProfilePictureUrl(null);
      fetchProfilePicture(filePath);
      alert('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile picture:', err);
      alert('Failed to update profile picture');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          specialty: formData.specialty,
          license_number: formData.license_number,
          institution: formData.institution,
          medicine_system: formData.medicine_system,
          country: formData.country,
        })
        .eq('id', profile?.id);

      if (error) throw error;

      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Physician Profile</h1>
        <p className="text-gray-600">Manage your professional profile and information</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Professional Information</p>
            <p>
              Keep your professional credentials up to date. Verified physicians with complete profiles
              build more trust with patients seeking medical guidance.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Profile Picture</h3>

        <div className="flex items-center gap-6">
          <div className="relative">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-200">
                {user?.username?.[0].toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1">
            {profilePicture ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Selected: <span className="font-medium">{profilePicture.name}</span>
                </p>
                <button
                  onClick={uploadProfilePicture}
                  disabled={updatingProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updatingProfile ? 'Uploading...' : 'Upload Picture'}
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <p className="mb-2">Click the camera icon to upload a new profile picture</p>
                <p className="text-xs text-gray-500">Maximum file size: 5MB. Supported formats: JPG, PNG, GIF</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h3 className="text-lg font-bold mb-4">Professional Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio / About Me
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Tell patients about your experience, approach to medicine, and areas of expertise..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Specialty *
            </label>
            <select
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Specialty</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="Family Medicine">Family Medicine</option>
              <option value="Gastroenterology">Gastroenterology</option>
              <option value="General Practice">General Practice</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Neurology">Neurology</option>
              <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
              <option value="Oncology">Oncology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Psychiatry">Psychiatry</option>
              <option value="Pulmonology">Pulmonology</option>
              <option value="Rheumatology">Rheumatology</option>
              <option value="Urology">Urology</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Number *
            </label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicine System
            </label>
            <select
              value={formData.medicine_system}
              onChange={(e) => setFormData({ ...formData, medicine_system: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select System</option>
              <option value="Allopathy">Allopathy (Western Medicine)</option>
              <option value="Ayurveda">Ayurveda</option>
              <option value="Homeopathy">Homeopathy</option>
              <option value="Traditional Chinese Medicine">Traditional Chinese Medicine</option>
              <option value="Naturopathy">Naturopathy</option>
              <option value="Integrative Medicine">Integrative Medicine</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution / Hospital
            </label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Hospital or clinic name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., United States, India, United Kingdom"
            required
          />
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Verification Status:</span>{' '}
            {profile?.is_verified ? (
              <span className="text-green-600 font-semibold">✓ Verified</span>
            ) : (
              <span className="text-orange-600">Pending Verification</span>
            )}
          </p>
          {!profile?.is_verified && (
            <p className="text-xs text-gray-600 mt-1">
              Your profile is under review. Verified physicians have access to all platform features.
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
