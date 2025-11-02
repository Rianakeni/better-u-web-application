import React from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "./useDashboard";
import { Protector } from "../../helpers";

const SmallItem = ({ item, type }) => {
  const attrs = item.attributes || {};
  const date = attrs.date
    ? new Date(attrs.date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";
  const time =
    attrs.start_time && attrs.end_time
      ? `${attrs.start_time} - ${attrs.end_time}`
      : "-";
  const doctor = attrs.doctor?.data?.attributes?.name || attrs.doctor || "-";

  return (
    <div
      className={`dash-item ${type === "upcoming" ? "upcoming" : "history"}`}
    >
      <div className="dash-item-left">
        <div className="dash-item-date">{date}</div>
        <div className="dash-item-time">{time}</div>
      </div>
      <div className="dash-item-right">
        <div className="dash-item-doctor">{doctor}</div>
        {type === "history" && attrs.media?.data?.length ? (
          <a
            className="download-btn"
            href={`http://localhost:1337${attrs.media.data[0].attributes.url}`}
            target="_blank"
            rel="noreferrer"
          >
            download rekam medis
          </a>
        ) : null}
      </div>
    </div>
  );
};

const Dashboard = ({ token }) => {
  const { profile, upcoming, history, articles, loading } = useDashboard(token);

  return (
    <div className="dashboard-layout">
      {/* <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          <div className="avatar-placeholder" />
          <div className="user-name">
            {profile?.username || "Nama Pengguna"}
          </div>
          <div className="user-id">{profile?.studentId || ""}</div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className="active">
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/booking">Booking Janji</Link>
            </li>
            <li>
              <Link to="/jadwal">Jadwal Anda</Link>
            </li>
            <li>
              <Link to="/dashboard?tab=riwayat">Riwayat</Link>
            </li>
            <li>
              <Link to="/profile">Profil</Link>
            </li>
          </ul>
        </nav>
        <div className="sidebar-logout">
          <Link to="/logout">Log out</Link>
        </div>
      </aside> */}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Selamat Datang, {profile?.username || "Pengguna"}!</h1>
          <p className="dashboard-sub">
            Kami ada di sini untuk menemani perjalananmu menjaga pikiran dan
            perasaan tetap sehat. Jangan ragu untuk berbagi cerita, menemukan
            solusi, dan mendapatkan dukungan yang kamu butuhkan.
          </p>
        </header>

        <section className="panels" background="#1a5b26ff">
          <div className="panel schedule-panel">
            <h3>your schedule</h3>
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
            <h3>your history</h3>
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
                    src={`http://localhost:1337${articles[0].attributes.image.data.attributes.url}`}
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
