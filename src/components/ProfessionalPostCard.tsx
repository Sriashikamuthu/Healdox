import { BadgeCheck, MessageCircle, Calendar } from 'lucide-react';
import { ProfessionalPost } from '../types/database';
import { formatDistanceToNow } from '../utils/date';

interface ProfessionalPostCardProps {
  post: ProfessionalPost;
  onConsult: (professionalId: string, postId: string) => void;
}

export function ProfessionalPostCard({ post, onConsult }: ProfessionalPostCardProps) {
  const professional = post.profiles;
  const displayName = professional?.full_name || professional?.username || 'Unknown Professional';

  const categoryColors = {
    advice: 'bg-blue-100 text-blue-700 border-blue-200',
    research: 'bg-purple-100 text-purple-700 border-purple-200',
    announcement: 'bg-green-100 text-green-700 border-green-200',
    education: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  const categoryColor = categoryColors[post.category];

  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-lg">
          {displayName[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{displayName}</h3>
            {professional?.is_verified && (
              <BadgeCheck className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 capitalize">{professional?.role}</span>
            {professional?.specialty && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{professional.specialty}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(post.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
            {post.category}
          </span>
          {professional?.institution && (
            <span className="text-sm text-gray-600">{professional.institution}</span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
        <div className="text-gray-700 whitespace-pre-line">{post.content}</div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onConsult(post.professional_id, post.id)}
          className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors font-medium"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">Request Consultation</span>
        </button>
      </div>
    </article>
  );
}
