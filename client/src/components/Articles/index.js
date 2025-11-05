import React, { useState } from "react";
import { Container, Button, Table } from "react-bootstrap";
import useArticles from "./useArticles";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { userData } from "../../helpers";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://radiant-gift-29f5c55e3b.strapiapp.com";

const Articles = () => {
  const { articles, loading, error, deleteArticle, updateArticle } =
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

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Gambar</th>
            <th>Judul artikel</th>
            <th>management</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => {
            // Helper untuk mendapatkan coverImage dari article
            const getCoverImage = (article) => {
              return (
                article?.coverImage || article?.attributes?.coverImage || {}
              );
            };

            const coverImage = getCoverImage(article);
            let imageUrl = null;

            // Handle berbagai format Strapi v4 dan v5 untuk coverImage
            if (coverImage?.data?.attributes?.url) {
              imageUrl = `${API_URL}${coverImage.data.attributes.url}`;
            } else if (coverImage?.data?.url) {
              imageUrl = `${API_URL}${coverImage.data.url}`;
            } else if (coverImage?.attributes?.url) {
              imageUrl = `${API_URL}${coverImage.attributes.url}`;
            } else if (coverImage?.url) {
              imageUrl = coverImage.url.startsWith("http")
                ? coverImage.url
                : `${API_URL}${coverImage.url}`;
            }

            return (
              <tr key={article.id || article.documentId}>
                <td>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={
                        article.attributes?.title || article.title || "Article"
                      }
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      No Image
                    </div>
                  )}
                </td>
                <td>
                  {/* Handle both Strapi v4 (attributes) and v5 (direct) formats */}
                  {article.attributes?.title || article.title || "Untitled"}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/articles/edit/${article.id || article.documentId}`
                        )
                      }
                    >
                      edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        deleteArticle(article.id || article.documentId)
                      }
                    >
                      delete
                    </Button>
                  </div>
                </td>
                <td>
                  <div className="d-flex gap-2 align-items-center">
                    {/* Handle both formats for status */}
                    {article.attributes?.status ||
                      article.status_article ||
                      "draft"}
                    {(article.attributes?.status === "draft" ||
                      article.status_article === "draft") && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() =>
                          updateArticle(
                            article.id || article.documentId,
                            "published"
                          )
                        }
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Container>
  );
};

export default Articles;
