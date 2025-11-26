import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChangePasswordForm, type ChangePasswordFormData } from '@/components/forms/ChangePasswordForm';
import { useChangePassword } from '@/hooks/useAuth';
import { getErrorMessage } from '@/api/errors';

export function SecuritySettings() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changePasswordMutation = useChangePassword();

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      setSuccessMessage(null);
      setErrorMessage(null);

      const response = await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccessMessage(response.message || 'Password changed successfully!');
      setErrorMessage(null);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account security and password
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          <p className="mt-1 text-sm text-gray-600">
            Update your password to keep your account secure
          </p>
        </div>

        <ChangePasswordForm
          onSubmit={handleChangePassword}
          isLoading={changePasswordMutation.isPending}
          error={errorMessage}
          successMessage={successMessage}
        />
      </Card>
    </div>
  );
}
