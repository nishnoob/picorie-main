'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  uploadImageToAirtable,
  updatePhotoLayout,
  uploadAndUpdatePhotoCrop,
} from '../utils/airtable';
import ReactCrop, { PercentCrop, PixelCrop, type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GalleryPhoto } from '../utils/airtable';

interface PhotoTileProps {
  data?: GalleryPhoto;
}

export const PhotoTile = ({ data }: PhotoTileProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [gridSize, setGridSize] = useState(1);

  useEffect(() => {
    if (window) {
      const size = (window.innerWidth - 32 - 8) / 2;
      setGridSize(size);
    }
  }, []);

  const layoutOptions = [
    { id: '1x1', label: 'Square (1×1)', aspect: 1 },
    { id: '1x2', label: 'Vertical (1×2)', aspect: 0.5 },
    { id: '2x1', label: 'Horizontal (2×1)', aspect: 2 },
    { id: '2x2', label: 'Large (2×2)', aspect: 1 },
  ];

  const getLayoutClasses = (layout: string) => {
    const baseClasses = 'relative border border-neutral-800 rounded-lg overflow-hidden';
    switch (layout) {
      case '1x2':
        return `${baseClasses} row-span-2`;
      case '2x1':
        return `${baseClasses} col-span-2`;
      case '2x2':
        return `${baseClasses} col-span-2 row-span-2`;
      case '1x1':
        return `${baseClasses} col-span-1 row-span-1`;
      default:
        return baseClasses;
    }
  };

  const calcLayoutSize = () => {
    const layout = layoutOptions.find((opt) => opt.id === data?.layout);
    // calculate width and height from aspect ratio and gridSize
    const width = gridSize * (layout?.aspect || 1);
    const height = gridSize;
    return { width, height };
  };

  const handleLayoutChange = async (newLayout: string) => {
    if (data?.id) {
      try {
        await updatePhotoLayout(data.id, newLayout);
        const newLayoutOption = layoutOptions.find((opt) => opt.id === newLayout);
        if (newLayoutOption) {
          setCrop((prev) => ({
            ...prev,
            aspect: newLayoutOption.aspect,
          }));
        }
        setIsDrawerOpen(false);
      } catch (error) {
        console.error('Failed to update layout:', error);
      }
    }
  };

  const handleCropComplete = (pixelCrop: PixelCrop, percentCrop: PercentCrop): void => {
    setCompletedCrop(pixelCrop);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        await uploadImageToAirtable(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  function onSaveCrop() {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height,
      );

      canvas.toBlob(async (blob) => {
        if (blob && data?.id) {
          try {
            // ignore cors
            const croppedImageFile = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
            await uploadAndUpdatePhotoCrop(data, croppedImageFile);
          } catch (error) {
            console.error('Failed to save crop:', error);
          }
        }
      });
    }
  }

  if (data?.image) {
    const { width, height } = calcLayoutSize();
    return (
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetTrigger asChild>
          <div className={getLayoutClasses(data?.layout)}>
            <Image
              src={data.cropped_img || data.image}
              alt="Photo"
              className="h-full w-full object-cover"
              width={width}
              height={height}
              loading="lazy"
              crossOrigin="anonymous"
            />
            <canvas ref={canvasRef} className="absolute opacity-0" width={100} height={100} />
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
                    variant={data?.layout === option.id ? 'default' : 'outline'}
                    className="h-24 w-full"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="crop" className="mt-4">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={handleCropComplete}
                aspect={1}
                minHeight={100}
              >
                <img ref={imgRef} src={data?.image} crossOrigin="anonymous" alt="Photo to crop" />
              </ReactCrop>
              <Button
                onClick={onSaveCrop}
                className="mt-4 w-full"
                disabled={!completedCrop?.width || !completedCrop?.height}
              >
                Save Crop
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag to crop. The aspect ratio is locked to match your selected layout (
                {data?.layout}).
              </p>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-800">
      {isUploading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
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
