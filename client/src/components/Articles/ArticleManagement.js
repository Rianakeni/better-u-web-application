import React, { useState } from "react";
import { Button, FormGroup, Input, Label } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { userData } from "../../helpers";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

const ArticleManagement = ({ onArticleCreated }) => {
  // State untuk menyimpan input judul artikel
  const [title, setTitle] = useState("");
  // State untuk menyimpan input konten artikel
  const [content, setContent] = useState("");
  // Mengambil JWT token dari helper userData untuk autentikasi API
  const { jwt } = userData();


  const handleSubmit = async (e) => {
    // Mencegah behavior default form submission (page refresh)
    e.preventDefault();
    // Validasi: Pastikan judul dan konten tidak kosong
    if (!title || !content) {
      toast.error("Judul dan Konten tidak boleh kosong");
      return;
    }

    try {
      // Mengirim POST request ke Strapi API untuk membuat artikel baru
      await axios.post(
        `${API_URL}/api/articles`, // Endpoint Strapi untuk articles collection
        {
          data: {
            title: title,      // Judul artikel dari state
            content: content,  // Konten artikel dari state
            // Note: Strapi V4 membutuhkan format 'data' sebagai wrapper
          },
        },
        {
          // Header untuk autentikasi menggunakan JWT Bearer token
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      // Tampilkan notifikasi sukses jika artikel berhasil dibuat
      toast.success("Artikel berhasil dibuat!");
      
      // Reset form: Kosongkan input judul dan konten
      setTitle("");
      setContent("");
      
      // Panggil callback function jika tersedia
      // Biasanya digunakan untuk me-refresh daftar artikel di parent component
      if (onArticleCreated) {
        onArticleCreated();
      }
    } catch (error) {
      // Tangkap error dan tampilkan notifikasi error dengan pesan detail
      toast.error("Gagal membuat artikel: " + error.message);
    }
  };

  return (
    <div
      className="article-management"
      style={{
        background: "#f4f4f4",      // Background abu-abu terang
        padding: "20px",            // Padding dalam container
        borderRadius: "8px",        // Sudut membulat
        marginBottom: "30px",       // Jarak bawah dari elemen lain
      }}
    >
      {/* Header/Title untuk section manajemen artikel */}
      <h4>Manajemen Artikel (Konselor)</h4>
      
      {/* Form Group untuk input judul artikel */}
      <FormGroup>
        <Label for="title">Judul Artikel</Label>
        <Input
          type="text"                                    // Input tipe text
          id="title"                                     // ID untuk label accessibility
          value={title}                                  // Controlled component: nilai dari state
          onChange={(e) => setTitle(e.target.value)}    // Update state saat user mengetik
          placeholder="Tulis judul..."                   // Placeholder text
        />
      </FormGroup>
      
      {/* Form Group untuk input konten artikel */}
      <FormGroup>
        <Label for="content">Konten</Label>
        <Input
          type="textarea"                                  // Input tipe textarea untuk konten panjang
          id="content"                                     // ID untuk label accessibility
          value={content}                                  // Controlled component: nilai dari state
          onChange={(e) => setContent(e.target.value)}    // Update state saat user mengetik
          placeholder="Tulis konten artikel..."            // Placeholder text
          rows={5}                                         // Tinggi textarea (5 baris)
        />
      </FormGroup>
      
      {/* Button untuk submit/publish artikel */}
      <Button 
        color="primary"      // Warna button primary (biru)
        onClick={handleSubmit}  // Handler saat button diklik
      >
        Publish Artikel
      </Button>
    </div>
  );
};

// Export komponen sebagai default export
export default ArticleManagement;
