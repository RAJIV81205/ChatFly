"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Send, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface FilePreviewProps {
  file: File;
  previewUrl: string;
  onConfirm: (processedFile?: Blob) => void;
  onCancel: () => void;
  uploading: boolean;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

const FilePreview = ({
  file,
  previewUrl,
  onConfirm,
  onCancel,
  uploading,
}: FilePreviewProps) => {
  // console.log('FilePreview rendered with:', { fileName: file.name, previewUrl, uploading });
  
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isPdf = file.type === "application/pdf";

  // console.log('File types:', { isImage, isVideo, isPdf, fileType: file.type });

  /* ---------- Crop state ---------- */
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Area | null>(null);

  const onCropComplete = useCallback(
    (_: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  /* ---------- Image processing ---------- */
  const processImage = async (): Promise<Blob> => {
    const image = new Image();
    image.src = previewUrl;
    await new Promise((res) => (image.onload = res));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const { width, height, x, y } = croppedAreaPixels!;

    canvas.width = width;
    canvas.height = height;

    ctx.save();

    ctx.translate(-x, -y);
    ctx.translate(image.width / 2, image.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);
    ctx.restore();

    return new Promise((resolve) =>
      canvas.toBlob(
        (blob) => resolve(blob!),
        file.type,
        0.95
      )
    );
  };

  /* ---------- Confirm ---------- */
  const handleConfirm = async () => {
    if (isImage && croppedAreaPixels) {
      const processed = await processImage();
      onConfirm(processed);
    } else {
      onConfirm();
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">File Preview</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{file.name}</p>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Image editor tools */}
        {isImage && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <button 
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button 
              onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button 
              onClick={() => setZoom((z) => Math.max(z - 0.2, 1))}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>
            <span className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">
              {Math.round(zoom * 100)}% · {rotation}°
            </span>
          </div>
        )}

        {/* Preview */}
        <div className="relative flex-1 bg-zinc-100 dark:bg-zinc-800 min-h-0">
          {isImage && (
            <div className="w-full h-full">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: {
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                  }
                }}
              />
            </div>
          )}

          {isVideo && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <video
                src={previewUrl}
                controls
                className="max-w-full max-h-full object-contain rounded-lg"
                preload="metadata"
              />
            </div>
          )}

          {isPdf && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-900 dark:text-white">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium">{file.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          {!isImage && !isVideo && !isPdf && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-900 dark:text-white">
              <div className="text-6xl mb-4">📎</div>
              <p className="text-lg font-medium">{file.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {file.type || 'Unknown type'} • {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <button 
            onClick={onCancel} 
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
