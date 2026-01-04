'use client';

import { User, Shield } from 'lucide-react';
import { SettingSection } from './SettingInterface';

interface SettingsListProps {
    activeSection: SettingSection;
    onSectionChange: (section: SettingSection) => void;
}

const settingsOptions = [
    {
        id: 'profile' as SettingSection,
        label: 'Profile',
        icon: User,
        description: 'Manage your personal information'
    },
    {
        id: 'privacy' as SettingSection,
        label: 'Privacy',
        icon: Shield,
        description: 'Control your privacy settings'
    }
];

const SettingsList = ({ activeSection, onSectionChange }: SettingsListProps) => {
    return (
        <div className="w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6 transition-colors">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Settings</h2>
            
            <div className="space-y-3">
                {settingsOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                        <button
                            key={option.id}
                            onClick={() => onSectionChange(option.id)}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                                activeSection === option.id
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <IconComponent className="h-5 w-5" />
                                <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className={`text-sm ${
                                        activeSection === option.id
                                            ? 'text-zinc-300 dark:text-zinc-600'
                                            : 'text-zinc-500 dark:text-zinc-400'
                                    }`}>
                                        {option.description}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SettingsList;