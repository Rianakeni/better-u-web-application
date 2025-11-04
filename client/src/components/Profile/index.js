import React, { useState, useEffect } from "react";
import { IoPersonCircleOutline } from "react-icons/io5";
import UpoloadAvatar from "./UploadAvatar";
import { fetchCurrentUser } from "../../lib/strapiClient";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

// Generate random avatar URL menggunakan DiceBear API
const generateRandomAvatar = (seed = null) => {
  const randomSeed = seed || Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
};

const Profile = ({ token }) => {
  const [user, setUser] = useState({});
  const [isUserUpdated, setisUserUpdated] = useState(false);
  const [dummyAvatarSeed, setDummyAvatarSeed] = useState(() => {
    // Generate initial seed berdasarkan username atau random
    return Math.random().toString(36).substring(7);
  });

  useEffect(() => {
    const getProfileData = async () => {
      try {
        const data = await fetchCurrentUser();
        
        // Handle Strapi v5 format: avatar sebagai relation
        // Support both formats: avatarUrl (direct) dan avatar (relation)
        let avatarUrl = null;
        
        if (data?.avatarUrl) {
          // Direct avatarUrl field (Strapi v4 style)
          avatarUrl = data.avatarUrl;
        } else if (data?.avatar) {
          // Avatar sebagai relation (Strapi v5 style)
          const avatar = data.avatar?.data?.attributes || data.avatar?.data || data.avatar;
          avatarUrl = avatar?.url || avatar?.attributes?.url;
        }
        
        // Set user dengan avatarUrl yang sudah di-normalize
        setUser({
          ...data,
          avatarUrl: avatarUrl
        });
        
        // Generate initial dummy avatar seed berdasarkan username jika ada
        if (data?.username && !dummyAvatarSeed) {
          setDummyAvatarSeed(data.username);
        }
        
        setisUserUpdated(false);
      } catch (error) {
        // Error handled silently
      }
    };
    getProfileData();
  }, [token, isUserUpdated]);

  // Handler untuk klik avatar - random avatar baru
  const handleAvatarClick = () => {
    // Generate seed baru untuk random avatar
    const newSeed = Math.random().toString(36).substring(7);
    setDummyAvatarSeed(newSeed);
  };

  // Get avatar URL - jika ada uploaded avatar, pakai itu, kalau tidak pakai dummy
  const getAvatarUrl = () => {
    if (user.avatarUrl) {
      return `${API_URL}${user.avatarUrl}`;
    }
    return generateRandomAvatar(dummyAvatarSeed);
  };

  return (
    <div className="profile">
      <div className="avatar">
        <div className="avatar-wrapper">
          <img
            src={getAvatarUrl()}
            alt={`${user.username || 'User'} avatar`}
            onClick={handleAvatarClick}
            style={{ cursor: 'pointer' }}
            title="Klik untuk ganti avatar dummy"
          />
        </div>
      </div>
      <div className="body">
        <p>Name: {user.username || 'Loading...'}</p>
        <p>Email: {user.email || 'Loading...'}</p>
        <p>
          Account created at: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Loading...'}
        </p>
      </div>
    </div>
  );
};

export default Profile;
