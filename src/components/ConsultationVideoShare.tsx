import { useState, useEffect, useRef } from 'react';
import { Upload, Video, X, Share2, Eye, Play, Pause, Users, Globe } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from '../utils/date';

interface ConsultationVideo {
  id: string;
  uploader_id: string;
  dependent_id?: string;
  video_url: string;
  thumbnail_url?: string;
  title: string;
  description?: string;
  duration_seconds: number;
  shared_with: string[];
  is_public: boolean;
  view_count: number;
  created_at: string;
  uploader_profile?: {
    full_name: string;
    username: string;
  };
}

export function ConsultationVideoShare() {
  const { user, profile } = useAuth();
  const [videos, setVideos] = useState<ConsultationVideo[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ConsultationVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('consultation_videos')
        .select(`
          *,
          uploader_profile:profiles!consultation_videos_uploader_id_fkey(full_name, username)
        `)
        .or(`uploader_id.eq.${user.id},is_public.eq.true,shared_with.cs.{${user.id}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoView = async (videoId: string) => {
    try {
      await supabase.rpc('log_video_access', {
        p_video_id: videoId,
        p_viewer_id: user?.id,
      });

      setVideos(videos.map(v =>
        v.id === videoId ? { ...v, view_count: v.view_count + 1 } : v
      ));
    } catch (error) {
      console.error('Error logging video view:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Consultation Videos</h2>
            <p className="text-gray-600 text-sm mt-1">Share 10-second videos for quick consultations</p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Video
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading videos...</div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Yet</h3>
            <p className="text-gray-600 mb-4">Upload your first consultation video to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onShare={() => {
                  setSelectedVideo(video);
                  setShareModalOpen(true);
                }}
                onView={() => handleVideoView(video.id)}
                isOwner={video.uploader_id === user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {uploadModalOpen && (
        <UploadVideoModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={fetchVideos}
        />
      )}

      {shareModalOpen && selectedVideo && (
        <ShareVideoModal
          isOpen={shareModalOpen}
          video={selectedVideo}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedVideo(null);
          }}
          onSuccess={fetchVideos}
        />
      )}
    </div>
  );
}

function VideoCard({
  video,
  onShare,
  onView,
  isOwner
}: {
  video: ConsultationVideo;
  onShare: () => void;
  onView: () => void;
  isOwner: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        onView();
      }
      setPlaying(!playing);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="relative aspect-video bg-black cursor-pointer" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full h-full object-contain"
          onEnded={() => setPlaying(false)}
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-12 h-12 text-white" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {video.duration_seconds}s
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 mb-1 truncate">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>By {video.uploader_user?.fullName || video.uploader_user?.username}</span>
          <span>{formatDistanceToNow(video.created_at)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {video.view_count}
            </div>
            {video.is_public ? (
              <div className="flex items-center gap-1 text-green-600">
                <Globe className="w-3 h-3" />
                Public
              </div>
            ) : (
              <div className="flex items-center gap-1 text-blue-600">
                <Users className="w-3 h-3" />
                {video.shared_with.length} shared
              </div>
            )}
          </div>

          {isOwner && (
            <button
              onClick={onShare}
              className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadVideoModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen) return null;

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Video must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file');
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 10) {
          setError('Video must be 10 seconds or less');
          setVideoFile(null);
        } else {
          setVideoFile(file);
          setError('');
        }
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('consultation_videos')
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('consultation_videos')
        .getPublicUrl(filePath);

      const video = document.createElement('video');
      video.preload = 'metadata';

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
        video.src = URL.createObjectURL(videoFile);
      });

      const duration = Math.floor(video.duration);

      const { error: insertError } = await supabase
        .from('consultation_videos')
        .insert({
          uploader_id: user?.id,
          video_url: publicUrl,
          title: formData.title,
          description: formData.description || null,
          duration_seconds: duration,
          is_public: formData.is_public,
        });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
      setFormData({ title: '', description: '', is_public: false });
      setVideoFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-4">Upload Consultation Video</h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
          <strong>Note:</strong> Videos must be 10 seconds or less and under 10MB.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File * (Max 10 seconds)
            </label>
            <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
              <Video className="w-6 h-6 text-gray-400" />
              <span className="text-gray-600">
                {videoFile ? videoFile.name : 'Click to select video file'}
              </span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the video"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional additional details"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Make this video public (anyone can view it)
            </span>
          </label>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
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
              {loading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ShareVideoModal({
  isOpen,
  video,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  video: ConsultationVideo;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(video.shared_with || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          *,
          receiver_profile:profiles!user_connections_receiver_id_fkey(id, full_name, username),
          requester_profile:profiles!user_connections_requester_id_fkey(id, full_name, username)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

      if (error) throw error;

      const connectedUsers = data?.map(conn => {
        if (conn.requester_id === user?.id) {
          return conn.receiver_profile;
        } else {
          return conn.requester_profile;
        }
      }) || [];

      setConnections(connectedUsers);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('consultation_videos')
        .update({ shared_with: selectedUsers })
        .eq('id', video.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update sharing settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-4">Share Video</h2>
        <p className="text-gray-600 mb-4 text-sm">Select users to share "{video.title}" with</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No connections yet. Connect with others to share videos.</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
              {connections.map((connection) => (
                <label
                  key={connection.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(connection.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, connection.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== connection.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {connection.full_name || connection.username}
                  </span>
                </label>
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
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
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
