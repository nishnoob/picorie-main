"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadImageToAirtable } from "../utils/airtable";

interface PhotoTileProps {
  imageUrl?: string;
}

export const PhotoTile = ({ imageUrl }: PhotoTileProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        await uploadImageToAirtable(file);
      } catch (error) {
        console.error("Failed to upload image:", error);
        // You might want to show an error message to the user here
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (imageUrl) {
    return (
      <div className="aspect-square relative border-t-2 border-l-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt="Photo"
          className="w-full h-full object-cover"
          width={100}
          height={100}
        />
      </div>
    );
  }

  return (
    <div className="aspect-square relative border-t-2 border-l-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
      {isUploading ? (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="relative aspect-square cursor-pointer overflow-hidden rounded-lg"
        >
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};
