import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "./useDashboard";
import { Protector } from "../../helpers";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

const SmallItem = ({ item, type }) => {
  // Ambil data dari appointment
  const attrs = item.attributes || {};
  // Ambil data schedule yang direlasikan
  const schedule = attrs.schedule?.data?.attributes || {};

  // Ambil tanggal, jam_mulai, jam_selesai dari schedule
  const tanggal = schedule.tanggal;
  const jam_mulai = schedule.jam_mulai;
  const jam_selesai = schedule.jam_selesai;
  // Ambil nama konselor
  const konselor =
    attrs.konselor?.data?.attributes?.username ||
    attrs.konselor ||
    "dr. konselor";

  const dateStr = tanggal
    ? new Date(tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const timeStr =
    jam_mulai && jam_selesai ? `${jam_mulai} - ${jam_selesai}` : "-";

  return (
    <div
      className={`dash-item ${type === "upcoming" ? "upcoming" : "history"}`}
    >
      <div className="dash-item-left">
        <div className="dash-item-date">{dateStr}</div>
        <div className="dash-item-time">{timeStr}</div>
        <div className="dash-item-doctor">{konselor}</div>
      </div>
      <div className="dash-item-right">
        {type === "history" && attrs.medical_record?.data?.id ? (
          <a
            className="download-btn"
            href={`${API_URL}${attrs.media.data[0].attributes.url}`}
            target="_blank"
            rel="noreferrer"
          >
            Download
          </a>
        ) : null}
      </div>
    </div>
  );
};

const Dashboard = ({ token }) => {
  // Gunakan prop token yang sudah dikirim dari App.js
  const { profile, upcoming, history, articles, loading, error } =
    useDashboard(token);
  
  // State untuk modal artikel
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handler untuk membuka modal dengan artikel yang dipilih
  const handleReadMore = (article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  // Handler untuk menutup modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setSelectedArticle(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Handle article data untuk modal
  const getArticleData = (article) => {
    return article?.attributes || article || {};
  };

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Welcome, {profile?.username || "User"}!</h1>
          <p className="dashboard-sub">
            Kami ada di sini untuk menemani perjalananmu menjaga pikiran dan
            perasaan tetap sehat.
          </p>
        </header>

        <section className="panels" style={{ background: "#1a5b26ff" }}>
          <div className="panel schedule-panel">
            <h3>Your Schedule</h3>
            <div className="panel-body">
              {loading ? (
                <p>Loading...</p>
              ) : upcoming.length ? (
                upcoming.map((item) => (
                  <SmallItem key={item.id} item={item} type="upcoming" />
                ))
              ) : (
                <p>No upcoming appointments</p>
              )}
            </div>
          </div>

          <div className="panel history-panel">
            <h3>Your History</h3>
            <div className="panel-body">
              {loading ? (
                <p>Loading...</p>
              ) : history.length ? (
                history.map((item) => (
                  <SmallItem key={item.id} item={item} type="history" />
                ))
              ) : (
                <p>No history found</p>
              )}
            </div>
          </div>
        </section>

        <section className="hero-articles">
          {articles && articles.length > 0 ? (
            // Tampilkan semua artikel yang published
            articles.map((article) => {
              // Handle both formats - data di root atau di attributes
              const articleData = article.attributes || article;
              
              return (
                <div key={article.id || article.documentId} className="hero-card">
                  <div className="hero-text">
                    <h2>{articleData.title || article.title || "Untitled"}</h2>
                    <p>
                      {articleData.excerpt || article.excerpt || 
                       articleData.content || article.content || 
                       ""}
                    </p>
                    <button 
                      className="read-more"
                      onClick={() => handleReadMore(article)}
                    >
                      Read more
                    </button>
                  </div>
                  <div className="hero-image">
                    {(articleData.image?.data?.attributes?.url || 
                      article.image?.data?.attributes?.url) ? (
                      <img
                        src={`${API_URL}${articleData.image?.data?.attributes?.url || 
                          article.image?.data?.attributes?.url}`}
                        alt={articleData.title || article.title || "Article"}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="hero-card placeholder">
              <div className="hero-text">
                <h2>Menjaga Kesehatan Mental di Era Modern</h2>
                <p>
                  Kesehatan mental adalah salah satu aspek penting dalam
                  kehidupan yang sering kali terlupakan. Di era modern yang
                  penuh tekanan, mulai dari tuntutan akademik, pekerjaan, hingga
                  media sosial.
                </p>
                <button className="read-more">Read more</button>
              </div>
              <div className="hero-image">
                <img src="/mental-wellness.png" alt="mental" />
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modal untuk menampilkan detail artikel */}
      <Modal isOpen={isModalOpen} toggle={toggleModal} size="lg">
        <ModalHeader toggle={toggleModal}>
          {selectedArticle ? (
            getArticleData(selectedArticle).title || 
            selectedArticle.title || 
            "Article"
          ) : "Article Detail"}
        </ModalHeader>
        <ModalBody>
          {selectedArticle && (
            <>
              {/* Author info jika ada */}
              {(getArticleData(selectedArticle).authorName || 
                selectedArticle.authorName) && (
                <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>
                  By: {getArticleData(selectedArticle).authorName || selectedArticle.authorName}
                </p>
              )}

              {/* Image jika ada */}
              {(getArticleData(selectedArticle).image?.data?.attributes?.url ||
                selectedArticle.image?.data?.attributes?.url) && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <img
                    src={`${API_URL}${getArticleData(selectedArticle).image?.data?.attributes?.url ||
                      selectedArticle.image?.data?.attributes?.url}`}
                    alt={getArticleData(selectedArticle).title || selectedArticle.title || "Article"}
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                </div>
              )}

              {/* Full content */}
              <div 
                style={{ 
                  lineHeight: "1.8", 
                  fontSize: "1rem",
                  whiteSpace: "pre-wrap" // Preserve line breaks if content is markdown/text
                }}
              >
                {getArticleData(selectedArticle).content || 
                 selectedArticle.content || 
                 getArticleData(selectedArticle).excerpt ||
                 selectedArticle.excerpt ||
                 "No content available."}
              </div>

              {/* Published date jika ada */}
              {(getArticleData(selectedArticle).publishedAt || 
                selectedArticle.publishedAt) && (
                <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "1.5rem" }}>
                  Published: {new Date(
                    getArticleData(selectedArticle).publishedAt || 
                    selectedArticle.publishedAt
                  ).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Protector
  ? (props) => <Protector Component={<Dashboard {...props} />} />
  : Dashboard;
