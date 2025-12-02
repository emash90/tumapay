/**
 * Document List Component
 * Displays uploaded documents with actions
 */

import { useState } from 'react';
import { FileText, Download, Trash2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBusinessDocuments, useDeleteDocument, useReplaceDocument } from '@/hooks/useDocuments';
import { DOCUMENT_LABELS, formatFileSize } from '@/lib/documentRequirements';
import type { Document, DocumentStatus } from '@/api';

interface DocumentListProps {
  businessId: string;
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending Review', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'outline' },
};

export function DocumentList({ businessId }: DocumentListProps) {
  const { data: documents, isLoading, error } = useBusinessDocuments(businessId);
  const deleteMutation = useDeleteDocument();
  const replaceMutation = useReplaceDocument();

  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [documentToReplace, setDocumentToReplace] = useState<Document | null>(null);

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteMutation.mutateAsync(documentToDelete.id);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleReplaceFile = async (file: File) => {
    if (!documentToReplace) return;

    try {
      await replaceMutation.mutateAsync({
        documentId: documentToReplace.id,
        file,
      });
      setDocumentToReplace(null);
    } catch (error) {
      console.error('Replace error:', error);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && documentToReplace) {
      handleReplaceFile(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load documents. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload documents for verification to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Type</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  {DOCUMENT_LABELS[doc.documentType] || doc.documentType}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{doc.fileName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_CONFIG[doc.status].variant}>
                    {STATUS_CONFIG[doc.status].label}
                  </Badge>
                  {doc.status === 'rejected' && doc.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">{doc.rejectionReason}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatFileSize(doc.fileSize)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      title="View document"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = window.document.createElement('a');
                        link.href = doc.fileUrl;
                        link.download = doc.fileName;
                        link.click();
                      }}
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {(doc.status === 'rejected' || doc.status === 'expired') && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocumentToReplace(doc)}
                          disabled={replaceMutation.isPending}
                          title="Replace document"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileInputChange}
                          className="hidden"
                          id={`replace-${doc.id}`}
                        />
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDocumentToDelete(doc)}
                      disabled={deleteMutation.isPending}
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replace Document Trigger */}
      {documentToReplace && (
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          onClick={(e) => {
            // Reset value to allow selecting the same file again
            (e.target as HTMLInputElement).value = '';
          }}
          className="hidden"
          id="replace-file-input"
          ref={(input) => input?.click()}
        />
      )}
    </>
  );
}
