"use client";

import { useState, useEffect } from "react";
import { PhotoTile } from "./PhotoTile";
import { getPhotosFromAirtable, GalleryPhoto } from "../utils/airtable";

export const PhotoGrid = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const photos = await getPhotosFromAirtable();
        setPhotos(photos);
      } catch (error) {
        console.error("Error fetching photos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  if (isLoading) {
    return <div>Loading photos...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-1 ">
      {photos.map((photo) => (
        <PhotoTile key={photo?.id} data={photo} />
      ))}
      <PhotoTile />
    </div>
  );
};
