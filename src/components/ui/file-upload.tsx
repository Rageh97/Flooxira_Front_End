"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileUploadProps {
  onFileSelect?: (file: File) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, onFileSelect, accept, maxSize = 5, disabled, ...props }, ref) => {
    const [dragActive, setDragActive] = React.useState(false)
    const [error, setError] = React.useState<string>("")

    const handleFile = (file: File) => {
      setError("")
      
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File size must be less than ${maxSize}MB`)
        return
      }

      onFileSelect?.(file)
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files[0]) {
        handleFile(files[0])
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault()
      if (disabled) return

      const files = e.target.files
      if (files && files[0]) {
        handleFile(files[0])
      }
    }

    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400",
            disabled && "cursor-not-allowed opacity-50",
            error && "border-red-500"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && document.getElementById("file-upload")?.click()}
        >
          <input
            ref={ref}
            id="file-upload"
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
            {...props}
          />
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {dragActive ? "Drop the file here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-gray-500">
            {accept ? `Accepted formats: ${accept}` : "Any file type"} (max {maxSize}MB)
          </p>
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"

export { FileUpload }









