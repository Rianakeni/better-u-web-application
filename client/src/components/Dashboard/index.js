import React from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "./useDashboard";
import { Protector } from "../../helpers";

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
            href={`https://ethical-benefit-bb8bd25123.strapiapp.com/api/${
              attrs.medical_record.data.attributes.filePDF?.data?.attributes
                ?.url || ""
            }`}
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

const Dashboard = () => {
  const token = localStorage.getItem("jwt"); // Ambil token dari localStorage
  const { profile, upcoming, history, articles, loading, error } =
    useDashboard(token);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
          <h3>Latest Articles</h3>
          <div className="articles-grid">
            {articles.slice(0, 2).map((article) => {
              const attrs = article.attributes || {};
              return (
                <div key={article.id} className="hero-card">
                  <div className="hero-text">
                    <h2>{attrs.title || "No Title"}</h2>
                    <p>{attrs.excerpt || "No excerpt available"}</p>
                    <Link to={`/articles`} className="read-more">
                      Read More
                    </Link>
                  </div>
                  <div className="hero-image">
                    {attrs.coverImage?.data?.attributes?.url && (
                      <img
                        src={`https://ethical-benefit-bb8bd25123.strapiapp.com/api/articles/${attrs.coverImage.data.attributes.url}`}
                        alt={
                          attrs.coverImage.data.attributes.alternativeText || ""
                        }
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Protector
  ? (props) => <Protector Component={<Dashboard {...props} />} />
  : Dashboard;
