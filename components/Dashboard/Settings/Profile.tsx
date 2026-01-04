"use client";

import { useEffect, useRef, useState } from "react";

/* ----------------------------------
   Types (MATCH BACKEND EXACTLY)
---------------------------------- */
interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  profilePicUrl: string | null;
  bio: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ----------------------------------
     Fetch Profile
  ---------------------------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const username = localStorage.getItem("username");
        if (!username) return;

        const res = await fetch(`/api/users/${username}`);
        const json = await res.json();

        if (!json.success) throw new Error("Fetch failed");

        setProfile(json.user);
        setForm(json.user);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ----------------------------------
     Save Profile
  ---------------------------------- */
  const handleSave = async () => {
    if (!form) return;
    setSaving(true);

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          bio: form.bio,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error("Update failed");

      setProfile(form);
      alert("Profile updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------------
     Avatar Upload
  ---------------------------------- */
  const handleAvatarUpload = async (file: File) => {
    if (!form) return;

    // Instant preview
    const preview = URL.createObjectURL(file);
    setForm({ ...form, profilePicUrl: preview });

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error("Upload failed");

      setProfile((prev) =>
        prev ? { ...prev, profilePicUrl: json.profilePicUrl } : prev
      );
      setForm((prev) =>
        prev ? { ...prev, profilePicUrl: json.profilePicUrl } : prev
      );
    } catch (err) {
      console.error(err);
      alert("Avatar upload failed");
    }
  };

  if (loading) return <div className="p-8">Loading…</div>;
  if (!form) return <div className="p-8">Profile not found</div>;

  return (
    <div className="flex-1 p-8 bg-white dark:bg-zinc-900 transition-colors">
      <div className="max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your personal information
          </p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            {form.profilePicUrl ? (
              <img
                src={form.profilePicUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm"
          >
            Change Avatar
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) =>
              e.target.files && handleAvatarUpload(e.target.files[0])
            }
          />
        </div>

        {/* Fields */}
        <Input
          label="Full Name"
          value={form.fullName}
          onChange={(v) => setForm({ ...form, fullName: v })}
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />

        <Input
          label="Phone"
          value={form.phone ?? ""}
          onChange={(v) =>
            setForm({ ...form, phone: v || null })
          }
        />

        <Textarea
          label="Bio"
          value={form.bio ?? ""}
          onChange={(v) =>
            setForm({ ...form, bio: v || null })
          }
        />

        {/* Meta Info */}
        <div className="text-sm text-zinc-500 space-y-1">
          <p>Username: @{form.username}</p>
          <p>Email verified: {form.emailVerified ? "Yes" : "No"}</p>
          <p>Joined: {new Date(form.createdAt).toDateString()}</p>
          <p>Last updated: {new Date(form.updatedAt).toDateString()}</p>
        </div>

        {/* Save */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

/* ----------------------------------
   Reusable Inputs
---------------------------------- */

const Input = ({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
    />
  </div>
);

const Textarea = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
      {label}
    </label>
    <textarea
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 resize-none"
    />
  </div>
);
