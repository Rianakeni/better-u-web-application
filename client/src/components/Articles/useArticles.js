import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { userData } from "../../helpers";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

const useArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch articles
  const fetchArticles = async () => {
    try {
      const { jwt } = userData();
      const response = await axios.get(`${API_URL}/api/articles`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      // Normalize data - handle both Strapi v4 and v5 formats
      const normalizedArticles = (response.data.data || []).map(article => {
        // If already has attributes (v4), return as is
        if (article.attributes) {
          return article;
        }
        // If direct format (v5), wrap in attributes for consistency
        return {
          id: article.id || article.documentId,
          attributes: {
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            status: article.status_article || article.status,
            ...article
          }
        };
      });
      
      setArticles(normalizedArticles);
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
      const { jwt } = userData();
      await axios.post(
        `${API_URL}/api/articles`,
        {
          data: {
            title,
            status: "draft",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
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
      const { jwt } = userData();
      await axios.delete(`${API_URL}/api/articles/${id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
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
      const { jwt } = userData();
      await axios.put(
        `${API_URL}/api/articles/${id}`,
        {
          data: {
            status,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
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
