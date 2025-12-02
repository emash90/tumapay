/**
 * Business Settings Component
 * Manages business verification and KYB documents
 */

import { Building2, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useBusinessDocumentSummary } from '@/hooks/useDocuments';
import { DocumentUpload, DocumentList } from '@/components/documents';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { BusinessVerificationStatus, BusinessType } from '@/api';

const VERIFICATION_STATUS_CONFIG: Record<
  BusinessVerificationStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    description: string;
  }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary',
    description: 'Upload required documents to start verification',
  },
  in_review: {
    label: 'In Review',
    icon: Clock,
    variant: 'outline',
    description: 'Your documents are being reviewed by our team',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle2,
    variant: 'default',
    description: 'Your business has been successfully verified',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'destructive',
    description: 'Verification rejected. Please review and resubmit documents',
  },
  suspended: {
    label: 'Suspended',
    icon: XCircle,
    variant: 'destructive',
    description: 'Your business has been suspended. Please contact support',
  },
};

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  sole_proprietor: 'Sole Proprietor',
  limited_company: 'Limited Company',
  partnership: 'Partnership',
};

function isValidBusinessType(type: string | undefined): type is BusinessType {
  return type === 'sole_proprietor' || type === 'limited_company' || type === 'partnership';
}

export function BusinessSettings() {
  const { business } = useAuthStore();

  if (!business) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Business Found</AlertTitle>
        <AlertDescription>
          You need to have a business associated with your account to access this section.
        </AlertDescription>
      </Alert>
    );
  }

  const { data: summary, isLoading } = useBusinessDocumentSummary(business.id);

  const statusConfig = VERIFICATION_STATUS_CONFIG[business.kybStatus] || VERIFICATION_STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const validBusinessType = isValidBusinessType(business.businessType) ? business.businessType : null;

  // Calculate verification progress
  const progress = summary
    ? summary.requiredDocuments > 0
      ? Math.round((summary.uploadedRequiredDocuments / summary.requiredDocuments) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business Verification</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your business documents and verification status
        </p>
      </div>

      {/* Business Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>{business.businessName}</CardTitle>
                <CardDescription>
                  {validBusinessType
                    ? BUSINESS_TYPE_LABELS[validBusinessType]
                    : 'Business Type Not Set'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={statusConfig.variant} className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{statusConfig.description}</p>

          {/* Verification Progress */}
          {!isLoading && summary && summary.requiredDocuments > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Verification Progress</span>
                <span className="text-gray-600">
                  {summary.uploadedRequiredDocuments} of {summary.requiredDocuments} required documents
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              {summary.allRequiredUploaded && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  All required documents uploaded
                </p>
              )}
            </div>
          )}

          {/* Document Summary Stats */}
          {!isLoading && summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalDocuments}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600">Approved</p>
                <p className="text-2xl font-bold text-green-900">{summary.approvedDocuments}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{summary.pendingDocuments}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{summary.rejectedDocuments}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload the required documents to verify your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validBusinessType ? (
            <DocumentUpload
              businessId={business.id}
              businessType={validBusinessType}
              onUploadSuccess={() => {
                // Success is already handled by React Query cache invalidation
              }}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please set your business type in the profile settings before uploading documents.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Uploaded Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>View and manage your uploaded documents</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList businessId={business.id} />
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Information</AlertTitle>
        <AlertDescription className="space-y-2">
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>All documents must be clear and legible</li>
            <li>Accepted formats: PDF, JPG, PNG (max 5MB per file)</li>
            <li>Documents marked with * are required for verification</li>
            <li>Verification typically takes 1-3 business days</li>
            <li>You will be notified via email once verification is complete</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
