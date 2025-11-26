import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { Shield, User, Bell, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

// Placeholder components for other settings sections
function ProfileSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
      <p className="mt-1 text-sm text-gray-600">
        Manage your personal information and business details
      </p>
      <div className="mt-6 p-6 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Profile settings coming soon...</p>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
      <p className="mt-1 text-sm text-gray-600">
        Control how you receive notifications
      </p>
      <div className="mt-6 p-6 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Notification settings coming soon...</p>
      </div>
    </div>
  );
}

function PreferencesSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
      <p className="mt-1 text-sm text-gray-600">
        Customize your experience
      </p>
      <div className="mt-6 p-6 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Preference settings coming soon...</p>
      </div>
    </div>
  );
}

const settingsTabs: SettingsTab[] = [
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    component: SecuritySettings,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    component: ProfileSettings,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    component: NotificationSettings,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Globe,
    component: PreferencesSettings,
  },
];

export default function Settings() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab') || 'security';

  const [activeTab, setActiveTab] = useState(tabFromUrl);

  const ActiveComponent = settingsTabs.find((tab) => tab.id === activeTab)?.component || SecuritySettings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            <ul className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                        isActive
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', isActive ? 'text-purple-700' : 'text-gray-400')} />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
