'use client';

import { useState } from 'react';

const Privacy = () => {
    // Privacy settings state
    const [privacyData, setPrivacyData] = useState({
        profileVisibility: 'public',
        emailVisibility: false,
        activityTracking: true,
        dataCollection: false,
        notifications: true
    });

    const handlePrivacySave = () => {
        // Handle privacy save logic here
        console.log('Saving privacy:', privacyData);
        alert('Privacy settings saved!');
    };

    return (
        <div className="flex-1 p-8 bg-white dark:bg-zinc-900 transition-colors">
            <div className="max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white capitalize">
                        Privacy Settings
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Control your privacy and data sharing preferences
                    </p>
                </div>

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
            </div>
        </div>
    );
};

export default Privacy;