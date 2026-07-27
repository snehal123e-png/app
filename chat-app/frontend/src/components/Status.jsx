import React, { useState, useEffect } from "react";
import api from "../api";


function Status() {


    const [statuses, setStatuses] = useState([]);

    const [text, setText] = useState("");



    useEffect(() => {


        loadStatus();


    }, []);



    async function loadStatus() {

        const res =
            await api.get("/status");

        setStatuses(res.data);

    }





    async function createStatus() {


        const data = {
            text
        };


        await api.post(
            "/status/create",
            data
        );


        setText("");

        loadStatus();


    }





    return (

        <div className="status">


            <h3>
                My Status
            </h3>



            <input

                value={text}

                onChange={
                    e => setText(e.target.value)
                }

                placeholder="Write status..."

            />



            <button
                onClick={createStatus}
            >
                Post
            </button>



            <h3>
                Recent Status
            </h3>



            {

                statuses.map(s => (


                    <div
                        key={s.id}
                        className="status-card"
                    >


                        <p>
                            {s.text}
                        </p>


                        {
                            s.image &&

                            <img

                                src={
                                    `http://localhost:5001${s.image}`
                                }

                            />

                        }



                    </div>


                ))

            }



        </div>

    );


}


export default Status;