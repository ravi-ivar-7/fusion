import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import Picker from "emoji-picker-react";
import { allUsersRoute, host, recieveMessageRoute, sendMessageRoute } from "../utils/APIRoutes";
import useNotification from '../hooks/useNotification';

import Welcome from "../components/Welcome";
import Logout from "../components/Logout";
import Logo from "../assets/logo.svg";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const scrollRef = useRef();
  const notify = useNotification();

  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentChatIndex, setCurrentChatIndex] = useState(undefined)
  const [currentUser, setCurrentUser] = useState(undefined);
  const [currentUserImage, setCurrentUserImage] = useState(undefined)
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [messages, setMessages] = useState([])
  const [arrivalMessage, setArrivalMessage] = useState(null);


  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(async () => {
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/login");
    } else {
      const userInfo = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      )
      setCurrentUser(userInfo);
      setCurrentUserName(userInfo.username)
      setCurrentUserImage(userInfo.avatarImage)
      // getting current user messages:
      const userMessages = await axios.post(recieveMessageRoute, { from: currentUser._id, from: currentChat._id })
      setMessages(userMessages.data)
    }
  }, [currentChat]);

  // adding a new user to our onlineUser collection
  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);// storingn this new ws instance 
      socket.current.emit("add-usr", currentUser._id);
    }
  }, [currentUser])

  useEffect(async () => {
    if (currentUser) {
      if (currentUser.isAvatarImageSet) {
        const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
        setContacts(data.data);
      } else {
        navigate("/setAvatar");
      }
    }
  }, [currentUser]);


  // handling new message:
  const handleSendMessage = async (msg) => {
    const userInfo = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))

    // sending to reciver
    socket.current.emit("send-msg", { to: currentChat._id, from: userInfo._id, msg })

    // saving to database:
    await axios.post(sendMessageRoute, { from: userInfo._id, to: currentChat._id, message: msg, })

    const msgs = [...messages]
    msgs.push({ fromSelf: true, message: msg })
    setMessages(msgs)
  }

  // handling incoming messages:
  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (msg) => {
        setArrivalMessage({ fromSelf: false, message: msg });
      })
    }
  }, [])

  useEffect(() => {
    arrivalMessage && setArrivalMessage((prev) => [...prev, arrivalMessage])
  }, [arrivalMessage])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleEmojiClick = (event, emojiObject) => {
    let message = msg;
    message += emojiObject.emoji;
    setMsg(message);
  };

  const changeCurrentChat = (index, contact) => {
    setCurrentChatIndex(index);
    setCurrentChat(contact);
  };


  return (
    <>
      <MainContainer>
        <div className="container">
          {currentUserName && currentUserImage && (
            <ContactContainer >
              <div className="brand">
                <img src={Logo} alt="logo" />
                <h3>Fusion</h3>
              </div>
              <div className="contacts">
                {contacts.map((contact, index) => {
                  return (
                    <div
                      key={contact._id}
                      className={`contact ${index === currentChatIndex ? "selected" : ""
                        }`}
                      onClick={() => changeCurrentChat(index, contact)}
                    >
                      <div className="avatar">
                        <img
                          src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                          alt=""
                        />
                      </div>
                      <div className="username">
                        <h3>{contact.username}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="current-user">
                <div className="avatar">
                  <img
                    src={`data:image/svg+xml;base64,${currentUserImage}`}
                    alt="avatar"
                  />
                </div>
                <div className="username">
                  <h2>{currentUserName}</h2>
                </div>
              </div>
            </ContactContainer>
          )}


          {currentChat ? (
            <>
              <ChatContainer>
                <div className="chat-header">
                  <div className="user-details">
                    <div className="avatar">
                      <img
                        src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
                        alt=""
                      />
                    </div>
                    <div className="username">
                      <h3>{currentChat.username}</h3>
                    </div>
                  </div>
                  <Logout />
                </div>

                <div className="chat-messages">
                  {messages.map((message) => {
                    return (
                      <div className={`message ${message.fromSelf ? "sended" : "recived"}`} >
                        <div className="content" >
                          <p>{message.message}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>


              </ChatContainer>
              <ChatInputContainer>
                <div className="button-container">
                  <div className="emoji">
                    <BsEmojiSmileFill onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                    {showEmojiPicker && <Picker onEmojiClick={handleEmojiClick} />}
                  </div>
                </div>

                <form className="input-container" onSubmit={(event) => handleSendMessage(msg)}>
                  <input
                    type="text"
                    placeholder="type your message here"
                    onChange={(e) => setMsg(e.target.value)}
                    value={msg}
                  />
                  <button type="submit">
                    <IoMdSend />
                  </button>
                </form>


              </ChatInputContainer>
            </>
          ) : (
            <Welcome />
          )}

        </div>
      </MainContainer>

    </>
  )


}

const MainContainer = styled.div`
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

const ChatContainer = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;

const ChatInputContainer = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 5% 95%;
  background-color: #080420;
  padding: 0 2rem;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    padding: 0 1rem;
    gap: 1rem;
  }
  .button-container {
    display: flex;
    align-items: center;
    color: white;
    gap: 1rem;
    .emoji {
      position: relative;
      svg {
        font-size: 1.5rem;
        color: #ffff00c8;
        cursor: pointer;
      }
      .emoji-picker-react {
        position: absolute;
        top: -350px;
        background-color: #080420;
        box-shadow: 0 5px 10px #9a86f3;
        border-color: #9a86f3;
        .emoji-scroll-wrapper::-webkit-scrollbar {
          background-color: #080420;
          width: 5px;
          &-thumb {
            background-color: #9a86f3;
          }
        }
        .emoji-categories {
          button {
            filter: contrast(0);
          }
        }
        .emoji-search {
          background-color: transparent;
          border-color: #9a86f3;
        }
        .emoji-group:before {
          background-color: #080420;
        }
      }
    }
  }
  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    background-color: #ffffff34;
    input {
      width: 90%;
      height: 60%;
      background-color: transparent;
      color: white;
      border: none;
      padding-left: 1rem;
      font-size: 1.2rem;

      &::selection {
        background-color: #9a86f3;
      }
      &:focus {
        outline: none;
      }
    }
    button {
      padding: 0.3rem 2rem;
      border-radius: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #9a86f3;
      border: none;
      @media screen and (min-width: 720px) and (max-width: 1080px) {
        padding: 0.3rem 1rem;
        svg {
          font-size: 1rem;
        }
      }
      svg {
        font-size: 2rem;
        color: white;
      }
    }
  }
`;

const ContactContainer = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #080420;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 5rem;
      cursor: pointer;
      width: 90%;
      border-radius: 0.2rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
    .selected {
      background-color: #9a86f3;
    }
  }

  .current-user {
    background-color: #0d0d30;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    .avatar {
      img {
        height: 4rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;