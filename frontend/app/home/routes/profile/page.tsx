"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Mail, User as UserIcon, Calendar, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_image?: string;
  bio?: string;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [profileData, setProfileData] = React.useState<UserProfile | null>(
    null
  );
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    bio: "",
  });
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3001/api/user/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (res.ok) {
          setProfileData(data.user);
          setFormData({
            username: data.user.username || "",
            email: data.user.email || "",
            bio: data.user.bio || "",
          });
        } else {
          setError(data.error || "Failed to load profile");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3001/api/user/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setProfileData(data.user);
        setSuccess("Profile updated successfully!");
        setIsEditing(false);

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.username = data.user.username;
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }

        setTimeout(() => window.location.reload(), 1000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !user?.id) return;

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const formDataUpload = new FormData();
      formDataUpload.append("profileImage", selectedFile);

      const res = await fetch(
        `http://localhost:3001/api/user/${user.id}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataUpload,
        }
      );

      const data = await res.json();

      if (res.ok) {
        setProfileData(data.user);
        setSuccess("Profile image uploaded successfully!");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please login to view your profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="m-2.5">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {/* Profile Header */}
          <div className="bg-cyan1 border border-cyan2 rounded-lg p-8 ">
            <div className="flex items-start gap-6">
              {/* Profile Picture */}
              <div className="relative shadow-shadow1">
                {profileData?.profile_image ? (
                  <div className="w-32 h-32 rounded overflow-hidden relative">
                    <Image
                      src={`http://localhost:3001${profileData.profile_image}`}
                      alt="Profile"
                      fill
                      className="object-cover "
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-linear-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {profileData?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-semibold text-gray-800">
                    {profileData?.username}
                  </h1>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                {profileData?.bio && (
                  <p className="text-gray-500 mb-4">{profileData.bio}</p>
                )}

                <div className="flex gap-2 text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{profileData?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined{" "}
                      {profileData?.created_at
                        ? new Date(profileData.created_at).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">0</p>
                    <p className="text-sm text-gray-500">Posts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">0</p>
                    <p className="text-sm text-gray-500">Followers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">0</p>
                    <p className="text-sm text-gray-500">Following</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="border border-cyan2 rounded-lg p-8 ">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Edit Profile
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-cyan1 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-cyan1 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 px-4 py-2 border border-cyan1 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleImageUpload}
                      disabled={!selectedFile || uploading}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-cyan1 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Content Tabs */}
          <div className="border border-cyan2 rounded-lg">
            <div className="border-b border-gray-200">
              <div className="flex gap-8 px-8">
                <button className="py-4 border-b-2 border-cyan-500 text-cyan-600 font-medium">
                  Posts
                </button>
                <button className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium">
                  Liked
                </button>
                <button className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium">
                  Saved
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center py-12">
                <p className="text-gray-500">No posts yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
