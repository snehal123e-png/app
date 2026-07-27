import React, { useState } from "react";
import api from "../api";


function MessageSearch({
    selectedUser,
    setSearchResults
}) {


    const [query, setQuery] = useState("");



    const search = async () => {


        if (!query.trim())
            return;



        const res =
            await api.get(
                `/chat/search/${selectedUser.id}?q=${query}`
            );



        setSearchResults(res.data);


    };



    return (

        <div className="message-search">


            <input

                placeholder="Search messages..."

                value={query}

                onChange={
                    e => setQuery(e.target.value)
                }

            />


            <button onClick={search}>
                🔍
            </button>


        </div>

    );


}


export default MessageSearch;