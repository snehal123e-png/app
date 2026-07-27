import React, {
  useState,
  useEffect,
  useRef
} from "react";

import EmojiPicker from "emoji-picker-react";

import {
  getSocket
} from "../socket";

import api from "../api";

import MessageSearch from "./MessageSearch";



const ChatWindow = ({

  selectedUser,

  selectedRoom,

  messages = [],

  sendMessage,

  currentUser,

  onlineUserIds = [],

  lastSeen = {},

  typingUser,

  handleTyping


}) => {



  const [text, setText] =
    useState("");



  const [showEmoji, setShowEmoji] =
    useState(false);



  const [replyMessage, setReplyMessage] =
    useState(null);



  const [image, setImage] =
    useState(null);



  const [imagePreview, setImagePreview] =
    useState(null);



  const [audio, setAudio] =
    useState(null);



  const [recording, setRecording] =
    useState(false);



  const [searchResults, setSearchResults] =
    useState([]);



  const [isSearching, setIsSearching] =
    useState(false);



  const [searchText, setSearchText] =
    useState("");



  const [editMessage, setEditMessage] =
    useState(null);



  const messagesEndRef =
    useRef(null);



  const mediaRecorderRef =
    useRef(null);



  const audioChunksRef =
    useRef([]);



  const socket =
    getSocket();







  // ==========================
  // Highlight Search
  // ==========================


  const highlightText = (value) => {


    if (!value)
      return "";


    if (!searchText)
      return value;



    const parts =
      value.split(
        new RegExp(
          `(${searchText})`,
          "gi"
        )
      );



    return parts.map(
      (part, index) =>


        part.toLowerCase()
          ===
          searchText.toLowerCase()

          ?

          <mark key={index}>
            {part}
          </mark>

          :

          part

    );

  };







  // ==========================
  // Update Messages
  // ==========================


  useEffect(() => {


    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth"
      });


  }, [messages]);






  // ==========================
  // Image Select
  // ==========================


  const handleImage = (e) => {


    const file =
      e.target.files[0];


    if (!file)
      return;



    setImage(file);



    setImagePreview(
      URL.createObjectURL(file)
    );


  };






  // ==========================
  // Emoji
  // ==========================


  const addEmoji = (emoji) => {


    setText(prev =>
      prev + emoji.emoji
    );


  };
  // ==========================
  // Audio Recording
  // ==========================


  const startRecording = async () => {


    try {


      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: true
          });



      const recorder =
        new MediaRecorder(stream);



      audioChunksRef.current = [];



      recorder.ondataavailable =
        (event) => {


          audioChunksRef.current.push(
            event.data
          );


        };




      recorder.onstop = () => {


        const blob =
          new Blob(
            audioChunksRef.current,
            {
              type: "audio/webm"
            }
          );



        setAudio(blob);



        // stop microphone
        stream
          .getTracks()
          .forEach(
            track => track.stop()
          );


      };



      recorder.start();



      mediaRecorderRef.current =
        recorder;



      setRecording(true);



    }
    catch (error) {


      console.log(
        "Microphone error",
        error
      );


    }


  };







  const stopRecording = () => {


    if (mediaRecorderRef.current) {


      mediaRecorderRef.current.stop();


    }



    setRecording(false);



  };










  // ==========================
  // Send Message
  // ==========================


  const handleSend = async () => {


    if (
      !text.trim()
      &&
      !image
      &&
      !audio
    ) {

      return;

    }





    const socket =
      getSocket();





    let imageUrl = null;

    let audioUrl = null;







    try {



      // Upload Image

      if (image) {



        const formData =
          new FormData();



        formData.append(
          "image",
          image
        );




        const res =
          await api.post(
            "/upload/image",
            formData
          );



        imageUrl =
          res.data.url;



      }








      // Upload Audio


      if (audio) {



        const formData =
          new FormData();



        formData.append(
          "file",
          audio,
          "voice.webm"
        );



        const res =
          await api.post(
            "/upload/file",
            formData
          );



        audioUrl =
          res.data.url;



      }









      // EDIT MESSAGE


      if (editMessage) {



        socket.emit(
          "message:edit",
          {

            messageId:
              editMessage.id,


            newText:
              text.trim()


          }
        );



        setEditMessage(null);



      }



      // NEW MESSAGE

      else {



        if (selectedRoom) {

          socket.emit(
            "room:message",
            {

              roomId: selectedRoom.id,

              text: text.trim()

            }
          );


        }
        else if (selectedUser) {


          socket.emit(
            "private:message",
            {

              toUserId: selectedUser.id,

              text: text.trim(),

              image: imageUrl,

              audio: audioUrl,

              replyTo:
                replyMessage
                  ?
                  {
                    id: replyMessage.id,
                    text: replyMessage.text,
                    senderName: replyMessage.senderName
                  }
                  :
                  null

            }
          );


        }



      }







      // RESET


      setText("");

      setImage(null);

      setImagePreview(null);

      setAudio(null);

      setReplyMessage(null);

      setShowEmoji(false);



    }
    catch (error) {


      console.log(
        "Send message error",
        error
      );


    }



  };









  // ==========================
  // Enter Send
  // ==========================


  const handleKeyPress = (e) => {


    if (e.key === "Enter") {


      handleSend();


    }


  };

  // ==========================
  // Online Status
  // ==========================


  const isOnline =
    selectedUser &&
    onlineUserIds.includes(
      selectedUser.id
    );



  const userLastSeen =
    lastSeen[selectedUser?.id];









  return (

    <div className="chat-window">



      {/* ==========================
    HEADER
========================== */}


      <div className="chat-header">


        {
          selectedUser

            ?

            <>


              <img

                className="avatar"

                src={

                  selectedUser.photo

                    ?

                    `http://localhost:5001${selectedUser.photo}`

                    :

                    `https://ui-avatars.com/api/?name=${selectedUser.username}`

                }

                alt=""

              />



              <div>


                <b>

                  {
                    selectedUser
                      ?
                      selectedUser.username
                      :
                      selectedRoom?.name
                  }
                </b>



                <div className="typing-text">


                  {

                    isOnline

                      ?

                      "🟢 Online"

                      :

                      "⚫ Offline"

                  }



                  {

                    !isOnline &&
                    userLastSeen &&

                    <div>

                      Last seen:

                      {" "}

                      {

                        new Date(userLastSeen)
                          .toLocaleString()

                      }

                    </div>

                  }



                </div>


              </div>





              <div className="header-search">


                <MessageSearch


                  selectedUser={selectedUser}



                  setSearchResults={(data) => {


                    setSearchResults(data);


                    setIsSearching(true);


                  }}


                />



                {

                  isSearching &&


                  <button

                    className="clear-search"

                    onClick={() => {


                      setSearchResults([]);

                      setIsSearching(false);


                    }}

                  >

                    ❌ Clear

                  </button>


                }



              </div>





            </>



            :

            <h3>

              Select a chat

            </h3>


        }


      </div>









      {/* ==========================
    TYPING INDICATOR
========================== */}



      {

        typingUser &&


        <div className="typing-indicator">


          <span></span>

          <span></span>

          <span></span>


          {typingUser}


        </div>


      }









      {/* ==========================
    MESSAGES
========================== */}



      <div className="messages">


        {

          (
            isSearching

              ?

              searchResults

              :

              messages

          )

            .map((msg, index) => {


              const mine =
                msg.fromId === currentUser;



              return (



                <div

                  key={index}

                  className={

                    `message-row ${mine
                      ?
                      "mine"
                      :
                      "other"
                    }`

                  }


                >



                  <div className="message-bubble">







                    {/* Reply Preview */}


                    {

                      msg.replyTo &&


                      <div className="reply-preview">


                        <b>

                          {msg.replyTo.senderName}

                        </b>



                        <p>

                          {msg.replyTo.text}

                        </p>


                      </div>


                    }








                    <div className="message-text">



                      {

                        msg.deletedForEveryone


                          ?


                          <i>

                            This message was deleted

                          </i>


                          :

                          <>


                            {/* Image */}


                            {

                              msg.image &&


                              <img

                                src={
                                  `http://localhost:5001${msg.image}`
                                }

                                className="chat-image"

                                alt=""

                              />


                            }







                            {/* Audio */}


                            {

                              msg.audio &&


                              <audio controls>


                                <source

                                  src={
                                    `http://localhost:5001${msg.audio}`
                                  }

                                />


                              </audio>


                            }








                            {/* Text */}


                            {

                              msg.text &&


                              <div>


                                {

                                  highlightText(
                                    msg.text
                                  )

                                }




                                {

                                  msg.edited &&


                                  <span className="edited-label">

                                    edited

                                  </span>


                                }



                              </div>


                            }





                          </>


                      }




                    </div>








                    {/* Reply Button */}


                    <button


                      className="reply-btn"


                      onClick={() =>


                        setReplyMessage(msg)


                      }


                    >


                      ↩ Reply


                    </button>









                    {/* Edit Button */}


                    {

                      mine &&


                      <button


                        className="edit-btn"


                        onClick={() => {


                          setEditMessage(msg);


                          setText(msg.text);


                        }}


                      >


                        ✏️ Edit


                      </button>


                    }









                    <div className="message-footer">


                      <span>


                        {

                          new Date(
                            msg.createdAt
                          )

                            .toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit"
                              }

                            )

                        }


                      </span>







                      {

                        mine &&


                        <span>


                          {

                            msg.status === "sent"

                            &&

                            "✓"

                          }



                          {

                            msg.status === "delivered"

                            &&

                            "✓✓"

                          }



                          {

                            msg.status === "read"

                            &&


                            <span

                              style={{
                                color: "#34B7F1"
                              }}

                            >

                              ✓✓

                            </span>


                          }



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

      {/* ==========================
    Reply Box
========================== */}

      {

        replyMessage &&


        <div className="reply-box">


          <div>


            <b>

              Replying to {replyMessage.senderName}

            </b>


            <p>

              {replyMessage.text}

            </p>


          </div>



          <button

            onClick={() => setReplyMessage(null)}

          >

            ✕

          </button>


        </div>


      }









      {/* ==========================
    Image Preview
========================== */}

      {

        imagePreview &&


        <div className="image-preview">


          <img

            src={imagePreview}

            alt="preview"

          />



          <button


            onClick={() => {


              setImage(null);

              setImagePreview(null);


            }}


          >

            ✕

          </button>



        </div>


      }









      {/* ==========================
    Reply Box
========================== */}


      {
        (selectedUser || selectedRoom) &&
        <div className="chat-input-area">







          <input

            type="file"

            accept="image/*"

            id="imageUpload"

            style={{
              display: "none"
            }}

            onChange={handleImage}

          />





          <label

            htmlFor="imageUpload"

            className="icon-btn"

          >

            📷

          </label>









          <button


            className="icon-btn"


            onClick={() =>


              setShowEmoji(
                !showEmoji
              )


            }

          >

            😊

          </button>









          {

            showEmoji &&


            <div className="emoji-box">


              <EmojiPicker

                onEmojiClick={addEmoji}

              />


            </div>


          }









          <button


            className="icon-btn"


            onMouseDown={startRecording}


            onMouseUp={stopRecording}


          >

            {

              recording

                ?

                "🔴"

                :

                "🎤"

            }


          </button>









          <input


            value={text}


            placeholder="Type a message..."


            onChange={(e) => {


              setText(
                e.target.value
              );



              if (handleTyping)

                handleTyping();


            }}



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