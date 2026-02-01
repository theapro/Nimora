"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import CategorySidebar from "@/components/CategorySidebar";
import Footer from "@/components/Footer";
import {
  Shield,
  Lock,
  Camera,
  Loader2,
  Check,
  ChevronDown,
  UserCircle,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { apiCall, API_URL } from "@/utils/api";

type TabType =
  | "account"
  | "profile"
  | "privacy"
  | "preferences"
  | "notifications";

const SettingsPageInner = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "account";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    bio: "",
    profession: "",
    location: "",
    website: "",
    gender: "Male" as "Male" | "Female",
    profile_image: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        setError("");
        // Fetch user profile data here, e.g.:
        // const res = await apiCall(`http://localhost:3001/api/user/${user.id}`);
        // if (res.ok) { setProfileData(await res.json()); }
      } catch (e) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!user) return;
      const res = await apiCall(`/api/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "An error occurred");
      }
    } catch (err) {
      setError("Server connection lost");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setPasswordSaving(true);
      setError("");
      setSuccess("");

      const res = await apiCall(
        `/api/user/${user.id}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        },
      );

      if (res.ok) {
        setSuccess("Password updated successfully!");
        setIsPasswordModalOpen(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update password");
      }
    } catch {
      setError("Server connection lost");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profileImage", file);

      const res = await apiCall(
        `/api/user/${user.id}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (res.ok) {
        const data = await res.json();
        setProfileData((prev) => ({
          ...prev,
          profile_image: data.user.profile_image,
        }));
        setSuccess("Image uploaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "account", label: "Account" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-4 py-6 font-poppins text-gray-900">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden md:flex gap-4 shrink-0">
            <div className="">
              <CategorySidebar onCommunitySelect={() => {}} />
            </div>
            <div className="flex flex-col gap-4 w-60">
              <Sidebar />
              <Footer />
            </div>
          </div>
          <div className="w-full mx-auto px-10 text-gray-900">
            <h1 className="text-3xl font-bold bg-white mb-8">Settings</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`pb-4 px-1 text-sm font-semibold transition-all relative ${
                    activeTab === tab.id
                      ? "text-emerald-500 border-b-2 border-emerald-500"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-4xl min-h-[500px]">
              {activeTab === "account" && (
                <div className="space-y-10">
                  {/* General Section */}
                  <section>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                      General
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <label className="block text-sm font-bold text-gray-900 mb-1">
                            Email Address
                          </label>
                          <input
                            name="email"
                            type="email"
                            value={profileData.email}
                            onChange={handleInputChange}
                            className="bg-transparent border-none p-0 text-sm text-gray-500 focus:outline-none focus:ring-0 w-full"
                          />
                        </div>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="px-6 py-2 border border-emerald-500 text-emerald-500 text-sm font-bold rounded-full hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Change"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between relative">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-1">
                            Gender
                          </label>
                          <p className="text-sm text-gray-500">
                            {profileData.gender}
                          </p>
                        </div>

                        {/* Custom Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setIsGenderOpen(!isGenderOpen)}
                            className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-emerald-500 transition-all min-w-[140px]"
                          >
                            <span>{profileData.gender}</span>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${isGenderOpen ? "rotate-180" : ""}`}
                            />
                          </button>

                          {isGenderOpen && (
                            <div className="absolute right-0 top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              {["Male", "Female"].map((gender) => (
                                <button
                                  key={gender}
                                  onClick={async () => {
                                    const newData = {
                                      ...profileData,
                                      gender: gender as "Male" | "Female",
                                    };
                                    setProfileData(newData);
                                    setIsGenderOpen(false);

                                    try {
                                      if (!user)
                                        throw new Error("User not loaded");
                                      const res = await apiCall(
                                        `/api/user/${user.id}`,
                                        {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify(newData),
                                        },
                                      );
                                      if (res.ok) {
                                        setSuccess("Gender updated!");
                                        setTimeout(() => setSuccess(""), 3000);
                                      }
                                    } catch {
                                      setError("Failed to update gender");
                                    }
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-emerald-50 hover:text-emerald-600 ${profileData.gender === gender ? "bg-emerald-50 text-emerald-600" : "text-gray-600"}`}
                                >
                                  {gender}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Security Section */}
                  <section>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                      Security
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-0.5">
                            Password
                          </label>
                          <p className="text-xs text-gray-500">
                            Update your account password to stay secure
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="px-6 py-2.5 bg-gray-50 text-gray-900 text-[11px] font-bold rounded-full hover:bg-gray-100 transition-colors uppercase tracking-wider"
                      >
                        Change Password
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Profile Image */}
                    <div className="relative group mx-auto md:mx-0">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 relative">
                        {uploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                          </div>
                        ) : null}
                        {profileData.profile_image ? (
                          <Image
                            src={
                              profileData.profile_image.startsWith("http")
                                ? profileData.profile_image
                                : `${API_URL}/uploads/${profileData.profile_image}`
                            }
                            alt="Profile"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                            <UserCircle className="w-16 h-16" />
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-6 h-6" />
                          <span className="text-[10px] font-bold uppercase">
                            Change
                          </span>
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>

                    {/* Profile Form */}
                    <div className="flex-1 space-y-6 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                            Username
                          </label>
                          <input
                            name="username"
                            value={profileData.username}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-gray-900"
                            placeholder="username"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                            Profession
                          </label>
                          <input
                            name="profession"
                            value={profileData.profession}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-gray-900"
                            placeholder="Software Engineer"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={profileData.bio}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium min-h-[120px] resize-none text-gray-900"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                            Location
                          </label>
                          <input
                            name="location"
                            value={profileData.location}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-gray-900"
                            placeholder="City, Country"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                            Website
                          </label>
                          <input
                            name="website"
                            value={profileData.website}
                            onChange={handleInputChange}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-gray-900"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="bg-gray-900 text-white px-10 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(success || error) && (
                <div
                  className={`mt-8 p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${success ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                >
                  {success ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  {success || error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Change Password
              </h2>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-widest pl-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-3 border border-gray-100 text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="flex-1 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordSaving && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = () => (
  <Suspense>
    <SettingsPageInner />
  </Suspense>
);

export default SettingsPage;
