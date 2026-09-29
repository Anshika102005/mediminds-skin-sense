
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, RefreshCw, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";

interface UploadImageProps {
  onImageSelected: (file: File) => void;
}

const UploadImage = ({ onImageSelected }: UploadImageProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { language } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      onImageSelected(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      alert("Camera access unavailable.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-skin-capture.jpg", { type: "image/jpeg" });
          processFile(file);
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  return (
    <Card className="p-6 bg-white border border-[#DCE7E5] shadow-sm rounded-xl">
      <div className="mb-4">
        <h3 className="text-base font-bold text-[#17324D]">
          {language === "hi" ? "त्वचा की तस्वीर अपलोड या कैप्चर करें" : "Upload or Capture Lesion Image"}
        </h3>
        <p className="text-xs text-[#7B8B98]">
          {language === "hi" ? "कैमरे से फोटो लें या फाइल अपलोड करें।" : "Capture with camera or choose a clear, focused photo."}
        </p>
      </div>

      {isCameraActive ? (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-sm mx-auto">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={capturePhoto} className="bg-[#2E8B72] text-white text-xs">
              <Camera className="w-4 h-4 mr-1.5" /> Capture Photo
            </Button>
            <Button onClick={stopCamera} variant="outline" className="text-xs">Cancel</Button>
          </div>
        </div>
      ) : previewUrl ? (
        <div className="space-y-4 text-center">
          <div className="relative inline-block">
            <img src={previewUrl} alt="Uploaded skin lesion" className="max-h-72 w-auto mx-auto rounded-xl border border-[#DCE7E5] object-cover" />
            <div className="absolute top-2 right-2 bg-[#2E8B72] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center shadow-sm">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Change Image
            </Button>
            <Button onClick={() => setPreviewUrl(null)} variant="ghost" size="sm" className="text-xs text-[#B84A5A]">Remove</Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging ? "border-mediminds-blue bg-[#EEF7F5]" : "border-[#DCE7E5] bg-[#F7FAF9]"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-12 h-12 rounded-xl bg-[#EEF7F5] text-[#0F766E] flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#17324D] mb-1">
            {language === "hi" ? "तस्वीर यहां खींचें या चुनें" : "Drag and drop your skin image here"}
          </p>
          <p className="text-xs text-[#7B8B98] mb-5">JPEG, PNG or WebP up to 8MB.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={() => fileInputRef.current?.click()} className="bg-[#0F766E] text-white text-xs">
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Select File
            </Button>
            {navigator.mediaDevices?.getUserMedia && (
              <Button onClick={startCamera} variant="outline" className="border-[#DCE7E5] text-[#5F7182] text-xs">
                <Camera className="w-3.5 h-3.5 mr-1.5" /> Use Camera
              </Button>
            )}
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
    </Card>
  );
};

export default UploadImage;
