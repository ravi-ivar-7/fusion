import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import useNotification from '../hooks/useNotification';

import Welcome from "../components/Welcome";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";


export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const notify = useNotification();

  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);

  useEffect(() => {
    const fetchData = async () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        try {
          const userInfo = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
          setCurrentUser(userInfo);
        } catch (error) {
          notify('Error','Failed to fetch messages','danger')
        }
      }
    };
    fetchData();
  }, [currentChat, navigate]);

  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-usr", currentUser._id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.isAvatarImageSet) {
        axios.get(`${allUsersRoute}/${currentUser._id}`)
          .then(response => {
            // const data = Array.isArray(response.data) ? response.data : [];
            setContacts(response.data);
          })
          .catch(() => {
            notify( 'Error',"Failed to load contacts",'danger');
          });
      } else {
        navigate("/setAvatar");
      }
    }
  }, [currentUser, navigate]);
  
  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };


  return (
    <>
         <>
      <Container>
        <div className="container">
          <Contacts contacts={contacts} changeChat={handleChatChange} />
          {currentChat === undefined ? (
            <Welcome />
          ) : (
            <ChatContainer currentChat={currentChat} socket={socket} />
          )}
        </div>
      </Container>
    </>
    </>
  );
}


const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
