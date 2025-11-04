import React, { useState } from "react";
import { Container, Button, Form, Table } from "react-bootstrap";
import useArticles from "./useArticles";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { userData } from "../../helpers";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

const Articles = () => {
  const { articles, loading, error, addArticle, deleteArticle, updateArticle } =
    useArticles();
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is a counselor
    const checkRole = async () => {
      try {
        const { jwt } = userData();
        if (!jwt) {
          navigate("/login");
          return;
        }
        
        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        const data = await response.json();

        if (data.role?.type === "konselor") {
          setIsAuthorized(true);
        } else {
          navigate("/");
        }
      } catch (err) {
        navigate("/login");
      }
    };

    checkRole();
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newArticleTitle.trim()) {
      addArticle(newArticleTitle);
      setNewArticleTitle("");
    }
  };

  if (!isAuthorized) {
    return <div>Checking authorization...</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Manajemen Artikel</h1>

      <Form onSubmit={handleSubmit} className="mb-4">
        <div className="d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="Judul artikel"
            value={newArticleTitle}
            onChange={(e) => setNewArticleTitle(e.target.value)}
          />
          <Button type="submit" variant="success">
            + Tambahkan artikel baru
          </Button>
        </div>
      </Form>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Judul artikel</th>
            <th>management</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id || article.documentId}>
              <td>
                {/* Handle both Strapi v4 (attributes) and v5 (direct) formats */}
                {article.attributes?.title || article.title || "Untitled"}
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => navigate(`/articles/edit/${article.id || article.documentId}`)}
                  >
                    edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteArticle(article.id || article.documentId)}
                  >
                    delete
                  </Button>
                </div>
              </td>
              <td>
                <div className="d-flex gap-2 align-items-center">
                  {/* Handle both formats for status */}
                  {article.attributes?.status || article.status_article || "draft"}
                  {(article.attributes?.status === "draft" || article.status_article === "draft") && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => updateArticle(article.id || article.documentId, "published")}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default Articles;
