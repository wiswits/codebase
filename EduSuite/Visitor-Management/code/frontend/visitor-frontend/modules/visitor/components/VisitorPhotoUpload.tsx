"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";

interface VisitorPhotoUploadProps {
  value?: File | null;
  onChange?: (file: File | null) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

export default function VisitorPhotoUpload({
  value = null,
  onChange,
  disabled = false,
  maxSizeMB = 5,
}: VisitorPhotoUploadProps) {
  const [error, setError] = useState<string | null>(
    null
  );

  const preview = useMemo(() => {
    if (!value) {
      return null;
    }

    return URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError(null);

    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      onChange?.(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      event.target.value = "";
      return;
    }

    const maxBytes =
      maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      setError(
        `Image must be smaller than ${maxSizeMB} MB.`
      );

      event.target.value = "";
      return;
    }

    onChange?.(file);
  }

  function removePhoto() {
    setError(null);
    onChange?.(null);
  }

  return (
    <div style={containerStyle}>
      <div style={previewStyle}>
        {preview ? (
          <Image
            src={preview}
            alt="Visitor preview"
            fill
            unoptimized
            sizes="100px"
            style={imageStyle}
          />
        ) : (
          <div style={placeholderStyle}>
            Photo
          </div>
        )}
      </div>

      <div style={contentStyle}>
        <strong style={titleStyle}>
          Visitor Photo
        </strong>

        <p style={descriptionStyle}>
          Select a visitor photo for identification.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={disabled}
        />

        {value && (
          <button
            type="button"
            disabled={disabled}
            onClick={removePhoto}
            style={removeStyle}
          >
            Remove photo
          </button>
        )}

        {error && (
          <p
            role="alert"
            style={errorStyle}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: 20,
  padding: 20,
  border: "1px solid #d8e0eb",
  borderRadius: 14,
  background: "#ffffff",
};

const previewStyle = {
  position: "relative" as const,
  width: 100,
  height: 100,
  flexShrink: 0,
  overflow: "hidden",
  borderRadius: 12,
  background: "#f8f5ed",
};

const imageStyle = {
  objectFit: "cover" as const,
};

const placeholderStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#60708c",
  fontSize: 13,
};

const contentStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 9,
  flex: 1,
  minWidth: 220,
};

const titleStyle = {
  color: "#071f4e",
};

const descriptionStyle = {
  margin: 0,
  color: "#60708c",
  fontSize: 13,
};

const removeStyle = {
  alignSelf: "flex-start",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "#b42318",
  cursor: "pointer",
  fontWeight: 600,
};

const errorStyle = {
  margin: 0,
  color: "#b42318",
  fontSize: 12,
};