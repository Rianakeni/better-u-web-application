import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const useArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch articles
  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:1337/api/articles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setArticles(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      if (err.response?.status === 403) {
        navigate("/login");
      }
    }
  };

  // Add new article
  const addArticle = async (title) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:1337/api/articles",
        {
          data: {
            title,
            status: "draft",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchArticles(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete article
  const deleteArticle = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:1337/api/articles/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchArticles(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  // Update article
  const updateArticle = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:1337/api/articles/${id}`,
        {
          data: {
            status,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchArticles(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return {
    articles,
    loading,
    error,
    addArticle,
    deleteArticle,
    updateArticle,
  };
};

export default useArticles;
