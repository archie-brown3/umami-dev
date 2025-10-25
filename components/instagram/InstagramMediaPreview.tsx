import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface InstagramMediaPreviewProps {
  mediaUrls: string[];
  username?: string;
  profilePictureUrl?: string;
}

const InstagramMediaPreview: React.FC<InstagramMediaPreviewProps> = ({
  mediaUrls,
  username,
  profilePictureUrl,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) {
    return (
      <div className="border rounded-md p-4 text-center text-gray-500">
        No media available
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaUrls.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + mediaUrls.length) % mediaUrls.length
    );
  };

  return (
    <div className="relative">
      {/* User Information */}
      {(username || profilePictureUrl) && (
        <div className="flex items-center mb-2 p-2">
          {profilePictureUrl && (
            <img
              src={profilePictureUrl}
              alt={username || "Profile"}
              className="w-8 h-8 rounded-full object-cover mr-2"
            />
          )}
          {username && <span className="font-medium text-sm">@{username}</span>}
        </div>
      )}

      {/* Media Container */}
      <div className="relative rounded-lg overflow-hidden bg-gray-100">
        <img
          src={mediaUrls[currentIndex]}
          alt={`Instagram media ${currentIndex + 1}`}
          className="w-full h-auto max-h-[500px] object-contain mx-auto"
        />

        {/* Navigation Arrows (only if more than 1 item) */}
        {mediaUrls.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-1 shadow-md hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-1 shadow-md hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Pagination Indicators */}
        {mediaUrls.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {mediaUrls.map((_, index) => (
              <span
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Counter */}
      {mediaUrls.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {mediaUrls.length}
        </div>
      )}
    </div>
  );
};

export default InstagramMediaPreview;
