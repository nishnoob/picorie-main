"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  uploadImageToAirtable,
  updatePhotoLayout,
  updatePhotoCrop,
  type CropData,
} from "../utils/airtable";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GalleryPhoto } from "../utils/airtable";

interface PhotoTileProps {
  data?: GalleryPhoto;
}

export const PhotoTile = ({ data }: PhotoTileProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState<Crop>(
    data?.cropData
      ? {
          unit: data?.cropData.unit,
          x: data?.cropData.x,
          y: data?.cropData.y,
          width: data?.cropData.width,
          height: data?.cropData.height,
        }
      : {
          unit: "%",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
  );

  const layoutOptions = [
    { id: "1x1", label: "Square (1×1)", aspect: 1 },
    { id: "1x2", label: "Vertical (1×2)", aspect: 0.5 },
    { id: "2x1", label: "Horizontal (2×1)", aspect: 2 },
    { id: "2x2", label: "Large (2×2)", aspect: 1 },
  ];

  const getLayoutClasses = (layout: string) => {
    const baseClasses =
      "relative border border-neutral-800 rounded-lg overflow-hidden";
    switch (layout) {
      case "1x2":
        return `${baseClasses} col-span-2`;
      case "2x1":
        return `${baseClasses} row-span-2`;
      case "2x2":
        return `${baseClasses} col-span-2 row-span-2`;
      default:
        return baseClasses;
    }
  };

  const handleLayoutChange = async (newLayout: string) => {
    if (data?.id) {
      try {
        await updatePhotoLayout(data.id, newLayout);
        const newLayoutOption = layoutOptions.find(
          (opt) => opt.id === newLayout,
        );
        if (newLayoutOption) {
          setCrop((prev) => ({
            ...prev,
            aspect: newLayoutOption.aspect,
          }));
        }
        setIsDrawerOpen(false);
      } catch (error) {
        console.error("Failed to update layout:", error);
      }
    }
  };

  const handleCropComplete = async (crop: Crop) => {
    if (data?.id && crop.width && crop.height) {
      try {
        await updatePhotoCrop(data.id, {
          x: crop.x,
          y: crop.y,
          width: crop.width,
          height: crop.height,
          unit: crop.unit,
        });
      } catch (error) {
        console.error("Failed to update crop:", error);
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
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (data?.image) {
    return (
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetTrigger asChild>
          <div className={getLayoutClasses(data?.layout)}>
            <Image
              src={data.image}
              alt="Photo"
              className="w-full h-full object-cover"
              width={100}
              height={100}
              loading="lazy"
              style={
                data?.cropData
                  ? {
                      objectPosition: `-${data?.cropData.x}px -${data?.cropData.y}px`,
                      objectFit: "cover",
                    }
                  : undefined
              }
            />
          </div>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Edit Photo</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="layout" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="crop">Crop</TabsTrigger>
            </TabsList>
            <TabsContent value="layout" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {layoutOptions.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => handleLayoutChange(option.id)}
                    variant={data?.layout === option.id ? "default" : "outline"}
                    className="w-full h-24"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="crop" className="mt-4">
              <div className="relative w-full overflow-hidden rounded-lg border border-neutral-800">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={handleCropComplete}
                  aspect={
                    layoutOptions.find((opt) => opt.id === data?.layout)?.aspect
                  }
                  className="max-h-[60vh]"
                >
                  <Image
                    src={data?.image}
                    alt="Photo to crop"
                    className="w-full h-full object-contain"
                    width={800}
                    height={600}
                  />
                </ReactCrop>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Drag to crop. The aspect ratio is locked to match your selected
                layout ({data?.layout}).
              </p>
            </TabsContent>
          </Tabs>
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
