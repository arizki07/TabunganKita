import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent, // Tambahkan import ini untuk merapatkan isi grup
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowLeftRight, BarChart3, Heart, LayoutGrid, Wallet } from 'lucide-react';
import AppLogo from './app-logo';

// Grup 1: Home
const homeNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
];

// Grup 2: Menu Utama Aplikasi
const menuNavItems: NavItem[] = [
    {
        title: 'Wallet',
        url: '/wallet',
        icon: Wallet,
    },
    {
        title: 'Wishlist',
        url: '/wishlist',
        icon: Heart,
    },
    {
        title: 'Transaction',
        url: '/transaction',
        icon: ArrowLeftRight,
    },
];

const rekapNavItems: NavItem[] = [
    {
        title: 'Rekap Laporan',
        url: '/report',
        icon: BarChart3,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* space-y-1 memastikan jarak vertikal antar komponen di dalamnya rapat */}
            <SidebarContent className="space-y-1 px-2 py-2">
                {/* Kategori: Home */}
                <SidebarGroup className="p-0">
                    {/* text-[10px] mengecilkan font, h-6 membatasi tinggi label agar tidak memakan ruang */}
                    <SidebarGroupLabel className="text-muted-foreground/60 h-6 px-2 text-[10px] font-bold tracking-wider uppercase">
                        Home
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <NavMain items={homeNavItems} />
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Kategori: Menu */}
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="text-muted-foreground/60 h-6 px-2 text-[10px] font-bold tracking-wider uppercase">
                        Menu
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <NavMain items={menuNavItems} />
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="text-muted-foreground/60 h-6 px-2 text-[10px] font-bold tracking-wider uppercase">
                        Report
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <NavMain items={rekapNavItems} />
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
