import React, { useState, useEffect } from "react";
import api from "../api";


function Sidebar({

  rooms = [],
  users = [],
  onlineUserIds = [],
  lastSeen = {},
  selected,
  onSelect,
  unread = {},
  currentUser

}) {


  const [pinnedChats, setPinnedChats] = useState([]);



  // ==========================
  // Load Pinned Chats
  // ==========================

  useEffect(() => {


    const loadPinnedChats = async () => {


      try {


        const res = await api.get(
          "/pin-chat"
        );


        setPinnedChats(
          res.data || []
        );


      }
      catch (err) {


        console.log(
          "Pinned chat loading error:",
          err.response?.data || err.message
        );


        setPinnedChats([]);


      }


    };



    loadPinnedChats();



  }, []);






  // ==========================
  // Pin / Unpin
  // ==========================

  const handlePinChat = async (userId) => {


    try {


      const res = await api.post(
        `/pin-chat/${userId}`
      );



      setPinnedChats(
        res.data.pinnedChats || []
      );


    }
    catch (err) {


      console.log(
        "Pin chat error:",
        err.response?.data || err.message
      );


    }


  };







  return (

    <div className="sidebar">





      {/* ================= ROOMS ================= */}


      <div className="sidebar-section">


        <h3>
          Rooms
        </h3>



        {
          rooms.map(room => (


            <div

              key={room.id}

              className={
                `sidebar-item ${selected?.type === "room" &&
                  selected.id === room.id
                  ?
                  "active"
                  :
                  ""
                }`
              }


              onClick={() =>


                onSelect({

                  type: "room",

                  id: room.id,

                  name: room.name

                })


              }


            >


              <div className="avatar room-avatar">

                #

              </div>



              <div className="sidebar-info">


                <div className="sidebar-name">

                  {room.name}

                </div>


                <div className="sidebar-last">

                  Group Chat

                </div>


              </div>



            </div>


          ))
        }



      </div>







      {/* ================= USERS ================= */}



      <div className="sidebar-section">


        <h3>
          Direct Messages
        </h3>




        {
          users.length === 0 &&

          <p>
            No users found.
          </p>

        }






        {

          [...users]

            .sort((a, b) => {


              if (
                pinnedChats.includes(a.id)
              )
                return -1;



              if (
                pinnedChats.includes(b.id)
              )
                return 1;



              return 0;


            })


            .map(u => {


              const online =
                onlineUserIds.includes(
                  u.id
                );



              return (



                <div


                  key={u.id}


                  className={
                    `sidebar-item ${selected?.type === "private" &&
                      selected.id === u.id
                      ?
                      "active"
                      :
                      ""
                    }`
                  }



                  onClick={() =>


                    onSelect({

                      type: "private",

                      id: u.id,

                      name: u.username

                    })


                  }



                >





                  <div className="avatar">


                    {
                      u.username
                        ?.charAt(0)
                        .toUpperCase()
                    }



                    <span

                      className={
                        online
                          ?
                          "status online"
                          :
                          "status offline"
                      }

                    />


                  </div>







                  <div className="sidebar-info">



                    <div className="sidebar-name">



                      {
                        pinnedChats.includes(u.id)

                        &&
                        "📌 "
                      }




                      {u.username}





                      {
                        unread[u.id] > 0 &&


                        <span className="unread-badge">

                          {unread[u.id]}

                        </span>


                      }



                    </div>







                    <div className="sidebar-last">


                      {

                        online

                          ?

                          "Online"


                          :


                          lastSeen[u.id]


                            ?

                            `Last seen ${new Date(
                              lastSeen[u.id]
                            )
                              .toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }
                              )
                            }`


                            :

                            "Offline"


                      }



                    </div>





                  </div>







                  {/* PIN BUTTON */}


                  <button


                    className="pin-chat-btn"



                    onClick={(e) => {


                      e.stopPropagation();


                      handlePinChat(
                        u.id
                      );


                    }}



                  >


                    {
                      pinnedChats.includes(u.id)

                        ?

                        "📌"

                        :

                        "📍"

                    }



                  </button>






                </div>



              );


            })


        }



      </div>




    </div>


  );


}



export default Sidebar;