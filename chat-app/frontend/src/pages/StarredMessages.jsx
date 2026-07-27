import React, { useEffect, useState } from "react";
import api from "../api";


function StarredMessages({ onBack }) {


    const [messages, setMessages] = useState([]);



    useEffect(() => {


        api.get("/chat/starred")
            .then(res => {

                setMessages(res.data);

            });


    }, []);




    return (

        <div className="starred-page">


            <h2>
                ⭐ Starred Messages
            </h2>



            <button onClick={onBack}>
                ← Back
            </button>




            {
                messages.length === 0

                    ?

                    <p>
                        No starred messages
                    </p>


                    :


                    messages.map(msg => (


                        <div
                            className="star-card"
                            key={msg.id}
                        >


                            <div>

                                ⭐

                                {msg.text}


                            </div>



                            <small>

                                {
                                    new Date(msg.createdAt)
                                        .toLocaleString()

                                }

                            </small>



                        </div>


                    ))


            }



        </div>

    );


}


export default StarredMessages;