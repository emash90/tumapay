import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, business, signOut, isLoading } = useAuthStore();

  const handleSignOut = async () => {
    // Sign out clears tokens immediately
    await signOut();
    // Redirect to login
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-700">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-2 text-xl text-gray-100">
              {business?.name || 'Your Business'}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} isLoading={isLoading}>
            Sign Out
          </Button>
        </div>

        {/* Demo Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6">
            <h2 className="text-2xl font-semibold text-white">Multi-Currency Wallet</h2>
            <p className="text-gray-100 mt-2">Manage your international payments</p>
          </div>

          <div className="p-8">
            {/* Balance Display */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl border border-primary-200">
                <p className="text-sm text-gray-600 mb-2">KES Balance</p>
                <p className="text-3xl font-bold text-primary-700">
                  {formatCurrency(125000.50, 'KES')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 rounded-xl border border-secondary-200">
                <p className="text-sm text-gray-600 mb-2">USDT Balance</p>
                <p className="text-3xl font-bold text-secondary-700">
                  {formatCurrency(850.25, 'USD')} USDT
                </p>
              </div>
              <div className="bg-gradient-to-br from-accent-50 to-accent-100 p-6 rounded-xl border border-accent-200">
                <p className="text-sm text-gray-600 mb-2">TRY Balance</p>
                <p className="text-3xl font-bold text-accent-600">
                  {formatCurrency(5420.75, 'TRY')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button className="flex-1 min-w-[150px] bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Deposit
              </button>
              <button className="flex-1 min-w-[150px] bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Transfer
              </button>
              <button className="flex-1 min-w-[150px] bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Withdraw
              </button>
            </div>

            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your profile and business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{user?.firstName} {user?.lastName}</span>
                </div>
                {user?.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Email Verified:</span>
                  <span className={user?.isEmailVerified ? 'text-green-600' : 'text-red-600'}>
                    {user?.isEmailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                {business && (
                  <>
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">Business Details</h4>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Business Name:</span>
                      <span>{business.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Business Type:</span>
                      <span>{business.businessType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Country:</span>
                      <span>{business.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Verification Status:</span>
                      <span className={business.isVerified ? 'text-green-600' : 'text-yellow-600'}>
                        {business.verificationStatus}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
