import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);

  // Fetch messages when currentChat changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        );
        const response = await axios.post(recieveMessageRoute, {
          from: data._id,
          to: currentChat._id,
        });
        // Ensure response.data is an array
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        } else {
          console.error("Expected an array of messages, got:", response.data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (currentChat) {
      fetchMessages();
    }
  }, [currentChat]);

  const handleSendMsg = async (msg, file = null) => {
    try {
      const data = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );

      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result;
          socket.current.emit("send-file", {
            to: currentChat._id,
            from: data._id,
            arrayBuffer: arrayBuffer,
            name: file.name,
            type: file.type
          });
          const blob = new Blob([arrayBuffer], { type: file.type });
          const url = URL.createObjectURL(blob);
          setMessages(prev => [...prev, { fromSelf: true, message: { url, name: file.name, type: file.type }, isFile: true }]);
        };
        reader.readAsArrayBuffer(file); // Convert file to ArrayBuffer
      }

      if (msg.length > 0) {
        socket.current.emit("send-msg", {
          to: currentChat._id,
          from: data._id,
          msg,
        });

        await axios.post(sendMessageRoute, {
          from: data._id,
          to: currentChat._id,
          message: msg,
        });
        setMessages((prev) => [...prev, { fromSelf: true, message: msg }]);
      }
    } catch (error) {
      console.error("Error sending message or file:", error);
    }
  };


  // Listen for incoming messages and files
  useEffect(() => {
    if (socket.current) {
      const handleMessageReceive = (msg) => {
        setArrivalMessage({ fromSelf: false, message: msg });
      };
      const handleFileReceive = ({ arrayBuffer, name, type }) => {
        const blob = new Blob([arrayBuffer], { type });
        const url = URL.createObjectURL(blob);
        setArrivalMessage({
          fromSelf: false,
          message: { url, name, type },
          isFile: true
        });
        // Optionally, we can revoke the object URL later to free memory
        // URL.revokeObjectURL(url);
      };

      socket.current.on("msg-receive", handleMessageReceive);
      socket.current.on("file-receive", handleFileReceive);

      // Cleanup to remove the event listeners when the component unmounts or socket changes
      return () => {
        socket.current.off("msg-receive", handleMessageReceive);
        socket.current.off("file-receive", handleFileReceive);
      };
    }
  }, [socket]);


  // Update messages when a new message/file arrives
  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage]);

  // Scroll to the latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt="User Avatar"
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div ref={scrollRef} key={index}>
            <div className={`message ${message.fromSelf ? "sended" : "received"}`}>
              <div className="content">
                {message.isFile ? getFilePreview(message.message) : <p>{message.message}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} socket={socket} />
    </Container>
  );
}

const getFilePreview = (message) => {
    if (message.type.startsWith("image/")) {
      return <img src={message.url} alt={message.name} className="file-preview" />;
    } else if (message.type.startsWith("video/")) {
      return (
        <video controls className="file-preview">
          <source src={message.url} type={message.type} />
          Your browser does not support the video tag.
        </video>
      );
    } else if (message.type.startsWith("audio/")) {
      return (
        <audio controls>
          <source src={message.url} type={message.type} />
          Your browser does not support the audio element.
        </audio>
      );
    } else if (message.type === "application/zip") {
      return (
        <div>
          <p>ZIP File: {message.name}</p>
          <a href={message.url} download={message.name}>
            Download ZIP
          </a>
        </div>
      );
    } else if (message.type.startsWith("text/")) {
      return (
        <div>
          <p>Programming/File: {message.name}</p>
          <a href={message.url} download={message.name}>
            Download File
          </a>
        </div>
      );
    } else {
      return <p>Unsupported file type: {message.type}</p>;
    }
  };

  const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #0a0a0a;
  color: white;

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #1e1e1e;
    border-bottom: 1px solid #333;
  }

  .user-details {
    display: flex;
    align-items: center;

    .avatar img {
      border-radius: 50%;
      width: 40px;
      height: 40px;
      object-fit: cover;
    }

    .username h3 {
      margin-left: 1rem;
      font-size: 1.2rem;
    }
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .chat-messages {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #3C4A4A;
      }
    }
    .received {
      justify-content: flex-start;
      .content {
       background-color:  #5B5B5B;

      }
    }
  }
    .content {
      border-radius: 1rem;
      padding: 0.5rem 1rem;
      max-width: 100%;
      word-wrap: break-word; /* Ensures text doesn't overflow */
    }
  }

  .file-preview {
    max-width: 150px;
    max-height: 150px;
    object-fit: contain;
    border-radius: 8px;
  }

  .content a {
    color: #9a86f3;
    text-decoration: none;
  }

  .content a:hover {
    text-decoration: underline;
  }

  .input-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background-color: #333;
    border-top: 1px solid #444;
  }

  .input-container input[type='text'] {
    flex: 1;
    background-color: transparent;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 1rem;
  }

  .input-container button {
    background-color: #4a90e2;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    color: white;
    cursor: pointer;
  }

  .input-container button:hover {
    background-color: #357abd;
  }
`;
