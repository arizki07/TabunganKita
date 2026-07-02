import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BarChart3, Calendar, Layers, PieChart as PieIcon, RefreshCw, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';

// Import Shadcn UI Components
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Transaction', href: '/transaction' },
    { title: 'Rekap Laporan', href: '/report' },
];

interface Transaction {
    id: number;
    title: string;
    type: 'income' | 'expense';
    amount: number | string;
    category: string;
    transaction_date: string;
    payment_method: string;
    wallet?: { wallet_name: string } | null;
    wishlist?: { item_name: string } | null;
}

interface CategorySummary {
    category: string;
    total: number;
}

interface ReportData {
    range: string;
    label: string;
    total_income: number;
    total_expense: number;
    net_savings: number;
}

interface Props {
    report: ReportData;
    categorySummary: CategorySummary[];
    transactions: Transaction[];
}

export default function ReportView({ report, categorySummary = [], transactions = [] }: Props) {
    // State baru untuk mengecek apakah user sudah memilih filter atau belum
    const [hasSelected, setHasSelected] = useState<boolean>(false);
    const [currentRange, setCurrentRange] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const formatRupiah = (angka: number | string) => {
        const value = typeof angka === 'string' ? parseFloat(angka) : angka;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
    };

    const handleRangeChange = (rangeValue: string) => {
        setCurrentRange(rangeValue);
        setIsLoading(true);
        setHasSelected(true); // Tandai bahwa user sudah mulai memfilter data

        router.get(
            route('transaction.report'),
            { range: rangeValue },
            {
                preserveState: true,
                onFinish: () => {
                    setTimeout(() => setIsLoading(false), 500);
                },
            },
        );
    };

    const ranges = [
        { value: '1_week', label: '7 Hari Ini' },
        { value: '1_month', label: 'Bulan Ini' },
        { value: '6_months', label: '6 Bulan' },
        { value: '1_year', label: '1 Tahun' },
    ];

    // Kondisi pembantu: Tampilkan skeleton jika sedang loading ATAU jika user belum memilih filter apa pun
    const showSkeleton = isLoading || !hasSelected;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekap Keuangan Eksekutif" />

            <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
                {/* Header Premium */}
                <div className="border-muted/60 flex flex-col gap-6 border-b pb-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-tr from-indigo-500/20 to-purple-500/10 text-indigo-500 shadow-md">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-foreground text-2xl font-extrabold tracking-tight">Laporan Ringkasan Finansial</h2>
                            <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                                Silakan pilih rentang periode waktu di sebelah kanan untuk memuat laporan keuangan.
                            </p>
                        </div>
                    </div>

                    {/* Filter Periode Pills */}
                    <div className="bg-muted/60 border-muted inline-flex h-10 items-center gap-1 self-start rounded-xl border p-1 backdrop-blur-sm md:self-auto">
                        {ranges.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => handleRangeChange(r.value)}
                                disabled={isLoading}
                                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                    currentRange === r.value
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid 3 Kartu Keuangan Utama */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Kartu 1: Pemasukan */}
                    <Card className="border-muted/80 relative overflow-hidden border shadow-sm">
                        <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500/70" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <span className="text-muted-foreground/80 text-xs font-bold tracking-wider uppercase">Total Pemasukan</span>
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-500">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showSkeleton ? (
                                <Skeleton className="h-8 w-[160px] animate-pulse rounded-md" />
                            ) : (
                                <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                                    {formatRupiah(report.total_income)}
                                </div>
                            )}
                            <div className="text-muted-foreground mt-1.5 text-[11px]">
                                {showSkeleton ? <Skeleton className="h-3 w-[200px]" /> : `Total dana masuk periode ${report.label}`}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kartu 2: Pengeluaran */}
                    <Card className="border-muted/80 relative overflow-hidden border shadow-sm">
                        <div className="absolute top-0 left-0 h-full w-1 bg-red-500/70" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <span className="text-muted-foreground/80 text-xs font-bold tracking-wider uppercase">Total Dana Keluar</span>
                            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-500">
                                <RefreshCw className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showSkeleton ? (
                                <Skeleton className="h-8 w-[160px] animate-pulse rounded-md" />
                            ) : (
                                <div className="text-2xl font-black tracking-tight text-red-600 dark:text-red-400">
                                    {formatRupiah(report.total_expense)}
                                </div>
                            )}
                            <div className="text-muted-foreground mt-1.5 text-[11px]">
                                {showSkeleton ? <Skeleton className="h-3 w-[200px]" /> : `Total konsumsi belanja & kewajiban`}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kartu 3: Tabungan Bersih */}
                    <Card className="border-muted/80 relative overflow-hidden border shadow-sm">
                        <div className="absolute top-0 left-0 h-full w-1 bg-indigo-500/70" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <span className="text-muted-foreground/80 text-xs font-bold tracking-wider uppercase">Tabungan Bersih</span>
                            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-500">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {showSkeleton ? (
                                <Skeleton className="h-8 w-[160px] animate-pulse rounded-md" />
                            ) : (
                                <div
                                    className={`text-2xl font-black tracking-tight ${report.net_savings >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-500'}`}
                                >
                                    {formatRupiah(report.net_savings)}
                                </div>
                            )}
                            <div className="text-muted-foreground mt-1.5 text-[11px]">
                                {showSkeleton ? <Skeleton className="h-3 w-[200px]" /> : `Sisa bersih kas tabungan Anda`}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Struktur Layout Laporan Utama Bawah */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Panel Kiri: Distribusi Per Kategori */}
                    <Card className="border-muted/60 h-fit border shadow-md lg:col-span-1">
                        <CardHeader className="border-muted/40 flex flex-row items-center gap-2 border-b pb-4">
                            <PieIcon className="h-4 w-4 text-indigo-500" />
                            <div>
                                <CardTitle className="text-sm font-bold">Porsi Pengeluaran Kategori</CardTitle>
                                <CardDescription className="text-[10px]">Analisis pos konsumsi terbesar Anda.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-5">
                            {showSkeleton ? (
                                // Tampilkan Loading Shimmer bawaan jika belum memilih/proses memuat
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-[110px]" />
                                            <Skeleton className="h-4 w-[50px]" />
                                        </div>
                                        <Skeleton className="h-2 w-full rounded-full" />
                                    </div>
                                ))
                            ) : categorySummary.length === 0 ? (
                                <div className="text-muted-foreground/70 py-8 text-center text-xs font-medium">
                                    Tidak ada catatan pengeluaran kategori.
                                </div>
                            ) : (
                                categorySummary.map((item) => {
                                    const percent = report.total_expense > 0 ? Math.round((item.total / report.total_expense) * 100) : 0;
                                    return (
                                        <div key={item.category} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-foreground/80 max-w-[150px] truncate">{item.category}</span>
                                                <span className="text-muted-foreground/90 font-mono">
                                                    {formatRupiah(item.total)} ({percent}%)
                                                </span>
                                            </div>
                                            <div className="bg-muted/70 border-muted/20 h-2 w-full overflow-hidden rounded-full border">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Panel Kanan: Tabel Aliran Mutasi Keuangan */}
                    <Card className="border-muted/60 border shadow-md lg:col-span-2">
                        <CardHeader className="border-muted/40 flex flex-row items-center gap-2 border-b pb-4">
                            <Layers className="h-4 w-4 text-indigo-500" />
                            <div>
                                <CardTitle className="text-sm font-bold">Log Rincian Aliran Mutasi</CardTitle>
                                <CardDescription className="text-[10px]">
                                    Buku catatan jurnal transaksi selama jangka rentang waktu terpilih.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="border-muted/80 bg-background/50 w-full overflow-x-auto rounded-xl border">
                                <Table className="text-muted-foreground w-full min-w-[700px] table-auto border-separate text-left text-xs">
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="text-foreground/80 border-b px-4 py-3 font-bold">Tanggal</TableHead>
                                            <TableHead className="text-foreground/80 border-b px-4 py-3 font-bold">Rincian Transaksi</TableHead>
                                            <TableHead className="text-foreground/80 border-b px-4 py-3 font-bold">Kategori</TableHead>
                                            <TableHead className="text-foreground/80 border-b px-4 py-3 font-bold">Wadah Kas</TableHead>
                                            <TableHead className="text-foreground/80 border-b px-4 py-3 pr-6 text-right font-bold">Nominal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="text-foreground/90 font-medium">
                                        {showSkeleton ? (
                                            // Tampilkan full row skeleton jika belum ada interaksi filter
                                            Array.from({ length: 5 }).map((_, index) => (
                                                <TableRow key={index} className="border-muted/30 border-b">
                                                    <TableCell className="px-4 py-4">
                                                        <Skeleton className="h-4 w-[75px]" />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Skeleton className="h-4 w-[180px]" />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Skeleton className="h-4 w-[60px] rounded-full" />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4">
                                                        <Skeleton className="h-4 w-[80px]" />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-4 pr-6 text-right">
                                                        <Skeleton className="ml-auto h-4 w-[90px]" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-muted-foreground/60 py-12 text-center text-xs font-semibold">
                                                    Tidak ditemukan riwayat mutasi dana pada periode ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((tx) => (
                                                <TableRow
                                                    key={tx.id}
                                                    className="hover:bg-muted/40 border-muted/30 border-b transition-colors last:border-0"
                                                >
                                                    <TableCell className="text-muted-foreground px-4 py-3 font-mono text-[11px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="text-muted-foreground/60 h-3.5 w-3.5" />
                                                            {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-sm font-semibold">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="max-w-[200px] truncate">{tx.title}</span>
                                                            {tx.wishlist && (
                                                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-500">
                                                                    🎯 Target: {tx.wishlist.item_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-muted text-muted-foreground/90 px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase"
                                                        >
                                                            {tx.category}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground/80 px-4 py-3 text-xs font-semibold">
                                                        <span className="bg-background border-muted inline-flex items-center gap-1 rounded border px-2 py-0.5">
                                                            {tx.wallet ? tx.wallet.wallet_name : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 pr-6 text-right text-sm font-bold">
                                                        <span
                                                            className={
                                                                tx.type === 'income'
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : 'text-red-600 dark:text-red-400'
                                                            }
                                                        >
                                                            {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
