'use client';

import { useState } from 'react';
import SettingsList from './SettingsList';
import SettingsWindow from './SettingsWindow';

export type SettingSection = 'profile' | 'privacy';

const SettingInterface = () => {
    const [activeSection, setActiveSection] = useState<SettingSection>('profile');

    return (
        <div className="flex h-full bg-zinc-50 dark:bg-zinc-950 transition-colors">
            <SettingsList 
                activeSection={activeSection} 
                onSectionChange={setActiveSection} 
            />
            <SettingsWindow activeSection={activeSection} />
        </div>
    );
}

export default SettingInterface;