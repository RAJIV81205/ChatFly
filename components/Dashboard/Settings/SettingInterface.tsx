'use client';

import { useState } from 'react';
import SettingsList from './SettingsList';
import Profile from './Profile';
import Privacy from './Privacy';

export type SettingSection = 'profile' | 'privacy';

const SettingInterface = () => {
    const [activeSection, setActiveSection] = useState<SettingSection>('profile');

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'profile':
                return <Profile />;
            case 'privacy':
                return <Privacy />;
            default:
                return <Profile />;
        }
    };

    return (
        <div className="flex h-full bg-zinc-50 dark:bg-zinc-950 transition-colors">
            <SettingsList 
                activeSection={activeSection} 
                onSectionChange={setActiveSection} 
            />
            {renderActiveSection()}
        </div>
    );
}

export default SettingInterface;