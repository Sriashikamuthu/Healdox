import { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, Reply, Edit2, Trash2, Send, Award, Stethoscope, X } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from '../utils/date';
import { Profile } from '../types/database';

interface Comment {
  id: string;
  user_id: string;
  parent_comment_id?: string | null;
  parent_reply_id?: string | null;
  content: string;
  is_anonymous: boolean;
  helpful_count: number;
  reply_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  replies?: Comment[];
  user_has_reacted?: boolean;
}

interface CommentSectionProps {
  type: 'journey' | 'review' | 'discussion';
  parentId: string;
  commentCount?: number;
  onCommentCountChange?: (count: number) => void;
}

export function CommentSection({ type, parentId, commentCount = 0, onCommentCountChange }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (parentId) {
      fetchComments();
    }
  }, [parentId, type]);

  const fetchComments = async () => {

    try {

      // ✅ Reset loading before API call
      setLoading(true);

      console.log("Fetching comments for:", parentId);

      const res =
        await fetch(
          user
            ? `http://localhost:5000/comments/${parentId}?user_id=${encodeURIComponent(user.id)}`
            : `http://localhost:5000/comments/${parentId}`
        );

      const data =
        await res.json();

      console.log("Comments returned:", data);

      setComments(
        Array.isArray(data)
          ? data
          : []
      );

    }

    catch (err) {

      console.error(
        "Error loading comments:",
        err
      );

      setComments([]);

    }

    finally {

      // ✅ Always stop loading
      setLoading(false);

    }

  };

  const fetchReplies = async (
    parentId: string
  ): Promise<Comment[]> => {

    try {

      const res =
        await fetch(
          `http://localhost:5000/replies/${parentId}`
        );

      const data =
        await res.json();

      return data || [];

    }

    catch (error) {

      console.error(
        "Error fetching replies:",
        error
      );

      return [];

    }

  };

  const handleSubmitComment =
    async () => {

    if (!user || !newComment.trim())
      return;

    setSubmitting(true);

    try {

      const response =
        await fetch(
          "http://localhost:5000/comments",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              discussion_id:
                parentId,

              user_id:
                user.id,

              comment:
                newComment.trim(),

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
          "Failed to post comment"
        );

      }

      setNewComment("");

      fetchComments();

      if (onCommentCountChange) {

        onCommentCountChange(
          comments.length
        );

      }

    }

    catch (err) {

      console.error(
        "Post comment error:",
        err
      );

      alert(
        "Failed to post comment"
      );

    }

    finally {

      setSubmitting(false);

    }

  };

  const handleUpdateComment = async (commentId) => {

    try {

      const res = await fetch(
        `http://localhost:5000/comments/${commentId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            comment: editContent
          })

        }
      );

      if (!res.ok) {

        const err = await res.json();
        console.error("Update failed:", err);

        return;

      }

      setEditingComment(null);
      setEditContent("");

      fetchComments();

    }

    catch (err) {

      console.error(
        "Update error:",
        err
      );

    }

  };

  const handleDeleteComment = async (
    commentId: string
  ) => {

    try {

      const res =
        await fetch(
          `http://localhost:5000/comments/${commentId}`,
          {
            method: "DELETE"
          }
        );

      if (!res.ok) {

        throw new Error(
          "Delete failed"
        );

      }

      fetchComments();

      if (onCommentCountChange) {

        onCommentCountChange(
          comments.length - 1
        );

      }

    }

    catch (error) {

      console.error(
        "Delete comment error:",
        error
      );

    }

  };

  const handleReply = async (
    parentCommentId: string,
    text: string
  ) => {

    if (!text?.trim()) return;

    try {

      await fetch(
        "http://localhost:5000/comments",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            discussion_id: discussionId,
            user_id: user.id,
            comment: text,
            parent_id: parentCommentId   // ⭐ VERY IMPORTANT
          })

        }
      );

      // clear reply box
      setReplyTexts(prev => ({
        ...prev,
        [parentCommentId]: ""
      }));

      setReplyingTo(null);

      fetchComments();

    }

    catch (error) {

      console.error(
        "Reply error:",
        error
      );

    }

  };
  
  const handleToggleHelpful = async (
    commentId: string
  ) => {

    if (!user) return;

    try {

      await fetch(
        "http://localhost:5000/comments/helpful",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            comment_id: commentId,
            user_id: user.id
          })

        }
      );

      fetchComments();

    }

    catch (error) {

      console.error(
        "Helpful error:",
        error
      );

    }

  };

  const getRoleBadge = (commentProfile?: Profile) => {
    if (!commentProfile) return null;

    const roleColors: Record<string, string> = {
      physician: 'bg-blue-100 text-blue-800',
      nurse: 'bg-teal-100 text-teal-800',
      lab: 'bg-purple-100 text-purple-800',
      pharma_company: 'bg-orange-100 text-orange-800',
      admin: 'bg-red-100 text-red-800',
      patient: 'bg-gray-100 text-gray-800',
    };

    const roleLabels: Record<string, string> = {
      physician: 'Physician',
      nurse: 'Nurse',
      lab: 'Lab',
      pharma_company: 'Pharma',
      admin: 'Admin',
      patient: 'Member',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleColors[commentProfile.role]}`}>
        {commentProfile.role === 'physician' && <Stethoscope className="w-3 h-3" />}
        {roleLabels[commentProfile.role]}
        {commentProfile.is_verified && commentProfile.role === 'physician' && (
          <Award className="w-3 h-3" />
        )}
      </span>
    );
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwnComment = user?.id === comment.user_id;

    console.log("User:", user?.id);
    console.log("Comment owner:", comment.user_id);
    console.log("Is own:", isOwnComment);

    const isEditing = editingComment === comment.id;
    const displayName =
      comment.is_anonymous
        ? 'Anonymous'
        : comment.full_name ||
          comment.username ||
          'User';

    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mt-4'}`}>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              {comment.profiles?.avatar_url && !comment.is_anonymous ? (
                <img src={comment.profiles.avatar_url} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-gray-600 font-medium">
                  {displayName?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium text-gray-900">{displayName}</span>
                {!comment.is_anonymous && comment.profiles && getRoleBadge(comment.profiles)}
                <span className="text-sm text-gray-500">{formatDistanceToNow(comment.created_at)}</span>
                {comment.is_edited && (
                  <span className="text-xs text-gray-500 italic">(edited)</span>
                )}
              </div>

              {comment.profiles?.specialty && !comment.is_anonymous && comment.profiles.role === 'physician' && (
                <div className="text-xs text-gray-600 mb-2">{comment.profiles.specialty}</div>
              )}

              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateComment(comment.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                        fetchComments();
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 text-sm whitespace-pre-wrap">{comment.comment}</p>
              )}

              <div className="flex items-center gap-4 mt-3 text-sm">

                {/* Helpful — visible to all */}

                <button
                  onClick={() =>
                    handleToggleHelpful(comment.id)
                  }
                  className={`flex items-center gap-1 ${
                    comment.user_has_reacted
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  } hover:text-blue-700 transition-colors`}
                >
                  <ThumbsUp className={`w-4 h-4 ${
                    comment.user_has_reacted
                      ? 'fill-current'
                      : ''
                  }`} />

                  <span>{comment.helpful_count}</span>

                  <span className="hidden sm:inline">
                    Helpful
                  </span>

                </button>


                {/* Reply — visible to all */}

                <button
                  onClick={() =>
                    setReplyingTo(
                      replyingTo === comment.id
                        ? null
                        : comment.id
                    )
                  }
                  className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition-colors"
                >
                  <Reply className="w-4 h-4" />

                  <span>Reply</span>

                  {comment.reply_count > 0 && (
                    <span className="text-xs">
                      ({comment.reply_count})
                    </span>
                  )}

                </button>


                {isOwnComment && !isEditing && (

                  <>

                    <button
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditContent(comment.comment);
                      }}
                      className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>


                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="flex items-center gap-1 text-gray-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>

                  </>

                )}

              </div>

              {replyingTo === comment.id && (
                <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start gap-2 mb-2">
                    <textarea
                      value={replyTexts[comment.id] || ""}
                      onChange={(e) =>
                        setReplyTexts({
                          ...replyTexts,
                          [comment.id]: e.target.value
                        })
                      }
                      placeholder="Write a reply..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Post anonymously
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setNewComment('');
                        }}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleReply(
                            comment.id,
                            replyTexts[comment.id]
                          )
                        }

                        disabled={
                          submitting ||
                          !replyTexts[comment.id]?.trim()
                        }

                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >

                        <Send className="w-3 h-3" />

                        Reply

                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
        Please sign in to view and post comments
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts, experiences, or ask a question..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300"
            />
            Post anonymously
          </label>
          <button
            onClick={() => handleSubmitComment()}
            disabled={
              submitting ||
              !newComment.trim()
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Post Comment
          </button>
        </div>
      </div>

      {loading ? (

        <div className="text-center py-8 text-gray-600">
          Loading comments...
        </div>

      ) : comments.length === 0 ? (

        <div className="text-center py-8 text-gray-600">
          No comments yet. Be the first to share your thoughts!
        </div>

      ) : (

        <div className="space-y-2">
          {comments.map(comment =>
            renderComment(comment)
          )}
        </div>

      )}

    </div>
  );
}