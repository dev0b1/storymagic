'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
  maxSize?: number; // in MB
}

export function PDFUpload({ 
  onFileUpload, 
  isUploading = false, 
  uploadProgress = 0,
  className,
  maxSize = 10 
}: PDFUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only.');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize}MB.`);
      return;
    }

    try {
      await onFileUpload(file);
      setUploadSuccess(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    }
  }, [onFileUpload, maxSize]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const fileRejectionErrors = fileRejections.map(({ file, errors }) => 
    errors.map(e => `${file.name}: ${e.message}`)
  ).flat();

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "hover:border-blue-400 hover:bg-blue-50",
            isDragActive && "border-blue-500 bg-blue-50",
            isUploading && "border-gray-300 bg-gray-50 cursor-not-allowed",
            uploadError && "border-red-300 bg-red-50",
            uploadSuccess && "border-green-300 bg-green-50"
          )}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing PDF...
                </h3>
                <p className="text-gray-600 mb-4">
                  Extracting text and generating flashcards
                </p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-sm text-gray-500 mt-2">
                  {uploadProgress}% complete
                </p>
              </div>
            </div>
          ) : uploadSuccess ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Upload Successful!
                </h3>
                <p className="text-green-700">
                  Your PDF has been processed and flashcards are ready.
                </p>
              </div>
            </div>
          ) : uploadError ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Upload Failed
                </h3>
                <p className="text-red-700 mb-4">{uploadError}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setUploadError(null)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isDragActive ? 'Drop your PDF here' : 'Upload a PDF Document'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your PDF file here, or click to browse
                </p>
                <div className="text-sm text-gray-500">
                  <p>Supported format: PDF</p>
                  <p>Maximum size: {maxSize}MB</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* File Rejection Errors */}
        {fileRejectionErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Upload Error
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {fileRejectionErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
