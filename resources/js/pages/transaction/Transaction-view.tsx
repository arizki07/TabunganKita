import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Image as ImageIcon,
    LoaderCircle,
    MoreVertical,
    Plus,
    RefreshCw,
    Trash2,
    TrendingDown,
    TrendingUp,
    User,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';

// Import Shadcn UI Components
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaction',
        href: '/transaction',
    },
];

interface WishlistOption {
    id: number;
    item_name: string;
}

interface WalletOption {
    id: number;
    wallet_name: string;
    balance: number | string;
}

interface UserInfo {
    id: number;
    name: string;
}

interface TransactionItem {
    id: number;
    user_id: number;
    wallet_id: number;
    wishlist_id: number | null;
    title: string;
    type: 'income' | 'expense';
    category: string;
    amount: number | string;
    transaction_date: string;
    description: string | null;
    payment_method: string;
    attachment: string | null;
    created_at: string;
    wishlist?: WishlistOption | null;
    user?: UserInfo | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationData {
    data: TransactionItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface Props {
    transactions: PaginationData;
    wishlists: WishlistOption[];
    wallets: WalletOption[]; // Menampung data Kantong/Dompet dari backend
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function TransactionView({ transactions, wishlists = [], wallets = [], flash = {} }: Props) {
    const { data: rawItems = [], current_page, last_page, total, from, to, links = [] } = transactions || {};

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<TransactionItem | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [isTableLoading, setIsTableLoading] = useState(false);
    const [sortBy, setSortBy] = useState<string>('latest');
    const [filterType, setFilterType] = useState<string>('all');
    const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        wallet_id: 'none', // State awal untuk menampung dompet pilihan
        wishlist_id: 'none',
        title: '',
        type: 'expense' as 'income' | 'expense',
        category: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        payment_method: 'none',
        attachment: null as File | null,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setData('attachment', file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setLocalImagePreview(null);
        }
    };

    const removeSelectedImage = () => {
        setData('attachment', null);
        setLocalImagePreview(null);
        const fileInput = document.getElementById('attachment') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (data.wallet_id === 'none') {
            toast.error('Silakan pilih Dompet / Kantong terlebih dahulu.');
            return;
        }

        const finalWishlistId = data.wishlist_id === 'none' ? null : data.wishlist_id;
        const finalPaymentMethod = data.payment_method === 'none' ? 'Cash' : data.payment_method;

        data.wishlist_id = finalWishlistId as any;
        data.payment_method = finalPaymentMethod;

        if (editItem) {
            post(route('transactions.update', editItem.id), {
                forceFormData: true,
                queryParams: { _method: 'PUT' },
                onSuccess: () => closeModal(),
                onError: () => toast.error('Gagal memperbarui data transaksi.'),
            });
        } else {
            post(route('transactions.store'), {
                forceFormData: true,
                onSuccess: () => closeModal(),
                onError: () => toast.error('Gagal mencatat transaksi baru.'),
            });
        }
    };

    const handleRefreshTable = () => {
        setIsTableLoading(true);
        router.reload({
            only: ['transactions'],
            onFinish: () => {
                setTimeout(() => {
                    setIsTableLoading(false);
                    toast.success('Data transaksi berhasil diperbarui!');
                }, 400);
            },
        });
    };

    const processedTransactions = [...rawItems]
        .filter((item) => {
            if (filterType === 'income') return item.type === 'income';
            if (filterType === 'expense') return item.type === 'expense';
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'latest') return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
            if (sortBy === 'oldest') return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
            if (sortBy === 'amount_desc') return parseFloat(b.amount as string) - parseFloat(a.amount as string);
            return 0;
        });

    const openCreateModal = () => {
        setEditItem(null);
        setLocalImagePreview(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (item: TransactionItem) => {
        setEditItem(item);
        clearErrors();

        if (item.attachment) {
            setLocalImagePreview(`/storage/${item.attachment}`);
        } else {
            setLocalImagePreview(null);
        }

        setData({
            wallet_id: item.wallet_id ? item.wallet_id.toString() : 'none',
            wishlist_id: item.wishlist_id ? item.wishlist_id.toString() : 'none',
            title: item.title,
            type: item.type,
            category: item.category,
            amount: item.amount.toString(),
            transaction_date: item.transaction_date.split('T')[0],
            description: item.description || '',
            payment_method: item.payment_method ? item.payment_method : 'none',
            attachment: null,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditItem(null);
        setLocalImagePreview(null);
        reset();
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(route('transactions.destroy', deleteId), {
                onSuccess: () => {
                    setDeleteId(null);
                    toast.success('Catatan transaksi berhasil dihapus!');
                },
                onError: () => toast.error('Gagal menghapus data transaksi.'),
            });
        }
    };

    const formatRupiah = (angka: number | string) => {
        const value = typeof angka === 'string' ? parseFloat(angka) : angka;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaction" />

            <Toaster position="top-right" richColors closeButton />

            <div className="w-full space-y-6 p-6">
                {/* Header Dinamis */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div>
                            <h2 className="text-foreground text-2xl font-bold tracking-tight">Arus Kas & Transaksi</h2>
                            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                                Pantau seluruh riwayat pemasukan dan pengeluaran tabungan Anda di sini. Sambungkan pengeluaran langsung dengan target
                                Wishlist untuk melihat progres pencapaian finansial Anda secara transparan.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Transaksi
                        </Button>
                    </div>
                </div>

                {/* Filter & Urutan Panel */}
                <div className="flex flex-col sm:flex-row sm:items-center">
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
                        <Button variant="outline" size="icon" onClick={handleRefreshTable} disabled={isTableLoading} title="Refresh tabel">
                            <RefreshCw className={`h-4 w-4 ${isTableLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Urutkan..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">Tanggal: Terbaru</SelectItem>
                                <SelectItem value="oldest">Tanggal: Terlama</SelectItem>
                                <SelectItem value="amount_desc">Nominal: Terbesar</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Jenis..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jenis</SelectItem>
                                <SelectItem value="income">Pemasukan</SelectItem>
                                <SelectItem value="expense">Pengeluaran</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Dialog Form Tambah / Edit */}
                <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent className="sm:max-w-[950px]">
                        <form onSubmit={submit} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>{editItem ? 'Edit Catatan Transaksi' : 'Tambah Transaksi Baru'}</DialogTitle>
                                <DialogDescription>Masukkan catatan keuangan kas masuk atau keluar dari dompet tabungan Anda.</DialogDescription>
                            </DialogHeader>

                            <div className="grid max-h-[60vh] gap-4 overflow-y-auto px-1 py-2">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* SELEKTOR WALLET / DOMPET */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="wallet_id">
                                            Dompet / Kantong <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.wallet_id} onValueChange={(value) => setData('wallet_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih dompet..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" disabled>
                                                    -- Pilih Dompet Sumber --
                                                </SelectItem>
                                                {wallets.map((w) => (
                                                    <SelectItem key={w.id} value={w.id.toString()}>
                                                        {w.wallet_name} ({formatRupiah(w.balance)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.wallet_id} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="type">Jenis Transaksi</Label>
                                        <Select value={data.type} onValueChange={(value) => setData('type', value as any)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih jenis..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="expense">Pengeluaran (Keluar)</SelectItem>
                                                <SelectItem value="income">Pemasukan (Masuk)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.type} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Judul / Nama Transaksi</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Contoh: Tabungan Awal atau Beli Casing MacBook"
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="wishlist_id">
                                            Alokasi Barang Impian <span className="text-muted-foreground text-xs">(Opsional)</span>
                                        </Label>
                                        <Select value={data.wishlist_id.toString()} onValueChange={(value) => setData('wishlist_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih barang wishlist..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Bukan Untuk Wishlist</SelectItem>
                                                {wishlists.map((w) => (
                                                    <SelectItem key={w.id} value={w.id.toString()}>
                                                        {w.item_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.wishlist_id} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount">Nominal / Jumlah (Rp)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            placeholder="Contoh: 500000"
                                        />
                                        <InputError message={errors.amount} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="transaction_date">Tanggal Transaksi</Label>
                                        <Input
                                            id="transaction_date"
                                            type="date"
                                            value={data.transaction_date}
                                            onChange={(e) => setData('transaction_date', e.target.value)}
                                        />
                                        <InputError message={errors.transaction_date} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Kategori</Label>
                                        <Input
                                            id="category"
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            placeholder="Contoh: Saku, Hiburan, Tabungan"
                                        />
                                        <InputError message={errors.category} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="payment_method">Metode Pembayaran</Label>
                                        <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih metode..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Pilih Metode Pembayaran</SelectItem>
                                                <SelectItem value="Cash">Cash / Tunai</SelectItem>
                                                <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
                                                <SelectItem value="E-Wallet">E-Wallet (Dana/Ovo/Gopay)</SelectItem>
                                                <SelectItem value="Kartu Kredit">Kartu Kredit / Debit</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.payment_method} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="attachment">
                                        Nota / Bukti Gambar Transaksi {editItem && <span className="text-muted-foreground text-xs">(Opsional)</span>}
                                    </Label>
                                    <Input id="attachment" type="file" accept="image/*" onChange={handleFileChange} disabled={processing} />
                                    <InputError message={errors.attachment} />

                                    {localImagePreview && (
                                        <div className="bg-muted group relative mt-2 w-full max-w-[200px] rounded-lg border p-1">
                                            <img src={localImagePreview} alt="Pratinjau Berkas" className="h-28 w-full rounded-md object-cover" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full shadow-md"
                                                onClick={removeSelectedImage}
                                                title="Hapus gambar pilihan"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Keterangan Tambahan</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Tulis catatan opsional transaksi di sini..."
                                        rows={3}
                                    />
                                    <InputError message={errors.description} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    {editItem ? 'Perbarui' : 'Simpan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog Preview Lampiran */}
                <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                    <DialogContent className="flex flex-col items-center justify-center p-6 sm:max-w-[500px]">
                        <DialogHeader className="w-full text-left">
                            <DialogTitle>Pratinjau Nota Lampiran</DialogTitle>
                        </DialogHeader>
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="Attachment Preview"
                                className="mt-2 max-h-[70vh] w-full rounded-md border object-contain shadow-sm"
                            />
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modal Konfirmasi Hapus */}
                <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus riwayat transaksi ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tindakan ini tidak dapat dikembalikan. Saldo rekaman transaksi beserta berkas lampiran akan dihapus selamanya dari
                                sistem.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Ya, Hapus Catatan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Tabel Utama Modul */}
                <div className="bg-card overflow-x-auto rounded-md border">
                    <Table className="w-full table-auto border-separate rounded-md border border-gray-400 text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px] border text-center">Aksi</TableHead>
                                <TableHead className="border">Tanggal</TableHead>
                                <TableHead className="border">User</TableHead>
                                <TableHead className="border">Judul Transaksi</TableHead>
                                <TableHead className="border">Kategori</TableHead>
                                <TableHead className="border">Alokasi Wishlist</TableHead>
                                <TableHead className="border">Metode</TableHead>
                                <TableHead className="w-[90px] border text-center">Nota</TableHead>
                                <TableHead className="border">Nominal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-foreground">
                            {isTableLoading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="border p-3 text-center">
                                            <Skeleton className="mx-auto h-8 w-8 rounded-md" />
                                        </TableCell>
                                        <TableCell className="border p-3">
                                            <Skeleton className="h-5 w-[90px]" />
                                        </TableCell>
                                        <TableCell className="border p-3">
                                            <Skeleton className="h-5 w-[100px]" />
                                        </TableCell>
                                        <TableCell className="border p-3">
                                            <Skeleton className="h-5 w-[140px]" />
                                        </TableCell>
                                        <TableCell className="border p-3">
                                            <Skeleton className="h-5 w-[80px]" />
                                        </TableCell>
                                        <TableCell className="border p-3">
                                            <Skeleton className="h-5 w-[110px]" />
                                        </TableCell>
                                        <TableCell className="border p-3">
                                            <Skeleton className="h-5 w-[70px]" />
                                        </TableCell>
                                        <TableCell className="border p-3 text-center">
                                            <Skeleton className="mx-auto h-8 w-8 rounded-md" />
                                        </TableCell>
                                        <TableCell className="border p-3">
                                            <Skeleton className="h-5 w-[100px]" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : processedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-muted-foreground h-24 text-center">
                                        Belum ada catatan arus kas transaksi. Yuk, catat sekarang!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                processedTransactions.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="border px-1 py-1 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-32">
                                                    <DropdownMenuItem onClick={() => openEditModal(item)} className="cursor-pointer gap-2">
                                                        <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                                                        <span>Edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteId(item.id)}
                                                        className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span>Hapus</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell className="border px-1 py-1 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                                                {new Date(item.transaction_date).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="border px-1 py-1 text-xs font-medium">
                                            <div className="text-muted-foreground flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span className="max-w-[100px] truncate">{item.user ? item.user.name : `User #${item.user_id}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border px-1 py-1 font-semibold">{item.title}</TableCell>
                                        <TableCell className="border px-1 py-1">
                                            <Badge variant="outline" className="bg-muted/40 text-xs">
                                                {item.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="border px-1 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                            {item.wishlist ? (
                                                item.wishlist.item_name
                                            ) : (
                                                <span className="text-muted-foreground/50 font-normal">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="border px-1 py-1 text-xs">{item.payment_method}</TableCell>
                                        <TableCell className="border px-1 py-1 text-center">
                                            {item.attachment ? (
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                    onClick={() => setPreviewImage(`/storage/${item.attachment}`)}
                                                    title="Lihat Nota Bukti"
                                                >
                                                    <ImageIcon className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <div className="text-muted-foreground/30 mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-dashed">
                                                    <ImageIcon className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="border px-1 py-1 font-bold">
                                            <div className="flex items-center gap-1">
                                                {item.type === 'income' ? (
                                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                )}
                                                <span
                                                    className={
                                                        item.type === 'income'
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }
                                                >
                                                    {item.type === 'income' ? '+' : '-'} {formatRupiah(item.amount)}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {transactions && last_page > 1 && (
                    <div className="flex flex-col gap-4 px-2 py-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-muted-foreground text-xs">
                            Menampilkan <span className="font-medium">{from || 0}</span> hingga <span className="font-medium">{to || 0}</span> dari{' '}
                            <span className="font-medium">{total || 0}</span> data transaksi
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {links.map((link, index) => {
                                const isPrevious = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');
                                return (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size={isPrevious || isNext ? 'default' : 'icon'}
                                        className={`h-8 min-w-[32px] px-2 text-xs ${!link.url && 'pointer-events-none opacity-50'}`}
                                        asChild={!!link.url}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} preserveScroll preserveState>
                                                {isPrevious ? <ChevronLeft className="mr-1 h-3.5 w-3.5" /> : null}
                                                {isPrevious ? 'Sebelumnya' : isNext ? 'Berikutnya' : link.label}
                                                {isNext ? <ChevronRight className="ml-1 h-3.5 w-3.5" /> : null}
                                            </Link>
                                        ) : (
                                            <span>{isPrevious ? 'Sebelumnya' : isNext ? 'Berikutnya' : link.label}</span>
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
