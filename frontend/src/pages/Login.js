import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from 'styled-components';
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
import { loginRoute } from "../utils/APIRoutes";
import useNotification from "../hooks/useNotification";

export default function Login() {
    const navigate = useNavigate();
    const notify = useNotification()
    const [values, setValues] = useState({ username: "", password: "" });

    useEffect(() => {
        if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
            navigate("/");
        }
    }, [navigate]);

    const handleLoginFormChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
    };

    const validateForm = () => {
        const { username, password } = values;
        if (username === "") {
            notify('Error', "Email/Username is required.", 'danger');
            return false;
        } else if (password === "") {
            notify('Error', "Password is required.", 'danger');
            return false;
        }
        return true;
    };

 const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
        const { username, password } = values;
        try {
            const response = await axios.post(loginRoute, { username, password });

            if (response.status === 200 && response.data.user !== undefined) {
                localStorage.setItem(
                    process.env.REACT_APP_LOCALHOST_KEY,
                    JSON.stringify(response.data.user)
                );
                notify('Info', `${response.data.warn}`, 'success');
                navigate("/");
            } else {
                notify('Error', `${response.data.warn}`, 'danger');
            }
        } catch (error) {
            console.error("Login error:", error);
            notify('Error', "An error occurred during login.", 'danger');
        }
    }
};

    return (
        <LoginFormContainer>
            <form action="" onSubmit={(event) => handleSubmit(event)}>
                <div className="brand">
                    <img src={Logo} alt="logo" />
                    <h1>Fusion</h1>
                </div>
                <input
                    type="text"
                    placeholder="Username"
                    name="username"
                    onChange={(e) => handleLoginFormChange(e)}
                    min="3"
                />
                <input
                    type="password"
                    placeholder="Password"
                    name="password"
                    onChange={(e) => handleLoginFormChange(e)}
                />
                <button type="submit">Log In</button>
                <span>
                    Don't have an account? <Link to="/register">Create One.</Link>
                </span>
            </form>
        </LoginFormContainer>
    );
}

const LoginFormContainer = styled.div`
height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 5rem;
    }
    h1 {
      color: white;
      text-transform: uppercase;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background-color: #00000076;
    border-radius: 2rem;
    padding: 5rem;
  }
  input {
    background-color: transparent;
    padding: 1rem;
    border: 0.1rem solid #4e0eff;
    border-radius: 0.4rem;
    color: white;
    width: 100%;
    font-size: 1rem;
    &:focus {
      border: 0.1rem solid #997af0;
      outline: none;
    }
  }
  button {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    &:hover {
      background-color: #4e0eff;
    }
  }
  span {
    color: white;
    text-transform: uppercase;
    a {
      color: #4e0eff;
      text-decoration: none;
      font-weight: bold;
    }
  }

`