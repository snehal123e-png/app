import React, { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { connectSocket, getSocket } from "../socket";


const ChatWindow = ({ selectedUser, messages = [], sendMessage, currentUser }) => {

  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const [chatMessages, setChatMessages] = useState(messages);

  const messagesEndRef = useRef(null);



  // Connect Socket + Receive Messages
  useEffect(() => {

    const socket = connectSocket();

    if (!socket) return;


    socket.on("receive_message", (data) => {

      setChatMessages((prev) => [
        ...prev,
        data
      ]);

    });



    return () => {

      socket.off("receive_message");

    };


  }, []);



  // Update messages from parent
  useEffect(() => {

    setChatMessages(messages);

  }, [messages]);



  // Auto scroll
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [chatMessages]);




  const addEmoji = (emojiData) => {

    setText((prev) => prev + emojiData.emoji);

  };





  const handleSend = () => {


    if (!text.trim()) return;



    const messageData = {

      receiverId: selectedUser.id,

      text: text,

      time: new Date()
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),

      senderId: currentUser,

      senderName: "Me"

    };



    // Send through Socket.io

    const socket = getSocket();


    if (socket) {

      socket.emit(
        "send_message",
        messageData
      );

    }



    // Display instantly

    setChatMessages((prev) => [
      ...prev,
      {
        ...messageData,
        senderId: currentUser
      }
    ]);



    // Optional parent update

    if (sendMessage) {
      sendMessage(text);
    }



    setText("");

    setShowEmoji(false);

  };





  const handleKeyPress = (e) => {

    if (e.key === "Enter") {

      handleSend();

    }

  };





  return (

    <div className="chat-window">


      {/* Header */}

      <div className="chat-header">

        {selectedUser ? (

          <>

            <div className="avatar">
              {selectedUser.name?.charAt(0)}
            </div>


            <div>

              <b>
                {selectedUser.name}
              </b>


              {
                selectedUser.online &&
                <div className="typing-text">
                  Online
                </div>
              }


            </div>


          </>


        ) : (

          <h3>
            Select a chat
          </h3>

        )}

      </div>





      {/* Messages */}

      <div className="messages">


        {
          chatMessages.length === 0 ?


            (

              <div className="empty-chat">
                No messages yet
              </div>

            )


            :


            chatMessages.map((msg, index) => {


              const mine =
                msg.senderId === currentUser;



              return (

                <div
                  key={index}
                  className={`message-row ${mine ? "mine" : "other"
                    }`}
                >


                  <div className="message-bubble">


                    {
                      !mine &&

                      <div className="sender-name">

                        {msg.senderName}

                      </div>

                    }



                    <div className="message-text">

                      {msg.text}

                    </div>




                    <div className="message-footer">

                      <span>
                        {msg.time}
                      </span>


                      {
                        mine &&

                        <span className="read-status">
                          ✓✓
                        </span>

                      }


                    </div>


                  </div>


                </div>

              );


            })

        }



        <div ref={messagesEndRef} />


      </div>





      {/* Emoji Picker */}

      {
        showEmoji &&

        <div
          style={{
            position: "absolute",
            bottom: "75px",
            right: "20px",
            zIndex: 10
          }}
        >

          <EmojiPicker
            onEmojiClick={addEmoji}
            height={350}
            width={300}
          />

        </div>

      }





      {/* Input */}

      {
        selectedUser &&


        <div className="chat-input-area">


          <button
            className="icon-btn"
            onClick={() => setShowEmoji(!showEmoji)}
          >

            😊

          </button>




          <input

            type="text"

            placeholder="Type a message..."

            value={text}

            onChange={(e) => setText(e.target.value)}

            onKeyDown={handleKeyPress}

          />





          <button

            className="send-btn"

            onClick={handleSend}

          >

            ➤

          </button>



        </div>

      }



    </div>

  );

};


export default ChatWindow;