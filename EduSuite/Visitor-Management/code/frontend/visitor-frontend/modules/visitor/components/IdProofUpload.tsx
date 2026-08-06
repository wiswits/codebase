"use client";

import { useRef, useState } from "react";

interface IdProofUploadProps {
  value?: File | null;
  disabled?: boolean;
  required?: boolean;
  maxSizeMB?: number;
  onChange?: (file: File | null) => void;
}

export default function IdProofUpload({
  value = null,
  disabled = false,
  required = false,
  maxSizeMB = 5,
  onChange,
}: IdProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(value);

  const [error, setError] = useState<string | null>(null);

  function selectFile(file: File | null) {
    if (!file) return;

    setError(null);

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG, WEBP or PDF file."
      );
      return;
    }

    const maximumBytes =
      maxSizeMB * 1024 * 1024;

    if (file.size > maximumBytes) {
      setError(
        `File size must not exceed ${maxSizeMB} MB.`
      );
      return;
    }

    setSelectedFile(file);
    onChange?.(file);
  }

  function removeFile() {
    setSelectedFile(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onChange?.(null);
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          color: "#0b2859",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        ID Proof
        {required && " *"}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        disabled={disabled}
        required={required && !selectedFile}
        onChange={(event) =>
          selectFile(event.target.files?.[0] ?? null)
        }
        style={{
          display: "none",
        }}
      />

      {!selectedFile ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%",
            minHeight: "130px",
            padding: "20px",
            border: "1px dashed #b8c4d6",
            borderRadius: "12px",
            backgroundColor: "#fafbfc",
            cursor: disabled
              ? "not-allowed"
              : "pointer",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "block",
              color: "#0b2859",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            Choose ID proof
          </span>

          <span
            style={{
              display: "block",
              marginTop: "7px",
              color: "#60708c",
              fontSize: "13px",
            }}
          >
            JPG, PNG, WEBP or PDF • Maximum {maxSizeMB} MB
          </span>
        </button>
      ) : (
        <div
          style={{
            padding: "16px",
            border: "1px solid #d6deea",
            borderRadius: "12px",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                minWidth: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#0b2859",
                  fontSize: "14px",
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedFile.name}
              </p>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#60708c",
                  fontSize: "13px",
                }}
              >
                {formatSize(selectedFile.size)}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  inputRef.current?.click()
                }
                style={{
                  padding: "8px 12px",
                  border: "1px solid #0b2859",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#0b2859",
                  fontWeight: 600,
                  cursor: disabled
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Replace
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={removeFile}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #dc2626",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#b42318",
                  fontWeight: 600,
                  cursor: disabled
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          style={{
            margin: "8px 0 0",
            color: "#b42318",
            fontSize: "13px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}