import React, { useState } from "react";
import api from "../api";

function Profile({ user }) {
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(
        user.photo
            ? `http://localhost:5001${user.photo}`
            : `https://ui-avatars.com/api/?name=${user.username}`
    );

    const uploadPhoto = async () => {
        if (!photo) {
            alert("Please select an image");
            return;
        }

        const formData = new FormData();
        formData.append("photo", photo);

        try {
            const res = await api.post("/profile/photo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("Profile photo updated");

            const updatedUser = {
                ...user,
                photo: res.data.photo,
            };

            localStorage.setItem("user", JSON.stringify(updatedUser));

            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || "Upload failed");
        }
    };

    return (
        <div className="profile-page">
            <h2>My Profile</h2>

            <img
                src={preview}
                alt="Profile"
                className="profile-image"
            />

            <br />
            <br />

            <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                    setPhoto(e.target.files[0]);
                    setPreview(URL.createObjectURL(e.target.files[0]));
                }}
            />

            <br />
            <br />

            <button onClick={uploadPhoto}>
                Upload Photo
            </button>

            <br />
            <br />

            <h3>{user.username}</h3>

            <p>{user.about}</p>
        </div>
    );
}

export default Profile;