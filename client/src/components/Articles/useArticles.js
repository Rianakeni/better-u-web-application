import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStrapiClient, strapiAxios } from "../../lib/strapiClient";

const useArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch articles
  const fetchArticles = async () => {
    try {
      // Gunakan axios langsung untuk articles dengan publicationState
      const { data: articlesData } = await strapiAxios.get('/articles?publicationState=live');
      
      // Normalize data - handle both Strapi v4 and v5 formats
      const normalizedArticles = (articlesData?.data || []).map(article => {
        if (article.attributes) {
          return article;
        }
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
      const client = getStrapiClient();
      await client.collection('articles').create({
        data: {
          title,
          status: "draft",
        },
      });
      fetchArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete article
  const deleteArticle = async (id) => {
    try {
      const client = getStrapiClient();
      await client.collection('articles').delete(id);
      fetchArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  // Update article
  const updateArticle = async (id, status) => {
    try {
      const client = getStrapiClient();
      await client.collection('articles').update(id, {
        data: { status },
      });
      fetchArticles();
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
