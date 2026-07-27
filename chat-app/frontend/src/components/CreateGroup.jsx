import React, { useState } from "react";
import api from "../api";


function CreateGroup() {


    const [name, setName] = useState("");



    async function create() {


        if (!name.trim())
            return;



        await api.post(
            "/groups/create",
            {
                name
            }
        );



        setName("");

        alert("Group Created");


    }





    return (

        <div>


            <h2>
                Create Group
            </h2>



            <input

                placeholder="Group name"

                value={name}

                onChange={
                    e => setName(e.target.value)
                }

            />



            <button
                onClick={create}
            >
                Create
            </button>



        </div>

    );


}


export default CreateGroup;