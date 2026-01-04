"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";

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
  const [form, setForm] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const username = localStorage.getItem("username");
      if (!username) return;

      const res = await fetch(`/api/users/${username}`);
      const json = await res.json();

      setForm(json.user);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);

    const username = localStorage.getItem("username");
      if (!username) return;

    await fetch(`/api/users/${username}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        phone: form.phone,
        bio: form.bio,
      }),
    });

    setSaving(false);
  };

  if (loading || !form) return <div className="p-8">Loading…</div>;

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            {form.profilePicUrl && (
              <img
                src={form.profilePicUrl}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {form.fullName}
            </h1>
            <p className="text-sm text-zinc-500">@{form.username}</p>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="text-sm px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Change
          </button>

          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/*"
          />
        </div>

        {/* Form */}
        <div className="space-y-6">

          <Field label="Full name">
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
              className="input"
            />
          </Field>

          <Field label="Email">
            <div className="flex items-center gap-2">
              <input
                value={form.email}
                disabled
                className="input bg-zinc-50 dark:bg-zinc-800 cursor-default"
              />
              {form.emailVerified && (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              )}
            </div>
          </Field>

          <Field label="Phone">
            <input
              value={form.phone ?? ""}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value || null })
              }
              className="input"
            />
          </Field>

          <Field label="Bio">
            <textarea
              rows={3}
              value={form.bio ?? ""}
              onChange={(e) =>
                setForm({ ...form, bio: e.target.value || null })
              }
              className="input resize-none"
            />
          </Field>
        </div>

        {/* Meta */}
        <div className="text-xs text-zinc-500 space-y-1">
          <p>Created · {new Date(form.createdAt).toDateString()}</p>
          <p>Updated · {new Date(form.updatedAt).toDateString()}</p>
        </div>

        {/* Save */}
        <div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

/* ---------- Field ---------- */
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm mb-1 text-zinc-600 dark:text-zinc-400">
      {label}
    </label>
    {children}
  </div>
);

/* ---------- Input Style ----------
Add once to globals.css:

.input {
  @apply w-full px-3 py-2 rounded-lg
  border border-zinc-300 dark:border-zinc-700
  bg-white dark:bg-zinc-900
  text-zinc-900 dark:text-white
  focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white;
}
-------------------------------- */
