import React, { useState } from "react";
import { FormGroup, Input } from "reactstrap";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { storeUser } from "../../helpers";
import { login } from "../../lib/strapiClient";
import ReactLoading from "react-loading"; // Importing ReactLoading

const initialUser = { password: "", identifier: "" };

const Login = () => {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false); // State to manage loading
  const navigate = useNavigate();

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setUser((currentUser) => ({
      ...currentUser,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    try {
      if (user.identifier && user.password) {
        setLoading(true); // Set loading to true before the login request
        const data = await login(user.identifier, user.password);
        if (data.jwt) {
          storeUser(data);
          toast.success("Logged in successfully!", {
            hideProgressBar: true,
          });
          setUser(initialUser);
          navigate("/dashboard");
          window.location.reload();
        }
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage, {
        hideProgressBar: true,
      });
    } finally {
      setLoading(false); // Set loading to false after the request is done
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <div>
          <h2>Login:</h2>
          <FormGroup>
            <Input
              type="email"
              name="identifier"
              value={user.identifier}
              onChange={handleChange}
              placeholder="Enter your email"
              style={styles.inputStyle}
            />
          </FormGroup>
          <FormGroup>
            <Input
              type="password"
              name="password"
              value={user.password}
              onChange={handleChange}
              placeholder="Enter password"
              style={styles.inputStyle}
            />
          </FormGroup>
          <button
            style={styles.loginButton}
            onClick={handleLogin}
            disabled={loading} // Disable the button while loading
          >
            {loading ? (
              <ReactLoading
                type="spin"
                color="#fff"
                height={24}
                width={24}
                justifyContent="center"
                alignItems="center"
              />
            ) : (
              "Login"
            )}
          </button>
          <p style={styles.signupText}>
            Don't have an account?{" "}
            <Link to="/registration" style={styles.signupLink}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, #3182ce 0%, #73dca8ff 100%)`,
    padding: "1rem",
    fontFamily: "sans-serif",
  },
  loginCard: {
    background: "white",
    padding: "3rem 2rem",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "450px",
  },
  inputStyle: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    marginBottom: "1rem",
    fontSize: "1rem",
  },
  loginButton: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "1rem",
    display: "flex", // Menggunakan flexbox
    justifyContent: "center", // Menyusun konten secara horizontal
    alignItems: "center", // Menyusun konten secara vertikal
    position: "relative",
  },
  signupText: {
    fontSize: "0.875rem",
    color: "#4a5568",
  },
  signupLink: {
    color: "#3182ce",
    textDecoration: "none",
  },
};

export default Login;
