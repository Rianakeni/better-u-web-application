import React from "react";
import { FaQuoteLeft } from "react-icons/fa"; // Menggunakan ikon kutipan

const QuoteCard = () => {
  // Objek style untuk CSS inline
  const styles = {
    cardContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "20px 0",
      padding: "10px",
    },
    card: {
      background: "linear-gradient(135deg, #b6f6c2, #3182ce)", // Gradasi dari hijau muda ke biru
      padding: "40px 30px",
      borderRadius: "15px",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      position: "relative",
    },
    icon: {
      fontSize: "50px",
      color: "#ffffffff",
      marginBottom: "15px",
    },
    quoteText: {
      fontSize: "1.5rem",
      fontWeight: "600",
      lineHeight: "1.6",
      fontStyle: "italic",
      color: "#ffffffff", // Hijau tua untuk teks
      maxWidth: "90%",
      marginBottom: "10px",
      textAlign: "center",
    },
    beforeEffect: {
      content: '""',
      position: "absolute",
      top: "-15px",
      left: "0",
      right: "0",
      height: "10px",
      backgroundColor: "#010202ff", // Garis pemisah hijau tua
      borderRadius: "8px 8px 0 0",
    },
    hoverEffect: {
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
      transform: "translateY(-5px)",
      transition: "transform 0.2s ease, box-shadow 0.3s ease",
    },
  };

  return (
    <div style={styles.cardContainer}>
      <div style={styles.card}>
        <div style={styles.icon}>
          <FaQuoteLeft />
        </div>
        <p style={styles.quoteText}>
          "Going to Therapy is a strength, not a weakness"
        </p>
      </div>
    </div>
  );
};

export default QuoteCard;
