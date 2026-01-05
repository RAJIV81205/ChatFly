"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle , Save, LogOut, Loader2} from "lucide-react";
import Cropper from "react-easy-crop";

/* ---------------- Types ---------------- */
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedPixels, setCroppedPixels] = useState<any>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ---------------- Fetch profile ---------------- */
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

  /* ---------------- Save profile ---------------- */
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

  /* ---------------- Avatar upload ---------------- */
  const handleAvatarChange = async (file: File) => {
    if (!form) return;

    const username = localStorage.getItem("username");
    if (!username) return;

    const previewUrl = URL.createObjectURL(file);
    setForm({ ...form, profilePicUrl: previewUrl });

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`/api/users/${username}/avatar`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error("Upload failed");

      setForm((prev) =>
        prev ? { ...prev, profilePicUrl: json.profilePicUrl } : prev
      );
    } catch (err) {
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // IMPORTANT
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      // Clear client storage
      localStorage.clear();
      sessionStorage.clear();

      // Reload or redirect
      window.location.href = "/auth/login"; // or window.location.reload();
    }
  };

  if (loading || !form) return <div className="p-8">Loading…</div>;

  return (
    <div className="flex-1 bg-white dark:bg-zinc-900">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* ---------------- Header ---------------- */}
        <div className="flex items-center gap-5">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <div
              className="relative h-20 w-20 rounded-full overflow-hidden 
              bg-linear-to-br from-zinc-200 to-zinc-300 
              dark:from-zinc-700 dark:to-zinc-800
              ring-2 ring-zinc-300 dark:ring-zinc-700 transition"
            >
              {form.profilePicUrl ? (
                <img
                  src={form.profilePicUrl}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl font-semibold text-zinc-500">
                  {form.fullName.charAt(0)}
                </div>
              )}

              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white backdrop-blur-sm">
                  Uploading…
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-white">
                Change
              </div>
            </div>
          </div>

          <div className="flex-1 leading-tight">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {form.fullName}
            </h1>
            <p className="text-sm text-zinc-500">@{form.username}</p>
          </div>

          {/* ---------------- Meta ---------------- */}
          <div className="text-xs text-zinc-500 space-y-1">
            <p>Created · {new Date(form.createdAt).toDateString()}</p>
            <p>Updated · {new Date(form.updatedAt).toDateString()}</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => {
              if (!e.target.files) return;
              setEditorImage(URL.createObjectURL(e.target.files[0]));
            }}
          />
        </div>

        {/* ---------------- Form Card ---------------- */}
        <div className="space-y-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <Field label="Full name">
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none"
            />
          </Field>

          <Field label="Email">
            <div className="flex items-center gap-2">
              <input
                value={form.email}
                disabled
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-sm"
              />
              {form.emailVerified && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  Verified
                </span>
              )}
            </div>
          </Field>

          <Field label="Phone">
            <input
              value={form.phone ?? ""}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value || null })
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none"
            />
          </Field>

          <Field label="Bio">
            <textarea
              rows={3}
              value={form.bio ?? ""}
              onChange={(e) =>
                setForm({ ...form, bio: e.target.value || null })
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none"
            />
          </Field>
        </div>

        <div className="flex gap-3">
          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* ---------------- Avatar Editor (unchanged logic) ---------------- */}
      {editorImage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 w-[90vw] max-w-lg rounded-xl p-4 space-y-4">
            <div className="relative h-64 bg-black rounded-lg overflow-hidden">
              <Cropper
                image={editorImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, pixels) => setCroppedPixels(pixels)}
              />
            </div>

            <div className="flex justify-around">
              <div className="flex flex-col items-center space-y-1">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(+e.target.value)}
                />
                <label className="text-xs">Zoom</label>
              </div>

              <div className="flex flex-col items-center space-y-1">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={rotation}
                  onChange={(e) => setRotation(+e.target.value)}
                />
                <label className="text-xs">Rotate</label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditorImage(null);
                  setCrop({ x: 0, y: 0 });
                  setCroppedPixels(null);
                  setZoom(1);
                  setRotation(0);
                }}
                className="px-3 py-1.5 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!croppedPixels) return;
                  const file = await getEditedImage(
                    editorImage,
                    croppedPixels,
                    rotation
                  );
                  setEditorImage(null);
                  handleAvatarChange(file);
                  setCrop({ x: 0, y: 0 });
                  setCroppedPixels(null);
                  setZoom(1);
                  setRotation(0);
                }}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

/* ---------------- Field ---------------- */
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

/* ---------------- Image helpers ---------------- */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

async function getEditedImage(
  imageSrc: string,
  cropPixels: any,
  rotation: number
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.translate(-cropPixels.x, -cropPixels.y);
  ctx.translate(image.width / 2, image.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) =>
        resolve(new File([blob!], "avatar.webp", { type: "image/webp" })),
      "image/webp",
      0.95
    );
  });
}
