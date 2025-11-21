import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useBeneficiaries,
  useDeleteBeneficiary,
  useActivateBeneficiary,
  useDeactivateBeneficiary,
} from '@/hooks/useBeneficiaries';
import { BeneficiaryCard, BeneficiaryModal } from '@/components/beneficiaries';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, AlertCircle, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Beneficiary } from '@/api/types';

export default function Beneficiaries() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: beneficiaries, isLoading, error } = useBeneficiaries();
  const deleteBeneficiary = useDeleteBeneficiary();
  const activateBeneficiary = useActivateBeneficiary();
  const deactivateBeneficiary = useDeactivateBeneficiary();

  const [showModal, setShowModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Beneficiary | null>(null);

  // Check if we're on /beneficiaries/new route
  const isNewRoute = location.pathname === '/beneficiaries/new';

  // Handle new route - auto-open modal
  useEffect(() => {
    if (isNewRoute) {
      setShowModal(true);
      setSelectedBeneficiary(null);
    }
  }, [isNewRoute]);

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedBeneficiary(null);
    if (isNewRoute) {
      navigate('/beneficiaries');
    }
  };

  const handleEdit = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowModal(true);
  };

  const handleDelete = async (beneficiary: Beneficiary) => {
    setDeleteConfirm(beneficiary);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBeneficiary.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleToggleStatus = async (beneficiary: Beneficiary) => {
    try {
      if (beneficiary.isActive) {
        await deactivateBeneficiary.mutateAsync(beneficiary.id);
      } else {
        await activateBeneficiary.mutateAsync(beneficiary.id);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSendMoney = (beneficiary: Beneficiary) => {
    // Navigate to transfers with beneficiary pre-selected
    navigate('/transfers/new', { state: { beneficiaryId: beneficiary.id } });
  };

  // Filter beneficiaries by search term
  const filteredBeneficiaries = beneficiaries?.filter((b: Beneficiary) => {
    const search = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(search) ||
      b.iban.toLowerCase().includes(search) ||
      b.ibanFormatted.toLowerCase().includes(search) ||
      b.bankName?.toLowerCase().includes(search) ||
      b.email?.toLowerCase().includes(search)
    );
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load beneficiaries</h2>
        <p className="text-gray-500">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficiaries</h1>
          <p className="text-gray-500 mt-1">
            Manage your Turkish recipients for money transfers
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Beneficiary
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, IBAN, bank, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Beneficiaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : filteredBeneficiaries && filteredBeneficiaries.length > 0 ? (
          filteredBeneficiaries.map((beneficiary: Beneficiary) => (
            <BeneficiaryCard
              key={beneficiary.id}
              beneficiary={beneficiary}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onSendMoney={handleSendMoney}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No beneficiaries found' : 'No beneficiaries yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Add your first Turkish beneficiary to start sending money'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Beneficiary
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Beneficiary
            </h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action
              cannot be undone.
            </p>
            {deleteBeneficiary.isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {(deleteBeneficiary.error as any)?.response?.data?.message ||
                    'Failed to delete beneficiary'}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                isLoading={deleteBeneficiary.isPending}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <BeneficiaryModal
        isOpen={showModal}
        onClose={handleModalClose}
        beneficiary={selectedBeneficiary}
        onSuccess={() => {
          // Modal handles closing
        }}
      />
    </div>
  );
}
