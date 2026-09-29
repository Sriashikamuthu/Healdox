import { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle, Users, CheckCircle, AlertCircle, Heart, Activity, Brain, Stethoscope, Droplet, Sparkles, Smile, Baby, Scale, Shield, X } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { CommentSection } from './CommentSection';
import { formatDistanceToNow } from '../utils/date';

const SYMPTOM_CATEGORIES = [
  { id: 'respiratory', name: 'Respiratory', icon: Activity, description: 'Breathing, cough, congestion' },
  { id: 'digestive', name: 'Digestive', icon: Droplet, description: 'Stomach, nausea, digestion' },
  { id: 'musculoskeletal', name: 'Musculoskeletal', icon: Users, description: 'Pain, joints, muscles' },
  { id: 'neurological', name: 'Neurological', icon: Brain, description: 'Headache, dizziness, memory' },
  { id: 'cardiovascular', name: 'Cardiovascular', icon: Heart, description: 'Heart, chest, circulation' },
  { id: 'dermatological', name: 'Dermatological', icon: Sparkles, description: 'Skin, rash, itching' },
  { id: 'mental_health', name: 'Mental Health', icon: Smile, description: 'Anxiety, depression, stress' },
  { id: 'reproductive', name: 'Reproductive', icon: Baby, description: 'Hormonal, reproductive health' },
  { id: 'metabolic', name: 'Metabolic', icon: Scale, description: 'Diabetes, thyroid, weight' },
  { id: 'immune', name: 'Immune', icon: Shield, description: 'Allergies, infections, autoimmune' },
  { id: 'other', name: 'Other', icon: Stethoscope, description: 'General health concerns' },
];

interface Discussion {
  id: string;
  user_id: string;
  title: string;
  symptoms: string[];
  category: string;
  description: string;
  severity: string;
  duration: string;
  is_anonymous: boolean;
  status: string;
  remedy_found: boolean;
  remedy_description: string | null;
  view_count: number;
  comment_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

export function SymptomDiscussions() {
  const { user, profile } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {

    try {

      const res = await fetch(
        "http://localhost:5000/discussions"
      );

      const data = await res.json();

      setDiscussions(data || []);

    }

    catch (error) {

      console.error(
        "Error fetching discussions:",
        error
      );

    }

    finally {

      setLoading(false);

    }

  };

  const filteredDiscussions = discussions.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'severe':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading discussions...</div>;
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Health Winners Community</p>
            <p>
              Connect with fellow health winners, share experiences, and discover what worked for members with similar health journeys.
              Always consult your PCP before trying any treatments.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Health Discussions</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Start Discussion
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Browse by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedCategory === 'all'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">All Topics</span>
            </div>
          </button>
          {SYMPTOM_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by symptoms or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredDiscussions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-600">
            {searchTerm ? 'No discussions found matching your search.' : 'No discussions yet. Start a new one!'}
          </div>
        ) : (
          filteredDiscussions.map((discussion) => (
            <div
              key={discussion.id}
              onClick={() => setSelectedDiscussion(discussion)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{discussion.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span>
                      {discussion.is_anonymous ? 'Anonymous' : discussion.is_anonymous
                                                                  ? 'Anonymous'
                                                                  : discussion.full_name ||
                                                                    discussion.username ||
                                                                    'User'}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(discussion.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(discussion.severity)}`}>
                    {discussion.severity}
                  </span>
                  {discussion.remedy_found && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Remedy Found
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {discussion.symptoms.map((symptom, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {symptom}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 mb-3 line-clamp-2">{discussion.description}</p>

              {discussion.duration && (
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Duration:</span> {discussion.duration}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {discussion.comment_count || 0} comments
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {discussion.view_count || 0} views
                </span>
                <span className={`font-medium ${
                  discussion.status === 'resolved' ? 'text-green-600' :
                  discussion.status === 'ongoing' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {discussion.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateDiscussionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDiscussions();
          }}
        />
      )}

      {selectedDiscussion && (
        <DiscussionDetailModal
          discussion={selectedDiscussion}
          onClose={() => setSelectedDiscussion(null)}
          onUpdate={fetchDiscussions}
        />
      )}
    </div>
  );
}

function CreateDiscussionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [symptoms, setSymptoms] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [duration, setDuration] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);

    try {

      const symptomsArray =
        symptoms
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

      const response =
        await fetch(
          "http://localhost:5000/discussions",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              user_id: user?.id,

              title,

              category,

              symptoms: symptomsArray,

              description,

              severity,

              duration:
                duration || null,

              is_anonymous:
                isAnonymous

            })

          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Failed to create discussion"
        );

      }

      onSuccess();

    }

    catch (error) {

      console.error(
        "Error creating discussion:",
        error
      );

      alert(
        "Failed to create discussion"
      );

    }

    finally {

      setLoading(false);

    }

  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Start a Discussion</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your concern"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {SYMPTOM_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} - {cat.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symptoms * (comma-separated)
            </label>
            <input
              type="text"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., headache, fever, fatigue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your symptoms in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Optional)</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3 days, 2 weeks"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              Post anonymously
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DiscussionDetailModal({
  discussion,
  onClose,
  onUpdate,
}: {
  discussion: Discussion;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [commentCount, setCommentCount] = useState(discussion.comment_count || 0);

  const handleCommentCountChange = (newCount: number) => {
    setCommentCount(newCount);
    onUpdate();
  };

  useEffect(() => {

  const updateViews = async () => {

    try {

      await fetch(
        `http://localhost:5000/discussions/${discussion.id}/view`,
        {
          method: "POST"
        }
      );

    }

    catch (err) {

      console.error(
        "View update failed:",
        err
      );

    }

  };

  updateViews();

}, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{discussion.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>
                {discussion.is_anonymous
                  ? 'Anonymous'
                  : discussion.full_name ||
                    discussion.username ||
                    'User'}
              </span>
              <span>•</span>
              <span>{formatDistanceToNow(discussion.created_at)}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                discussion.severity === 'mild' ? 'bg-green-100 text-green-800' :
                discussion.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                discussion.severity === 'severe' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {discussion.severity}
              </span>
              {discussion.remedy_found && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Remedy Found
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {discussion.symptoms.map((symptom, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {symptom}
                </span>
              ))}
            </div>

            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{discussion.description}</p>

            {discussion.duration && (
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Duration:</span> {discussion.duration}
              </p>
            )}

            {discussion.remedy_found && discussion.remedy_description && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Remedy Found
                </h3>
                <p className="text-green-800 whitespace-pre-wrap">{discussion.remedy_description}</p>
              </div>
            )}
          </div>

          <CommentSection
            type="discussion"
            parentId={discussion.id}
            commentCount={commentCount}
            onCommentCountChange={handleCommentCountChange}
          />
        </div>
      </div>
    </div>
  );
}
