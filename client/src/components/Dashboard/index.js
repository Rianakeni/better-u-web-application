import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "./useDashboard";
import { Protector } from "../../helpers";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

const SmallItem = ({ item, type }) => {
  // Strapi v5: data langsung di root, tidak ada attributes wrapper
  // Support both v4 (with attributes) and v5 (without attributes)
  const attrs = item.attributes || item || {};
  
  // Strapi v5: populate langsung di root, tidak ada .data.attributes
  // Support both formats (v4: schedule.data.attributes, v5: schedule.data atau schedule)
  const schedule = attrs.schedule?.data?.attributes || 
                   attrs.schedule?.data || 
                   attrs.schedule || 
                   {};

  // Ambil tanggal, jam_mulai, jam_selesai dari schedule
  const tanggal = schedule.tanggal;
  const jam_mulai = schedule.jam_mulai;
  const jam_selesai = schedule.jam_selesai;
  
  // Konselor: support both v4 and v5 format
  const konselor =
    attrs.konselor?.data?.attributes?.username ||
    attrs.konselor?.data?.username ||
    attrs.konselor?.username ||
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

  // Medical record: support both v4 and v5 format
  const medicalRecord = attrs.medical_record?.data?.attributes ||
                        attrs.medical_record?.data ||
                        attrs.medical_record;
  
  // Media/File: support both v4 and v5 format
  const mediaFile = attrs.media?.data?.[0]?.attributes ||
                   attrs.media?.data?.[0] ||
                   attrs.filePDF?.data?.attributes ||
                   attrs.filePDF?.data ||
                   medicalRecord?.filePDF?.data?.attributes ||
                   medicalRecord?.filePDF?.data;

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
        {type === "history" && (medicalRecord?.id || medicalRecord?.documentId || mediaFile?.url) ? (
          <a
            className="download-btn"
            href={`${API_URL}${mediaFile?.url || ''}`}
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

        <section className="panels">
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
                    {/* Placeholder image - tidak fetch image dari API */}
                    <img src="/mental-wellness.png" alt="Article" />
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
              {(() => {
                // Helper untuk mendapatkan coverimage dari article
                const getCoverimage = (article) => {
                  return article?.coverimage || 
                         article?.attributes?.coverimage ||
                         getArticleData(article).coverimage;
                };
                
                const coverimage = getCoverimage(selectedArticle);
                let imageUrl = null;
                
                if (coverimage?.data?.attributes?.url) {
                  imageUrl = `${API_URL}${coverimage.data.attributes.url}`;
                } else if (coverimage?.attributes?.url) {
                  imageUrl = `${API_URL}${coverimage.attributes.url}`;
                } else if (coverimage?.url) {
                  imageUrl = coverimage.url.startsWith('http') ? coverimage.url : `${API_URL}${coverimage.url}`;
                }
                
                return imageUrl ? (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <img
                      src={imageUrl}
                      alt={getArticleData(selectedArticle).title || selectedArticle.title || "Article"}
                      style={{ width: "100%", borderRadius: "8px" }}
                    />
                  </div>
                ) : null;
              })()}

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
