
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadImageProps {
  onImageSelected: (file: File) => void;
}

const UploadImage = ({ onImageSelected }: UploadImageProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="p-6">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? "border-mediminds-blue bg-blue-50" : "border-gray-300"
        } transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="space-y-4">
            <img 
              src={previewUrl} 
              alt="Uploaded skin image" 
              className="max-h-64 mx-auto rounded-md shadow-md" 
            />
            <Button onClick={handleButtonClick} variant="outline">
              Change Image
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl text-mediminds-blue">
              📷
            </div>
            <h3 className="text-lg font-medium">Upload Skin Image</h3>
            <p className="text-sm text-gray-500">
              Drag and drop an image here, or click to browse
            </p>
            <Button onClick={handleButtonClick}>
              Select Image
            </Button>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </Card>
  );
};

export default UploadImage;
