"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import { X, Send, RotateCw, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const LazyPdfPage = ({
  pageNumber,
  width,
  eager = false,
}: {
  pageNumber: number;
  width: number;
  eager?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "800px",
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [eager]);

  // A4 / most PDFs ≈ 1 : 1.414
  const estimatedHeight = width * 1.414;

  return (
    <div
      ref={ref}
      className="w-full flex justify-center"
      style={{ minHeight: estimatedHeight }}
    >
      {visible ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          devicePixelRatio={1.25}
          className="shadow-xl bg-white"
        />
      ) : (
        <div
          className="bg-white rounded shadow-inner"
          style={{
            width,
            height: estimatedHeight,
          }}
        />
      )}
    </div>
  );
};

interface FilePreviewProps {
  file?: File;
  previewUrl: string;
  onConfirm?: (processedFile?: Blob) => void;
  onCancel: () => void;
  uploading?: boolean;
  // New props for view mode
  mode?: "send" | "view";
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  onDownload?: () => void;
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
  uploading = false,
  mode = "send",
  fileName,
  fileSize,
  fileType,
  onDownload,
}: FilePreviewProps) => {
  // console.log('FilePreview rendered with:', { fileName: file?.name || fileName, previewUrl, uploading, mode });

  // Determine file type from file object or passed fileType
  const actualFileType = file?.type || fileType || "";
  const actualFileName = file?.name || fileName || "Unknown file";
  const actualFileSize = file?.size || fileSize;

  const isImage = actualFileType.startsWith("image/");
  const isVideo = actualFileType.startsWith("video/");
  const isPdf = actualFileType === "application/pdf";

  // console.log('File types:', { isImage, isVideo, isPdf, fileType: actualFileType });

  /* ---------- Crop state ---------- */
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const [numPages, setNumPages] = useState<number | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!pdfContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      setPdfWidth(pdfContainerRef.current!.clientWidth - 32);
    });

    observer.observe(pdfContainerRef.current);

    return () => observer.disconnect();
  }, []);

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
      canvas.toBlob((blob) => resolve(blob!), actualFileType, 0.95)
    );
  };

  /* ---------- Confirm ---------- */
  const handleConfirm = async () => {
    if (mode === "view") {
      // In view mode, just close the preview
      onCancel();
      return;
    }

    if (isImage && croppedAreaPixels && onConfirm) {
      const processed = await processImage();
      onConfirm(processed);
    } else if (onConfirm) {
      onConfirm();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Fallback: open in new tab
      window.open(previewUrl, "_blank");
    }
  };

  /* ---------- UI ---------- */
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              {mode === "send" ? "File Preview" : "File Viewer"}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {actualFileName}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Image editor tools - Only show in send mode */}
        {isImage && mode === "send" && (
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
              {mode === "send" ? (
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
                      width: "100%",
                      height: "100%",
                      position: "relative",
                    },
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={previewUrl}
                    alt={actualFileName}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              )}
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
            <div
              ref={pdfContainerRef}
              className="h-full w-full overflow-y-auto flex justify-center bg-zinc-200 dark:bg-zinc-800 p-4"
            >
              <Document
                file={previewUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<p className="text-zinc-600">Loading PDF…</p>}
                error={<p className="text-red-500">Failed to load PDF</p>}
                className="flex flex-col gap-6"
              >
                {numPages &&
                  pdfWidth &&
                  Array.from({ length: numPages }, (_, index) => (
                    <LazyPdfPage
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={pdfWidth}
                      eager={index < 2} // 🔥 first 2 pages instantly
                    />
                  ))}
              </Document>
            </div>
          )}

          {!isImage && !isVideo && !isPdf && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-900 dark:text-white">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium">{actualFileName}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {actualFileSize
                  ? (actualFileSize / (1024 * 1024)).toFixed(2) + " MB"
                  : "Unknown size"}
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
            {mode === "view" ? "Close" : "Cancel"}
          </button>

          {mode === "send" ? (
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
          ) : (
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
