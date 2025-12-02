/**
 * Document Upload Component
 * Handles document upload for KYB verification
 */

import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUploadDocument } from '@/hooks/useDocuments';
import { getRequiredDocuments, validateFile, formatFileSize } from '@/lib/documentRequirements';
import type { BusinessType, DocumentType } from '@/api';

interface DocumentUploadProps {
  businessId: string;
  businessType: BusinessType;
  onUploadSuccess?: () => void;
}

export function DocumentUpload({ businessId, businessType, onUploadSuccess }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | ''>('');
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadDocument();

  const requirements = getRequiredDocuments(businessType);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    setValidationError('');
    const validation = validateFile(file);

    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocumentType) {
      setValidationError('Please select both a file and document type');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        businessId,
        file: selectedFile,
        documentType: selectedDocumentType as DocumentType,
      });

      // Reset form
      setSelectedFile(null);
      setSelectedDocumentType('');
      setValidationError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
      console.error('Upload error:', error);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type</Label>
        <Select
          value={selectedDocumentType}
          onValueChange={(value) => setSelectedDocumentType(value as DocumentType)}
        >
          <SelectTrigger id="documentType">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {requirements.map((req) => (
              <SelectItem key={req.type} value={req.type}>
                {req.label} {req.required && <span className="text-red-500">*</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedDocumentType && (
          <p className="text-sm text-muted-foreground">
            {requirements.find((r) => r.type === selectedDocumentType)?.description}
          </p>
        )}
      </div>

      {/* File Upload Area */}
      <div className="space-y-2">
        <Label>Upload Document</Label>
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
            ${selectedFile ? 'bg-gray-50' : 'hover:border-gray-400'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                <p className="mt-2 text-sm text-gray-600">or drag and drop</p>
              </div>
              <p className="mt-2 text-xs text-gray-500">PDF, JPG, or PNG (max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={uploadMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Upload Error */}
      {uploadMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadMutation.error instanceof Error
              ? uploadMutation.error.message
              : 'Failed to upload document. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Success */}
      {uploadMutation.isSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>Document uploaded successfully!</AlertDescription>
        </Alert>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || !selectedDocumentType || uploadMutation.isPending}
        className="w-full"
      >
        {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
      </Button>

      {/* Required Documents Info */}
      <div className="rounded-md bg-blue-50 p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Required Documents</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {requirements
            .filter((req) => req.required)
            .map((req) => (
              <li key={req.type} className="flex items-center">
                <span className="text-red-500 mr-2">*</span>
                {req.label}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
