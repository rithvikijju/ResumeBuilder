import * as React from "react";
import { useDropzone } from "react-dropzone";
import { clsx } from "clsx";

type DropzoneProps = {
  onFiles: (files: File[]) => void;
  accept?: { [mime: string]: string[] };
  maxSize?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export function Dropzone({
  onFiles,
  accept,
  maxSize,
  label = "Drop files here or click to upload",
  description,
  disabled,
}: DropzoneProps) {
  const handleDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length) {
        onFiles(acceptedFiles);
      }
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    accept,
    maxSize,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center transition hover:border-slate-400 hover:bg-slate-50",
        isDragActive && "border-slate-500 bg-slate-100",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input {...getInputProps()} />
      <p className="text-sm font-medium text-slate-900">{label}</p>
      {description ? (
        <p className="mt-2 text-xs text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

