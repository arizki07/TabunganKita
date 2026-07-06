import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Wallet } from 'lucide-react';

// Import Shadcn UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Import Recharts untuk Grafik Komponen
import { messaging } from '@/firebase';
import axios from 'axios';
import { getToken, onMessage } from 'firebase/messaging';
import { useEffect } from 'react';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface Wishlist {
    id: number;
    item_name: string;
    price: number | string;
    current_amount: number | string;
}

interface Transaction {
    id: number;
    title: string;
    type: 'income' | 'expense';
    amount: number | string;
    category: string;
    transaction_date: string;
    wishlist?: { item_name: string } | null;
}

interface DashboardProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            is_notification_enabled: boolean; // Field toggle preferensi user
        };
    };
    stats: {
        current_balance: number;
        total_income: number;
        total_expense: number;
    };
    recentTransactions: Transaction[];
    urgentWishlists: Wishlist[];
    monthlyTrends?: { month: string; income: number; expense: number }[];
    categoryData?: { name: string; value: number }[];
}

export default function Dashboard({
    stats,
    recentTransactions = [],
    urgentWishlists = [],
    monthlyTrends = [
        { month: 'Jan', income: 2500000, expense: 1800000 },
        { month: 'Feb', income: 3000000, expense: 2100000 },
        { month: 'Mar', income: 2200000, expense: 1900000 },
        { month: 'Apr', income: 4500000, expense: 2800000 },
        { month: 'Mei', income: 3500000, expense: 3000000 },
        { month: 'Jun', income: stats?.total_income ?? 0, expense: stats?.total_expense ?? 0 },
    ],
    categoryData = [
        { name: 'Makanan & Minuman', value: 400000 },
        { name: 'Belanja Wishlist', value: 600000 },
        { name: 'Transportasi', value: 200000 },
        { name: 'Tagihan', value: 350000 },
    ],
}: DashboardProps) {
    const formatRupiah = (angka: number | string) => {
        const value = typeof angka === 'string' ? parseFloat(angka) : angka;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
    };

    const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    // 1. Fungsi untuk mendaftarkan Token FCM ke Backend
    const registerFirebaseToken = (registration: ServiceWorkerRegistration) => {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                getToken(messaging, {
                    vapidKey: vapidKey,
                    serviceWorkerRegistration: registration,
                })
                    .then((currentToken) => {
                        if (currentToken) {
                            axios
                                .post('/update-fcm-token', { token: currentToken })
                                .then((res) => console.log('Token terupdate:', res.data.message))
                                .catch((err) => console.error('Gagal update token:', err));
                        }
                    })
                    .catch((err) => console.error('Error getting token:', err));
            }
        });
    };

    // 2. Efek untuk registrasi Service Worker dan listener Foreground
    useEffect(() => {
        // Daftar Service Worker
        if (isNotifEnabled && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/firebase-messaging-sw.js')
                .then((registration) => {
                    registerFirebaseToken(registration);
                })
                .catch((err) => console.error('SW Registration Failed:', err));
        }

        // Listener saat aplikasi terbuka (Foreground)
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground notification:', payload);
            if (Notification.permission === 'granted') {
                new Notification(payload.notification?.title || 'Notifikasi', {
                    body: payload.notification?.body,
                    icon: '/assets/logo.png',
                });
            }
        });

        return () => unsubscribe();
    }, [isNotifEnabled]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Analytics" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Bagian Selamat Datang / Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-br from-amber-500/20 to-indigo-500/10 text-amber-500 shadow-sm dark:from-amber-500/10 dark:to-indigo-500/5">
                            <span className="animate-pulse text-xl">✨</span>
                        </div>
                        <div>
                            <h2 className="text-foreground text-2xl font-bold tracking-tight">Ringkasan Tabungan Kita</h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Selamat datang kembali! Berikut adalah gambaran performa finansial dan perkembangan target impian Anda bulan ini.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grid Atas: 3 Kartu Utama Keuangan */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Kartu 1: Total Saldo */}
                    <Card className="from-background to-muted/40 overflow-hidden border bg-gradient-to-br shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">Total Saldo Tersedia</CardTitle>
                            <div className="rounded-md bg-amber-500/10 p-2 text-amber-500">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-foreground text-2xl font-bold tracking-tight">{formatRupiah(stats?.current_balance ?? 0)}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Akumulasi bersih kas dompet Anda</p>
                        </CardContent>
                    </Card>

                    {/* Kartu 2: Total Pemasukan */}
                    <Card className="overflow-hidden border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">Total Dana Masuk</CardTitle>
                            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
                                <ArrowUpRight className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {formatRupiah(stats?.total_income ?? 0)}
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">Seluruh dana tabungan masuk</p>
                        </CardContent>
                    </Card>

                    {/* Kartu 3: Total Pengeluaran */}
                    <Card className="overflow-hidden border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">Total Dana Keluar</CardTitle>
                            <div className="rounded-md bg-red-500/10 p-2 text-red-500">
                                <ArrowDownLeft className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                                {formatRupiah(stats?.total_expense ?? 0)}
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">Pengeluaran & konsumsi barang</p>
                        </CardContent>
                    </Card>
                </div>

                {/* SECTION GRAPH / CHARTS */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Grafik 1: Tren Arus Kas */}
                    <Card className="shadow-sm md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Analisis Arus Kas Bulanan</CardTitle>
                            <CardDescription>Perbandingan tren performa pemasukan dan pengeluaran dana tabungan Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp${v / 1000}k`} />
                                    <Tooltip
                                        formatter={(value: any) => [formatRupiah(value)]}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '6px',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        name="Pemasukan"
                                        stroke="#10b981"
                                        fillOpacity={0.1}
                                        fill="url(#colorIncome)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Pengeluaran"
                                        stroke="#ef4444"
                                        fillOpacity={0.1}
                                        fill="url(#colorExpense)"
                                        strokeWidth={2}
                                    />
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Grafik 2: Distribusi Kategori Pengeluaran */}
                    <Card className="shadow-sm md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Kategori Pengeluaran</CardTitle>
                            <CardDescription>Porsi alokasi dana keluar Anda berdasarkan kategori.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center pb-4">
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => [formatRupiah(value)]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                {categoryData.map((entry, index) => (
                                    <div key={entry.name} className="flex min-w-0 items-center gap-1.5">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-muted-foreground truncate">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Grid Bawah: Riwayat Transaksi & Target Wishlist */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Panel Kiri: 5 Transaksi Terbaru */}
                    <Card className="shadow-sm md:col-span-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Aktivitas Arus Kas Terbaru</CardTitle>
                                <CardDescription>Daftar 5 rekaman mutasi kas terakhir Anda.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-indigo-500">
                                <Link href="/transaction">
                                    Lihat Semua <ArrowRight className="h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentTransactions.length === 0 ? (
                                <div className="text-muted-foreground py-8 text-center text-sm">
                                    Belum ada catatan mutasi transaksi masuk atau keluar.
                                </div>
                            ) : (
                                <div className="bg-card divide-y rounded-md border px-4">
                                    {recentTransactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between py-3">
                                            <div className="flex min-w-0 flex-col gap-1 pr-2">
                                                <span className="text-foreground truncate text-sm font-semibold">{tx.title}</span>
                                                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                    <Badge variant="outline" className="bg-muted/30 px-1.5 py-0 text-[10px]">
                                                        {tx.category}
                                                    </Badge>
                                                    {tx.wishlist && (
                                                        <span className="max-w-[120px] truncate font-medium text-indigo-500">
                                                            🎯 {tx.wishlist.item_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end text-right">
                                                <span
                                                    className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                                                >
                                                    {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                                                </span>
                                                <span className="text-muted-foreground mt-0.5 text-[10px]">
                                                    {new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Panel Kanan: Target Wishlist Teratas */}
                    <Card className="shadow-sm md:col-span-3">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Pantauan Wishlist</CardTitle>
                                <CardDescription>Target belanja barang impian teratas.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-indigo-500">
                                <Link href="/wishlist">
                                    Kelola <ArrowRight className="h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {urgentWishlists.length === 0 ? (
                                <div className="text-muted-foreground py-8 text-center text-sm">
                                    Belum ada barang impian terdaftar di wishlist Anda.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {urgentWishlists.map((wl) => {
                                        const current =
                                            typeof wl.current_amount === 'string' ? parseFloat(wl.current_amount) : (wl.current_amount ?? 0);
                                        const target = typeof wl.price === 'string' ? parseFloat(wl.price) : wl.price;
                                        const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

                                        return (
                                            <div key={wl.id} className="bg-muted/20 space-y-2 rounded-lg border p-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-foreground max-w-[160px] truncate font-semibold">{wl.item_name}</span>
                                                    <span className="text-xs font-bold text-amber-500">{percentage}%</span>
                                                </div>
                                                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <div className="text-muted-foreground flex justify-between text-[11px]">
                                                    <span>Tercicil: {formatRupiah(current)}</span>
                                                    <span>Harga: {formatRupiah(target)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
