import React from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "./useDashboard";
import { Protector } from "../../helpers";

const API_URL = process.env.REACT_APP_API_URL || "https://ethical-benefit-bb8bd25123.strapiapp.com";

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
          {articles && articles.length ? (
            <div className="hero-card">
              <div className="hero-text">
                <h2>{articles[0].attributes.title}</h2>
                <p>
                  {articles[0].attributes.excerpt ||
                    articles[0].attributes.content ||
                    ""}
                </p>
                <button className="read-more">Read more</button>
              </div>
              <div className="hero-image">
                {articles[0].attributes.image?.data?.attributes?.url ? (
                  <img
                    src={`${API_URL}${articles[0].attributes.image.data.attributes.url}`}
                    alt={articles[0].attributes.title}
                  />
                ) : null}
              </div>
            </div>
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
