import React, { useState } from "react";
import { useDashboard } from "./useDashboard";
import { Protector } from "../../helpers";
import { FaCalendarAlt, FaClock, FaUserMd } from "react-icons/fa";
import ReactLoading from "react-loading";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://radiant-gift-29f5c55e3b.strapiapp.com";

const SmallItem = ({ item, type }) => {
  // Strapi v5: data langsung di root, tidak ada attributes wrapper
  // Support both v4 (with attributes) and v5 (without attributes)
  const attrs = item.attributes || item || {};

  // Strapi v5: populate langsung di root, tidak ada .data.attributes
  // Support both formats (v4: schedule.data.attributes, v5: schedule.data atau schedule)
  const schedule =
    attrs.schedule?.data?.attributes ||
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

  return (
    <div
      className={`dash-item ${type === "upcoming" ? "upcoming" : "history"}`}
    >
      <div className="dash-item-left">
        <div className="dash-row dash-date">
          <FaCalendarAlt className="dash-icon" aria-hidden="true" />
          <span className="dash-text">{dateStr}</span>
        </div>

        <div className="dash-row dash-time">
          <FaClock className="dash-icon" aria-hidden="true" />
          <span className="dash-text">{timeStr}</span>
        </div>

        <div className="dash-row dash-doctor">
          <FaUserMd className="dash-icon" aria-hidden="true" />
          <span className="dash-text">{konselor}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ token }) => {
  // Gunakan prop token yang sudah dikirim dari App.js
  const { profile, upcoming, history, articles, loading, error } =
    useDashboard(token);

  // State untuk melacak artikel yang diperluas (expanded)
  const [expandedArticleId, setExpandedArticleId] = useState(null);

  // Handler untuk toggle expand/collapse artikel
  const handleReadMore = (articleId) => {
    setExpandedArticleId(expandedArticleId === articleId ? null : articleId);
  };

  if (loading)
    return (
      <div className="loading-overlay">
        <ReactLoading type="spin" color="#3182ce" height={50} width={50} />
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  // Helper untuk mendapatkan data artikel
  const getArticleData = (article) => {
    return article?.attributes || article || {};
  };

  return (
    <div className="dashboard-layout">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Selamat Datang, {profile?.username || "User"}!</h1>
          <p className="dashboard-sub">
            Kami ada di sini untuk menemani perjalananmu menjaga pikiran dan
            perasaan tetap sehat.
          </p>
        </header>

        <section className="panels">
          <div className="panel schedule-panel">
            <h3>Jadwal Saya</h3>
            <div className="panel-body">
              {loading ? (
                <p>Loading...</p>
              ) : upcoming.length ? (
                upcoming.map((item) => (
                  <SmallItem key={item.id} item={item} type="upcoming" />
                ))
              ) : (
                <p>Tidak ada jadwal</p>
              )}
            </div>
          </div>

          <div className="panel history-panel">
            <h3>Riwayat</h3>
            <div className="panel-body">
              {loading ? (
                <p>Loading...</p>
              ) : history.length ? (
                history.map((item) => (
                  <SmallItem key={item.id} item={item} type="history" />
                ))
              ) : (
                <p>Tidak ada riwayat</p>
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
              const articleId = article.id || article.documentId;
              const isExpanded = expandedArticleId === articleId;

              // Helper untuk mendapatkan coverImage dari article
              const getCoverImage = (article) => {
                return (
                  article?.coverImage ||
                  article?.attributes?.coverImage ||
                  getArticleData(article).coverImage
                );
              };

              const coverImage = getCoverImage(article);
              let imageUrl = null;

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

              // Tambahkan cache-busting parameter untuk force refresh gambar
              // Menggunakan timestamp update article atau timestamp saat ini
              if (imageUrl) {
                const updatedAt =
                  article.attributes?.updatedAt ||
                  article.updatedAt ||
                  Date.now();
                const separator = imageUrl.includes("?") ? "&" : "?";
                imageUrl = `${imageUrl}${separator}t=${updatedAt}`;
              }

              return (
                <div key={articleId} className="hero-card">
                  <div className="hero-text">
                    <h2>{articleData.title || article.title || "Untitled"}</h2>
                    <p>
                      {articleData.excerpt ||
                        article.excerpt ||
                        articleData.content ||
                        article.content ||
                        ""}
                    </p>
                    <button
                      className="read-more"
                      onClick={() => handleReadMore(articleId)}
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>

                    {/* Expandable content section - di dalam card */}
                    {isExpanded && (
                      <div
                        className="article-expanded-content"
                        style={{
                          marginTop: "1.5rem",
                          paddingTop: "1.5rem",
                          borderTop: "1px solid #dee2e6",
                        }}
                      >
                        {/* Author info jika ada */}
                        {(getArticleData(article).authorName ||
                          article.authorName) && (
                          <p
                            style={{
                              color: "#666",
                              fontSize: "0.9rem",
                              marginBottom: "1rem",
                            }}
                          >
                            By:{" "}
                            {getArticleData(article).authorName ||
                              article.authorName}
                          </p>
                        )}

                        {/* Image jika ada */}
                        {imageUrl && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            <img
                              key={`${articleId}-expanded-${
                                article.attributes?.updatedAt ||
                                article.updatedAt ||
                                Date.now()
                              }`}
                              src={imageUrl}
                              alt={
                                getArticleData(article).title ||
                                article.title ||
                                "Article"
                              }
                              style={{
                                maxWidth: "600px",
                                maxHeight: "400px",
                                width: "auto",
                                height: "auto",
                                objectFit: "cover",
                                borderRadius: "8px",
                                justifyContent: "center",
                                alignContent: "center",
                              }}
                            />
                          </div>
                        )}

                        {/* Full content */}
                        <div
                          style={{
                            lineHeight: "1.8",
                            fontSize: "1rem",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {getArticleData(article).content ||
                            article.content ||
                            getArticleData(article).excerpt ||
                            article.excerpt ||
                            "No content available."}
                        </div>

                        {/* Published date jika ada */}
                        {(getArticleData(article).publishedAt ||
                          article.publishedAt) && (
                          <p
                            style={{
                              color: "#666",
                              fontSize: "0.85rem",
                              marginTop: "1.5rem",
                            }}
                          >
                            Published:{" "}
                            {new Date(
                              getArticleData(article).publishedAt ||
                                article.publishedAt
                            ).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Sembunyikan gambar ketika expanded (read more diklik) */}
                  {!isExpanded && (
                    <div className="hero-image">
                      {/* Tampilkan gambar dari API jika ada, jika tidak pakai placeholder */}
                      {imageUrl ? (
                        <img
                          key={`${articleId}-${
                            article.attributes?.updatedAt ||
                            article.updatedAt ||
                            Date.now()
                          }`}
                          src={imageUrl}
                          alt={articleData.title || article.title || "Article"}
                          style={{
                            maxWidth: "200px",
                            maxHeight: "200px",
                            width: "auto",
                            height: "auto",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      ) : (
                        <img
                          src="/mental-wellness.png"
                          alt="Article"
                          style={{
                            maxWidth: "200px",
                            maxHeight: "200px",
                            width: "auto",
                            height: "auto",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      )}
                    </div>
                  )}
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
    </div>
  );
};

export default Protector
  ? (props) => <Protector Component={<Dashboard {...props} />} />
  : Dashboard;
