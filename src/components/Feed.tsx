import { useEffect, useState } from "react";
import dayjs from "dayjs";
import axios from "axios";
import relativeTime from "dayjs/plugin/relativeTime";
import { io } from "socket.io-client";
import { Trash2, Pencil, Save } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import DoctorReviewCard from "../components/DoctorReviewCard";

dayjs.extend(relativeTime);

export default function Feed() {

  const { user } = useAuth();

  if (!user) return <p>Loading user...</p>;

  // ✅ ALWAYS declare states first
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [openComments, setOpenComments] = useState(null);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);

  const [reviewComments, setReviewComments] = useState<any>({});
  const [reviewCommentText, setReviewCommentText] = useState("");
  const [openReviewComments, setOpenReviewComments] = useState(null);

  const [editingReviewCommentId, setEditingReviewCommentId] = useState(null);
  const [editedReviewText, setEditedReviewText] = useState("");

  /* FETCH POSTS */

  const fetchPosts = async () => {

    try {

      const res = await fetch("http://localhost:5000/posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchReviewComments = async (reviewId) => {

    const res = await fetch(
      `http://localhost:5000/api/provider-reviews/${reviewId}/comments`
    );

    const data = await res.json();

    setReviewComments(prev => ({
      ...prev,
      [reviewId]: data
    }));

  };  

  const fetchReviews = async () => {

    try {

      const res = await fetch(
        `http://localhost:5000/api/provider-reviews?user_id=${user.id}`
      );

      if (!res.ok) {

        console.error(
          "Reviews API failed:",
          res.status
        );

        return; // don't clear reviews
      }

      const data = await res.json();

      if (Array.isArray(data)) {

        setReviews(data);

        data.forEach((review) => {
          fetchReviewComments(review.id);
        });

      } else {

        console.warn(
          "Reviews response not array:",
          data
        );

      }

    }

    catch (err) {

      console.error(
        "Fetch reviews error:",
        err
      );

    }

  };

  useEffect(() => {

    console.log("Fetching reviews...");

    fetchPosts();
    fetchReviews();

    const socket = io("http://localhost:5000");

    socket.on("new_comment", () => {
      fetchPosts();
    });

    return () => socket.disconnect();

  }, []);

  // ✅ THEN conditions
  if (postsLoading) {
    return <p>Loading feed...</p>;
  }

  /* LIKE */

  const handleLike = async (postId) => {

    await fetch(`http://localhost:5000/posts/${postId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: user.id
      })
    });

    fetchPosts();

  };

  /* DELETE POST */

  const deletePost = async (postId) => {

    if (!confirm("Delete this post?")) return;

    await fetch(`http://localhost:5000/posts/${postId}`, {
      method: "DELETE"
    });

    fetchPosts();

  };

  /* FETCH COMMENTS */

  const fetchComments = async (postId) => {

    const res = await fetch(`http://localhost:5000/posts/${postId}/comments`);
    const data = await res.json();

    setComments(prev => ({
      ...prev,
      [postId]: data
    }));

  };

  /* TOGGLE COMMENTS */

  const toggleComments = async (postId) => {

    if (openComments === postId) {
      setOpenComments(null);
      return;
    }

    setOpenComments(postId);
    await fetchComments(postId);

  };

  /* ADD COMMENT */

  const addComment = async (postId) => {

    console.log("Logged user:", user);

    if (!commentText.trim()) return;

    await fetch(`http://localhost:5000/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: user.id,
        comment: commentText
      })
    });

    setCommentText("");

    await fetchComments(postId);
    fetchPosts();

  };

  /* DELETE COMMENT */

  const deleteComment = async (commentId, postId) => {

    await fetch(`http://localhost:5000/comments/${commentId}`, {
      method: "DELETE"
    });

    await fetchComments(postId);
    fetchPosts();

  };

  /* EDIT COMMENT */

  const editComment = async (commentId, postId) => {

    await fetch(`http://localhost:5000/comments/${commentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        comment: editedText
      })
    });

    setEditingCommentId(null);
    setEditedText("");

    await fetchComments(postId);
    fetchPosts();

  };

  const sendConnection = async (receiverId: number) => {

    try {

      // ✅ Correct logged-in user
      const senderId = user.id;

      console.log("Sending connection:", {
        sender_id: senderId,
        receiver_id: receiverId
      });

      const res = await fetch(
        "http://localhost:5000/connection/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sender_id: senderId,
            receiver_id: receiverId
          })
        }
      );

      const data = await res.json();

      console.log("Server response:", data);

      if (!res.ok) {
        throw new Error(data.error);
      }

      alert("Connection request sent");

    } catch (err) {

      console.error("Connection error:", err);

      alert("Failed to send connection");

    }

  };

  const handleReviewLike = async (reviewId: string) => {

    try {

      await fetch(
        `http://localhost:5000/api/provider-reviews/${reviewId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: user.id
          })
        }
      );

      fetchReviews(); // refresh reviews

    } catch (err) {

      console.error("Review like error:", err);

    }

  };

  const handleReviewComment = async (reviewId) => {

    if (openReviewComments === reviewId) {

      setOpenReviewComments(null);

    } else {

      setOpenReviewComments(reviewId);

      await fetchReviewComments(reviewId);

    }

  };

  const addReviewComment = async (reviewId) => {

    if (!reviewCommentText.trim())
      return;

    await fetch(
      `http://localhost:5000/api/provider-reviews/${reviewId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: user.id,
          comment: reviewCommentText
        })
      }
    );

    setReviewCommentText("");

    await fetchReviewComments(reviewId);

  };

  const handleDeleteComment = async (commentId) => {

    try {

      await axios.delete(
        `http://localhost:5000/api/provider-reviews/comments/${commentId}`
      );

      // refresh comments
      await fetchReviewComments(openReviewComments);

    } catch (error) {

      console.error(
        "Delete review comment error:",
        error
      );

    }

  };

  const handleEditReviewComment = async (commentId) => {

    try {

      await axios.put(
        `http://localhost:5000/api/provider-reviews/comments/${commentId}`,
        {
          comment: editedReviewText
        }
      );

      setEditingReviewCommentId(null);
      setEditedReviewText("");

      await fetchReviewComments(openReviewComments);

    } catch (error) {

      console.error(
        "Edit review comment error:",
        error
      );

    }

  };

  return (

    <div className="space-y-4">

    {Array.isArray(reviews) &&
    reviews.length > 0 &&
    reviews.map((review: any) => {

      return (

        <div key={review.id} className="mb-4">

          <DoctorReviewCard
            review={review}
            onLike={handleReviewLike}
            onComment={handleReviewComment}
            hasLiked={review.has_liked}
            reviewComments={reviewComments}
          />

          {openReviewComments === review.id && (

            <div className="border-t mt-3 pt-3 bg-white p-4 rounded">

              {(Array.isArray(reviewComments[review.id])
                  ? reviewComments[review.id]
                  : []
                ).map((c: any) => (

                  <div
                    key={c.id}
                    className="flex justify-between items-center mb-2"
                  >

                    {editingReviewCommentId === c.id ? (

                      <div className="flex gap-2 w-full">

                        <input
                          value={editedReviewText}
                          onChange={(e) =>
                            setEditedReviewText(e.target.value)
                          }
                          className="border px-2 py-1 rounded flex-1"
                        />

                        <button
                          onClick={() =>
                            handleEditReviewComment(c.id)
                          }
                          className="text-green-600 text-sm"
                        >
                          💾 Save
                        </button>

                        <button
                          onClick={() => {
                            setEditingReviewCommentId(null);
                            setEditedReviewText("");
                          }}
                          className="text-gray-500 text-sm"
                        >
                          ❌ Cancel
                        </button>

                      </div>

                    ) : (

                      <>
                        <div>

                          <span className="font-semibold">
                            {c.username}
                          </span>

                          <span className="ml-2">
                            {c.comment}
                          </span>

                        </div>

                        <div className="flex gap-2">

                          {/* EDIT BUTTON */}

                          <button
                            onClick={() => {
                              setEditingReviewCommentId(c.id);
                              setEditedReviewText(c.comment);
                            }}
                            className="text-blue-600 text-sm"
                          >
                            ✏️ Edit
                          </button>

                          {/* DELETE BUTTON */}

                          <button
                            onClick={() =>
                              handleDeleteComment(c.id)
                            }
                            className="text-red-600 text-sm"
                          >
                            🗑️ Delete
                          </button>

                        </div>

                      </>

                    )}

                  </div>

                ))}

              {/* Add Comment */}

              <div className="flex gap-2 mt-2">

                <input
                  value={reviewCommentText}
                  onChange={(e) =>
                    setReviewCommentText(e.target.value)
                  }
                  placeholder="Write a comment..."
                  className="border px-2 py-1 rounded flex-1"
                />

                <button
                  onClick={() =>
                    addReviewComment(review.id)
                  }
                  className="bg-blue-500 text-white px-3 rounded"
                >
                  Post
                </button>

              </div>

            </div>

          )}

        </div>

      );

    })}

      {posts.map((post) => {

        const likes = Number(post.like_count || 0);

        return (

          <div key={post.id} className="bg-white p-5 rounded-lg shadow border">

              {/* HEADER */}

              <div className="flex justify-between">

                {/* LEFT SIDE */}

                <div className="flex gap-3">

                  {/* PROFILE ICON */}

                  {post.avatar_url ? (
                    <img
                      src={post.avatar_url}
                      alt="profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      {post.username?.charAt(0)}
                    </div>
                  )}

                  <div>

                    {/* USERNAME */}

                    <div className="flex items-center gap-2">

                      <p className="text-sm font-semibold text-gray-700">
                        {post.username}
                      </p>

                      <span className="text-xs text-gray-400">
                        {dayjs(post.created_at).fromNow()}
                      </span>

                    </div>

                    {/* TITLE */}                    

                    <h2 className="text-lg font-bold mt-1">
                      {post.title}
                    </h2>

                    {/* CONDITION + STATUS */}

                    <div className="flex gap-2 mt-2 flex-wrap">

                      {post.condition && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {post.condition}
                        </span>
                      )}

                      {post.current_status && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {post.current_status}
                        </span>
                      )}

                    </div>

                  </div>

                </div>

                {/* RIGHT SIDE BUTTONS */}

                <div className="flex items-center gap-2">

                  {/* CONNECT BUTTON — ONLY FOR JOURNEY */}

                  {post.condition && post.user_id !== user.id && (

                    <button
                      onClick={() => sendConnection(post.user_id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded">
                      Connect
                    </button>

                  )}

                  {/* DELETE BUTTON — ONLY YOUR POST */}

                  {post.user_id === user.id && (

                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-500"
                    >
                      <Trash2 size={18}/>
                    </button>

                  )}

                </div>

              </div>

              {/* EXTRA INFO */}

              <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">

                {post.diagnosis_date && (
                  <span>
                    📅 Diagnosed:
                    {" "}
                    {dayjs(post.diagnosis_date).format("DD/MM/YYYY")}
                  </span>
                )}

                {post.country && (
                  <span>
                    📍 {post.country}
                  </span>
                )}

              </div>

            {/* LIKE + COMMENT */}

            <div className="flex gap-6 mt-3">

              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-1 text-gray-600 hover:text-red-500">
                ❤️ {likes}
              </button>

              <button onClick={() => toggleComments(post.id)}>
                💬 {Number(post.comment_count || 0)} Comments
              </button>

            </div>

            {/* COMMENTS */}

            {openComments === post.id && (

              <div className="mt-4 border-t pt-3">

                {(comments[post.id] || []).map((c) => (

                  <div key={c.id} className="flex justify-between mb-2">

                    {editingCommentId === c.id ? (

                      <div className="flex gap-2 w-full">

                        <input
                          value={editedText}
                          onChange={(e)=>setEditedText(e.target.value)}
                          className="border px-2 py-1 rounded w-full"
                        />

                        <button
                          onClick={()=>editComment(c.id, post.id)}
                          className="text-green-600"
                        >
                          <Save size={16}/>
                        </button>

                      </div>

                    ) : (

                      <>
                        <div>
                          <span className="font-semibold">{c.username}</span>
                          <span className="ml-1">{c.comment}</span>
                        </div>

                        <div className="flex gap-2">

                          <button
                            onClick={()=>{
                              setEditingCommentId(c.id);
                              setEditedText(c.comment);
                            }}
                          >
                            <Pencil size={16}/>
                          </button>

                          {/* RIGHT SIDE BUTTONS */}

                          <div className="flex items-center gap-2">

                            {/* CONNECT BUTTON */}

                            {post.condition && post.user_id !== user.id && (
                              <button
                                onClick={() => sendConnection(post.user_id)}
                                className="bg-blue-500 text-white px-3 py-1 rounded"
                              >
                                Connect
                              </button>
                            )}

                            {/* DELETE BUTTON */}

                            {post.user_id === user.id && (
                              <button
                                onClick={() => deletePost(post.id)}
                                className="text-red-500"
                              >
                                <Trash2 size={18}/>
                              </button>
                            )}

                          </div>

                        </div>
                      </>

                    )}

                  </div>

                ))}

                {/* ADD COMMENT */}

                <div className="flex gap-2 mt-3">

                  <input
                    value={commentText}
                    onChange={(e)=>setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="border px-2 py-1 rounded flex-1"
                  />

                  <button
                    onClick={()=>addComment(post.id)}
                    className="bg-blue-500 text-white px-3 rounded"
                  >
                    Post
                  </button>

                </div>

              </div>

            )}

          </div>

        );

      })}

    </div>

  );

}