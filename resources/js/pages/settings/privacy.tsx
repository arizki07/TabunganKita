import { Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import PrivacyTab from '@/components/privacy-tab';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Privacy settings',
        href: '/settings/privacy',
    },
];

export default function Privacy() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Privacy settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Privacy settings" description="Update your account's privacy settings" />
                    <PrivacyTab />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
