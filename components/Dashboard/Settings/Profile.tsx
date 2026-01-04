'use client';

import { useState } from 'react';

const Profile = () => {
    // Profile settings state
    const [profileData, setProfileData] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        bio: 'Software developer passionate about creating amazing user experiences.',
        avatar: ''
    });

    const handleProfileSave = () => {
        // Handle profile save logic here
        console.log('Saving profile:', profileData);
        alert('Profile settings saved!');
    };

    return (
        <div className="flex-1 p-8 bg-white dark:bg-zinc-900 transition-colors">
            <div className="max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white capitalize">
                        Profile Settings
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Manage your personal information and profile details
                    </p>
                </div>

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
            </div>
        </div>
    );
};

export default Profile;