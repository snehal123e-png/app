import { useEffect, useState } from "react";
import api from "../api";

function SearchUsers() {

    const [users, setUsers] = useState([]);

    useEffect(() => {

        api.get("/chat/all-users")
            .then(res => setUsers(res.data));

    }, []);

    async function sendRequest(id) {

        await api.post("/contact/request", {
            toId: id
        });

        alert("Request Sent");

    }

    return (

        <div>

            <h2>Find People</h2>

            {users.map(user => (

                <div key={user.id}>

                    {user.username}

                    <button
                        onClick={() => sendRequest(user.id)}
                    >

                        Send Request

                    </button>

                </div>

            ))}

        </div>

    );

}

export default SearchUsers;