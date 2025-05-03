import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  status: "ok" | "missing" | "loading" | "error";
}

const requiredBuckets = [
  { id: "recipe-images", name: "Recipe Images", public: true },
  { id: "recipe-videos", name: "Recipe Videos", public: true },
  { id: "profile-images", name: "Profile Images", public: true },
];

export const StorageStatus = () => {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = async () => {
    setIsLoading(true);
    try {
      // Get all buckets
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error("Error fetching buckets:", error);
        setBuckets(
          requiredBuckets.map((bucket) => ({
            ...bucket,
            status: "error" as const,
          }))
        );
        return;
      }

      // Map required buckets with their status
      const bucketStatus = requiredBuckets.map((requiredBucket) => {
        const found = data.find((b) => b.id === requiredBucket.id);
        return {
          ...requiredBucket,
          status: found ? ("ok" as const) : ("missing" as const),
        };
      });

      setBuckets(bucketStatus);
    } catch (error) {
      console.error("Error checking storage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBucket = async (bucketId: string) => {
    try {
      const { data, error } = await supabase.storage.createBucket(bucketId, {
        public: true,
      });

      if (error) {
        toast.error(`Failed to create bucket: ${error.message}`);
        return false;
      }

      toast.success(`Created bucket: ${bucketId}`);
      checkStorage();
      return true;
    } catch (error) {
      console.error(`Error creating bucket ${bucketId}:`, error);
      toast.error(`Error creating bucket ${bucketId}`);
      return false;
    }
  };

  const createAllBuckets = async () => {
    const missingBuckets = buckets.filter((b) => b.status === "missing");
    let success = true;

    for (const bucket of missingBuckets) {
      const result = await createBucket(bucket.id);
      if (!result) success = false;
    }

    if (success) {
      toast.success("All storage buckets created successfully");
    }
  };

  const testImageUpload = async () => {
    setIsTesting(true);
    try {
      // Create a 1x1 pixel transparent PNG as a base64 string
      const tinyPng =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

      // Convert base64 to blob
      const res = await fetch(tinyPng);
      const blob = await res.blob();

      // Upload test image
      const fileName = `test-image-${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from("recipe-images")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) {
        toast.error(`Failed to upload test image: ${error.message}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName);

      setTestImageUrl(urlData.publicUrl);
      toast.success("Test image uploaded successfully");
    } catch (error) {
      console.error("Error testing image upload:", error);
      toast.error("Failed to test image upload");
    } finally {
      setIsTesting(false);
    }
  };

  const getSqlSnippet = () => {
    return `-- Create storage buckets for image storage
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-videos', 'recipe-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Set up storage policies for authenticated users
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT TO authenticated USING (
  bucket_id IN ('recipe-images', 'recipe-videos', 'profile-images')
);

CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT USING (
  bucket_id IN ('recipe-images', 'recipe-videos', 'profile-images')
);

CREATE POLICY "Allow authenticated users to update their uploaded images"
ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id IN ('recipe-images', 'recipe-videos', 'profile-images')
);

CREATE POLICY "Allow authenticated users to delete their uploaded images"
ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id IN ('recipe-images', 'recipe-videos', 'profile-images')
);`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getSqlSnippet());
    toast.success("SQL copied to clipboard");
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Supabase Storage Status</h3>
        <button
          onClick={checkStorage}
          disabled={isLoading}
          className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          {isLoading ? "Checking..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-2">
        {buckets.map((bucket) => (
          <div
            key={bucket.id}
            className="flex items-center justify-between border-b pb-2"
          >
            <div className="flex items-center gap-2">
              {bucket.status === "ok" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-500"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : bucket.status === "missing" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-yellow-500 animate-spin"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              <span>{bucket.name}</span>
            </div>
            {bucket.status === "missing" && (
              <button
                onClick={() => createBucket(bucket.id)}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
              >
                Create
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {buckets.some((b) => b.status === "missing") && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded">
            <h4 className="font-medium text-amber-800">
              Missing Storage Buckets
            </h4>
            <p className="text-sm text-amber-700 mt-1">
              Some required storage buckets are missing. You can create them
              automatically or run the SQL in your Supabase dashboard.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={createAllBuckets}
                className="px-3 py-1 text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 rounded"
              >
                Create All Buckets
              </button>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Copy SQL
              </button>
            </div>
          </div>
        )}

        {buckets.every((b) => b.status === "ok") && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-100 rounded">
              <h4 className="font-medium text-green-800">
                All Storage Buckets Ready
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your Supabase storage is properly configured. Images will be
                stored in the cloud and synchronized across devices.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Test Image Upload</h4>
                <button
                  onClick={testImageUpload}
                  disabled={isTesting}
                  className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                >
                  {isTesting ? "Testing..." : "Test Upload"}
                </button>
              </div>
              {testImageUrl && (
                <div className="p-3 bg-gray-50 border rounded space-y-2">
                  <p className="text-sm">Test image uploaded successfully:</p>
                  <div className="flex items-center gap-2">
                    <img
                      src={testImageUrl}
                      alt="Test"
                      className="w-8 h-8 border bg-gray-100"
                    />
                    <input
                      type="text"
                      value={testImageUrl}
                      readOnly
                      className="text-xs p-1 bg-white border rounded flex-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        <p>
          Storage buckets are required for image storage. The image processing
          system automatically captures Instagram images and stores them in
          Supabase, preventing the need to re-scrape them on each load.
        </p>
      </div>
    </div>
  );
};
