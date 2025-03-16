import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const videoId = "igvWE1vDPCc";
  const [videoData, setVideoData] = useState(null);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [commentId, setCommentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = "https://cactro-youtube.onrender.com"; // Backend URL

  // Set Axios to send cookies with requests
  axios.defaults.withCredentials = true;

  useEffect(() => {
    checkAuthentication();
  }, []);

  // Check authentication status
  const checkAuthentication = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/video/${videoId}`);
      setVideoData(response.data);
      setTitle(response.data.snippet.title);
      setIsAuthenticated(true);
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage("Please log in to access this feature.");
        setIsAuthenticated(false);
      } else {
        setMessage("Error fetching video details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/url`);
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Failed to initiate login.");
    }
  };

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/video/${videoId}`);
      setVideoData(response.data);
      setTitle(response.data.snippet.title);
      setMessage("Video details fetched successfully!");
    } catch (error) {
      setMessage(
        error.response?.status === 401
          ? "Unauthorized. Please log in."
          : "Failed to fetch video details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      setMessage("Comment cannot be empty.");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/comment/${videoId}`, { comment });
      const newCommentId = response.data.id;
      setCommentId(newCommentId);
      setComment("");
      setMessage("Comment added successfully!");
    } catch (error) {
      setMessage(
        error.response?.status === 401
          ? "Unauthorized. Please log in."
          : "Failed to add comment."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!title.trim()) {
      setMessage("Title cannot be empty.");
      return;
    }
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/video/${videoId}`, { title });
      setMessage("Title updated successfully!");
      fetchVideoDetails();
    } catch (error) {
      setMessage(
        error.response?.status === 401
          ? "Unauthorized. Please log in."
          : "Failed to update title."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentId) {
      setMessage("No comment to delete.");
      return;
    }
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/comment/${commentId}`);
      setCommentId("");
      setMessage("Comment deleted successfully!");
    } catch (error) {
      setMessage(
        error.response?.status === 401
          ? "Unauthorized. Please log in."
          : "Failed to delete comment."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("code")) {
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, "/");
      fetchVideoDetails();
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div>
        <h1>YouTube Mini App</h1>
        <p>{message || "Please log in to continue."}</p>
        <button onClick={handleLogin}>Login with Google</button>
      </div>
    );
  }

  if (!videoData) return <div>Loading video data...</div>;

  return (
    <div className="App">
      <h1>YouTube Mini App</h1>
      {message && (
        <p style={{ color: message.includes("Failed") || message.includes("Unauthorized") ? "red" : "green" }}>
          {message}
        </p>
      )}
      <div>
        <h2>Video Details</h2>
        <p><strong>Title:</strong> {videoData.snippet.title}</p>
        <p><strong>Description:</strong> {videoData.snippet.description || "No description available."}</p>
      </div>
      <div>
        <h3>Update Title</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          placeholder="Enter new title"
        />
        <button onClick={handleUpdateTitle} disabled={loading}>
          {loading ? "Updating..." : "Update Title"}
        </button>
      </div>
      <div>
        <h3>Add Comment</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
          placeholder="Write your comment here..."
        />
        <button onClick={handleAddComment} disabled={loading}>
          {loading ? "Posting..." : "Post Comment"}
        </button>
        {commentId && (
          <button onClick={handleDeleteComment} disabled={loading}>
            {loading ? "Deleting..." : "Delete Comment"}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;