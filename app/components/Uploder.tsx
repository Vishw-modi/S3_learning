/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import axios from "axios";

const Uploader = () => {
  const [files, setFiles] = useState<
    Array<{
      id: string;
      file: File;
      uploading: boolean;
      progress: number;
      key?: string;
      isDeleting: boolean;
      error: boolean;
      objectUrl?: string;
    }>
  >([]);

  useEffect(() => {
    console.log(files);
  }, [files]);

  async function uploadFile(file: File) {
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.file === file ? { ...f, uploading: true } : f))
    );

    try {
      const presignedUrlResponse = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": " application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!presignedUrlResponse.ok) {
        toast.error(
          "Error occured While Generating Your PresignedUrl. Try again please"
        );

        setFiles((prevfile) =>
          prevfile.map((f) =>
            f.file === file
              ? { ...f, uploading: false, progress: 0, error: true }
              : f
          )
        );
        return;
      }

      const { presignedUrl, key } = await presignedUrlResponse.json();

      await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setFiles((prevfiles) =>
            prevfiles.map((f) =>
              f.file === file ? { ...f, progress: progress } : f
            )
          );
        },
      });

      toast.success(`File ${file.name} Uploaded Successfully`);

      setFiles((prevfiles) =>
        prevfiles.map((f) =>
          f.file === file ? { ...f, uploading: false, key } : f
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("Error Occurred While Uploading File. Try again please");
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles);
    if (acceptedFiles.length === 0) {
      toast.error("No files accepted");
    }

    if (acceptedFiles.length > 0) {
      // setFiles((prevfiles) => [
      //   ...prevfiles,
      //   ...acceptedFiles.map((file) => ({
      //     id: crypto.randomUUID(),
      //     file: file,
      //     uploading: false,
      //     progress: 0,
      //     isDeleting: false,
      //     error: false,
      //     objectUrl: URL.createObjectURL(file),
      //   })),
      // ]);

      const newFileObject = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file: file,
        uploading: false,
        progress: 0,
        isDeleting: false,
        error: false,
        objectUrl: URL.createObjectURL(file),
      }));

      setFiles((prevFiles) => [...prevFiles, ...newFileObject]);

      newFileObject.forEach((file) => {
        uploadFile(file.file);
      });

      toast.success("Files uploaded successsfully");
    }
  }, []);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      fileRejections.forEach((file) => {
        const filename = file.file.name;
        file.errors.forEach((error) => {
          switch (error.code) {
            case "too-many-files":
              toast.error(
                `Too many files selected. You can only upload up to 5 files at a time.`
              );
              break;
            case "file-too-large":
              toast.error(`${filename}: is too large. Max file size is 5MB.`);
              break;
            case "file-invalid-type":
              toast.error(`${filename}: is not a supported file type.`);
              break;
            default:
              toast.error(
                `"${filename}" could not be uploaded due to an unknown error.`
              );
              break;
          }
        });
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: 5,
    maxSize: 1024 * 1024 * 5,
    accept: {
      "image/*": [],
      "application/pdf": [],
    },
  });

  return (
    <>
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={clsx(
            "flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-colors duration-200",
            isDragActive
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 bg-white hover:border-blue-400"
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-orange-500 font-semibold text-lg">
              Drop the files here...
            </p>
          ) : (
            <p className="text-gray-600 text-center">
              Drag &apos;n&apos; drop some files here, or{" "}
              <span className="text-blue-600 font-semibold underline">
                click to select files
              </span>
            </p>
          )}
        </div>

        {/* File Previews */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
          {files.map((file) => (
            <div
              key={file.id}
              className="relative w-full aspect-square border border-gray-300 rounded-lg overflow-hidden shadow-sm group"
            >
              <img
                src={file.objectUrl}
                alt={file.file.name}
                className={clsx(
                  "object-contain w-full h-full transition-opacity",
                  file.uploading ? "opacity-60" : "opacity-100"
                )}
              />

              {/* File Name Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                {file.file.name}
              </div>

              {/* Uploading Overlay */}
              {file.uploading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center px-2">
                  <p className="text-white text-xs mb-1">Uploading...</p>
                  <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <p className="text-white text-[10px] mt-1">
                    {file.progress}%
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Uploader;
