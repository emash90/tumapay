import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChangePasswordForm, type ChangePasswordFormData } from '@/components/forms/ChangePasswordForm';
import { useChangePassword, useToggle2FA, useCurrentUser } from '@/hooks/useAuth';
import { getErrorMessage } from '@/api/errors';
import { Shield, Loader2, Mail } from 'lucide-react';

export function SecuritySettings() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [twoFASuccessMessage, setTwoFASuccessMessage] = useState<string | null>(null);
  const [twoFAErrorMessage, setTwoFAErrorMessage] = useState<string | null>(null);

  const { data: currentUserData } = useCurrentUser();
  const changePasswordMutation = useChangePassword();
  const toggle2FAMutation = useToggle2FA();

  const currentUser = currentUserData?.user;
  const isTwoFAEnabled = currentUser?.twoFactorEnabled || false;

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

  const handleToggle2FA = async () => {
    try {
      setTwoFASuccessMessage(null);
      setTwoFAErrorMessage(null);

      const response = await toggle2FAMutation.mutateAsync({
        enabled: !isTwoFAEnabled,
      });

      setTwoFASuccessMessage(response.message || `Two-factor authentication ${!isTwoFAEnabled ? 'enabled' : 'disabled'} successfully!`);
      setTwoFAErrorMessage(null);
    } catch (error) {
      const message = getErrorMessage(error);
      setTwoFAErrorMessage(message);
      setTwoFASuccessMessage(null);
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

      {/* Two-Factor Authentication Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Add an extra layer of security to your account. When enabled, you'll need to enter a verification code sent to your email each time you sign in.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isTwoFAEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {isTwoFAEnabled ? 'Enabled' : 'Disabled'}
              </div>
              {isTwoFAEnabled && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Mail className="h-3 w-3" />
                  <span>Email verification</span>
                </div>
              )}
            </div>

            {twoFASuccessMessage && (
              <Alert className="mb-4">
                <AlertDescription>{twoFASuccessMessage}</AlertDescription>
              </Alert>
            )}

            {twoFAErrorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{twoFAErrorMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleToggle2FA}
              disabled={toggle2FAMutation.isPending}
              variant={isTwoFAEnabled ? 'outline' : 'default'}
              className={isTwoFAEnabled ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}
            >
              {toggle2FAMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isTwoFAEnabled ? 'Disabling...' : 'Enabling...'}
                </>
              ) : (
                <>
                  {isTwoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Change Password Card */}
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
