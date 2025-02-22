"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadImageToAirtable, updatePhotoLayout } from "../utils/airtable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PhotoTileProps {
  imageUrl?: string;
  recordId?: string;
  layout?: string;
}

export const PhotoTile = ({
  imageUrl,
  recordId,
  layout = "1x1",
}: PhotoTileProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const layoutOptions = [
    { id: "1x1", label: "Square (1×1)" },
    { id: "1x2", label: "Vertical (1×2)" },
    { id: "2x1", label: "Horizontal (2×1)" },
    { id: "2x2", label: "Large (2×2)" },
  ];

  const getLayoutClasses = (layout: string) => {
    const baseClasses =
      "relative border border-neutral-800 rounded-lg overflow-hidden";
    switch (layout) {
      case "1x2":
        return `${baseClasses} row-span-2`;
      case "2x1":
        return `${baseClasses} col-span-2`;
      case "2x2":
        return `${baseClasses} col-span-2 row-span-2`;
      default:
        return baseClasses;
    }
  };

  const handleLayoutChange = async (newLayout: string) => {
    if (recordId) {
      try {
        await updatePhotoLayout(recordId, newLayout);
        setIsDrawerOpen(false);
      } catch (error) {
        console.error("Failed to update layout:", error);
      }
    }
  };

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
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetTrigger asChild>
          <div className={getLayoutClasses(layout)}>
            <Image
              src={imageUrl}
              alt="Photo"
              className="w-full h-full object-cover"
              width={100}
              height={100}
              loading="lazy"
            />
          </div>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[300px]">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Choose Layout</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {layoutOptions.map((option) => (
              <Button
                key={option.id}
                onClick={() => handleLayoutChange(option.id)}
                variant={layout === option.id ? "default" : "outline"}
                className="w-full h-24"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="aspect-square relative border border-neutral-800 rounded-lg overflow-hidden">
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
