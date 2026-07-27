import React, { useEffect, useState } from "react";
import api from "../api";


function GroupInfo({ groupId }) {


    const [group, setGroup] = useState(null);



    useEffect(() => {


        api.get("/groups")
            .then(res => {


                const g =
                    res.data.find(
                        x => x.id === groupId
                    );


                setGroup(g);


            });


    }, [groupId]);





    if (!group)
        return null;



    return (

        <div className="group-info">


            <h2>
                {group.name}
            </h2>


            <p>
                {group.description}
            </p>



            <h3>
                Members
            </h3>



            {

                group.members.map(id => (


                    <div key={id}>


                        User ID : {id}


                        {

                            group.adminId === id &&

                            <span>
                                👑 Admin
                            </span>

                        }


                    </div>


                ))

            }



            <button

                onClick={async () => {


                    await api.post(
                        `/groups/${group.id}/leave`
                    );


                    alert("Left group");


                }}

            >

                Leave Group

            </button>



        </div>

    );


}


export default GroupInfo;