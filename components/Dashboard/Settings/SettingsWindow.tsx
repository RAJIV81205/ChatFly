'use client';

import { useState } from 'react';
import { SettingSection } from './SettingInterface';

interface SettingsWindowProps {
    activeSection: SettingSection;
}

const SettingsWindow = ({ activeSection }: SettingsWindowProps) => {
    // Profile settings state
    const [profileData, setProfileData] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        bio: 'Software developer passionate about creating amazing user experiences.',
        avatar: ''
    });

    // Privacy settings state
    const [privacyData, setPrivacyData] = useState({
        profileVisibility: 'public',
        emailVisibility: false,
        activityTracking: true,
        dataCollection: false,
        notifications: true
    });

    const handleProfileSave = () => {
        // Handle profile save logic here
        console.log('Saving profile:', profileData);
        alert('Profile settings saved!');
    };

    const handlePrivacySave = () => {
        // Handle privacy save logic here
        console.log('Saving privacy:', privacyData);
        alert('Privacy settings saved!');
    };

    const renderProfileSettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Bio
                    </label>
                    <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors resize-none"
                        placeholder="Tell us about yourself..."
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={handleProfileSave}
                    className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                >
                    Save Profile
                </button>
            </div>
        </div>
    );

    const renderPrivacySettings = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">Privacy Controls</h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Profile Visibility
                        </label>
                        <select
                            value={privacyData.profileVisibility}
                            onChange={(e) => setPrivacyData({...privacyData, profileVisibility: e.target.value})}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                        >
                            <option value="public">Public</option>
                            <option value="friends">Friends Only</option>
                            <option value="private">Private</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Show Email Address
                            </label>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Allow others to see your email address</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={privacyData.emailVisibility}
                            onChange={(e) => setPrivacyData({...privacyData, emailVisibility: e.target.checked})}
                            className="h-4 w-4 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-white border-zinc-300 dark:border-zinc-600 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Activity Tracking
                            </label>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Track your activity for analytics</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={privacyData.activityTracking}
                            onChange={(e) => setPrivacyData({...privacyData, activityTracking: e.target.checked})}
                            className="h-4 w-4 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-white border-zinc-300 dark:border-zinc-600 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Data Collection
                            </label>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Allow collection of usage data</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={privacyData.dataCollection}
                            onChange={(e) => setPrivacyData({...privacyData, dataCollection: e.target.checked})}
                            className="h-4 w-4 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-white border-zinc-300 dark:border-zinc-600 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Email Notifications
                            </label>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Receive email notifications</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={privacyData.notifications}
                            onChange={(e) => setPrivacyData({...privacyData, notifications: e.target.checked})}
                            className="h-4 w-4 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-white border-zinc-300 dark:border-zinc-600 rounded"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={handlePrivacySave}
                    className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors"
                >
                    Save Privacy Settings
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 p-8 bg-white dark:bg-zinc-900 transition-colors">
            <div className="max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white capitalize">
                        {activeSection} Settings
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        {activeSection === 'profile' 
                            ? 'Manage your personal information and profile details'
                            : 'Control your privacy and data sharing preferences'
                        }
                    </p>
                </div>

                {activeSection === 'profile' ? renderProfileSettings() : renderPrivacySettings()}
            </div>
        </div>
    );
};

export default SettingsWindow;