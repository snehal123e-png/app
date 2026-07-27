import { useEffect, useState } from "react";
import api from "../api";

function Requests() {

    const [requests, setRequests] = useState([]);

    useEffect(() => {

        load();

    }, []);

    async function load() {

        const res = await api.get("/contact/requests");

        setRequests(res.data);

    }

    async function accept(id) {

        await api.post("/contact/accept/" + id);

        load();

    }

    async function reject(id) {

        await api.post("/contact/reject/" + id);

        load();

    }

    return (

        <div>

            <h2>Requests</h2>

            {requests.map(r => (

                <div key={r.id}>

                    <b>{r.sender.username}</b>

                    <button onClick={() => accept(r.id)}>
                        Accept
                    </button>

                    <button onClick={() => reject(r.id)}>
                        Reject
                    </button>

                </div>

            ))}

        </div>

    );

}

export default Requests;