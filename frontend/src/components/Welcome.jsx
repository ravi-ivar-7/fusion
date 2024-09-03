import React, { useState, useEffect } from "react";
import styled from "styled-components";
import chat from "../assets/chat.gif";

export default function Welcome() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const setUser = async () => {
      const userData = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );
      setUserName(userData?.username || "User");
    };
    setUser();
  }, []);

  return (
    <Container>
      <img src={chat} alt="" />
      <h1>
        Welcome, <span>{userName}!</span>
      </h1>
      <h3>Select a chat to Start messaging.</h3>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  flex-direction: column;
  img {
    max-width: 90%;
    max-height: 20rem;
    width: auto;
    height: auto;
  }
  span {
    color: #4e0eff;
  }
`;

