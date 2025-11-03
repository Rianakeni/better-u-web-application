import React, { useState } from "react";
import { Container, Button, Form, Table } from "react-bootstrap";
import useArticles from "./useArticles";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

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
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:1337/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
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
            <tr key={article.id}>
              <td>{article.attributes.title}</td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => navigate(`/articles/edit/${article.id}`)}
                  >
                    edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteArticle(article.id)}
                  >
                    delete
                  </Button>
                </div>
              </td>
              <td>
                <div className="d-flex gap-2 align-items-center">
                  {article.attributes.status}
                  {article.attributes.status === "draft" && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => updateArticle(article.id, "published")}
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
