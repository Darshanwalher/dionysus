import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

/**
 * useImageKitUpload
 *
 * Returns { upload, uploading, progress }
 *
 * upload(file) → Promise<string>  — resolves with the final CDN URL
 *
 * Flow:
 *   1. GET /api/auth/imagekit-auth  — server signs short-lived credentials
 *   2. POST directly to ImageKit upload endpoint (private key never leaves server)
 *   3. Returns image URL with face-crop + circular transform applied
 */
export function useImageKitUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file) => {
    if (!file) throw new Error("No file provided");

    // Validate type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      throw new Error("Only JPG, PNG, WebP, or GIF images are allowed.");
    }

    // Validate size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image must be smaller than 5 MB.");
    }

    setUploading(true);
    setProgress(10);

    try {
      // 1. Get signed auth params from our backend
      const token = localStorage.getItem("token");
      const authRes = await fetch(`${API_BASE}/auth/imagekit-auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!authRes.ok) {
        const err = await authRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to get upload credentials.");
      }

      const { token: ikToken, expire, signature, publicKey, urlEndpoint } =
        await authRes.json();

      setProgress(30);

      // 2. Build FormData for ImageKit upload
      const form = new FormData();
      form.append("file", file);
      form.append("fileName", `avatar_${Date.now()}`);
      form.append("folder", "/avatars");
      form.append("useUniqueFileName", "true");
      form.append("token", ikToken);
      form.append("expire", String(expire));
      form.append("signature", signature);
      form.append("publicKey", publicKey);

      setProgress(50);

      // 3. Upload directly to ImageKit CDN
      const uploadRes = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: "POST",
        body: form,
      });

      setProgress(90);

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.message || "ImageKit upload failed.");
      }

      const json = await uploadRes.json();

      // 4. Apply face-crop + circle transform via URL param
      const finalUrl = `${json.url}?tr=w-200,h-200,fo-face,r-max`;

      setProgress(100);
      return finalUrl;
    } finally {
      // slight delay so the 100% progress is visible
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 400);
    }
  }, []);

  return { upload, uploading, progress };
}
