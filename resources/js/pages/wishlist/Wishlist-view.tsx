import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    BrainCircuit, // Ikon untuk Smart Planner Keuangan
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Edit2,
    FileText,
    Image as ImageIcon,
    Link as LinkIcon,
    LoaderCircle,
    MoreVertical,
    Plus,
    RefreshCw,
    ShoppingBag,
    Trash2,
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
        title: 'Wishlist',
        href: '/wishlist',
    },
];

interface WishlistItem {
    id: number;
    item_name: string;
    price: number | string;
    current_amount?: number | string; // Tambahan properti dana cicilan terkumpul dari transaksi
    priority: 'low' | 'medium' | 'high';
    target_date: string | null;
    product_url: string | null;
    image: string | null;
    notes: string | null;
    is_purchased: boolean;
    purchased_at: string | null;
    created_at: string;
}

// Interface Pagination Link dari Laravel
interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

// Interface Struktur Data Paginate Laravel
interface PaginationData {
    data: WishlistItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface Props {
    wishlists: PaginationData;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function WishlistView({ wishlists, flash = {} }: Props) {
    const { data: rawItems = [], current_page, last_page, total, from, to, links = [] } = wishlists || {};

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<WishlistItem | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [isTableLoading, setIsTableLoading] = useState(false);
    const [sortBy, setSortBy] = useState<string>('latest');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Setup Inertia Form
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        item_name: '',
        price: '',
        target_date: '',
        priority: 'medium',
        product_url: '',
        image: null as File | null,
        notes: '',
    });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editItem) {
            post(route('wishlists.update', editItem.id), {
                forceFormData: true,
                queryParams: { _method: 'PUT' },
                onSuccess: () => {
                    closeModal();
                    toast.success('Barang impian berhasil diperbarui!');
                },
                onError: () => {
                    toast.error('Gagal memperbarui data. Periksa kembali inputan Anda.');
                },
            });
        } else {
            post(route('wishlists.store'), {
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                    toast.success('Barang impian berhasil disimpan!');
                },
                onError: () => {
                    toast.error('Gagal menyimpan data. Periksa kembali inputan Anda.');
                },
            });
        }
    };

    const handleRefreshTable = () => {
        setIsTableLoading(true);
        router.reload({
            only: ['wishlists'],
            onFinish: () => {
                setTimeout(() => {
                    setIsTableLoading(false);
                    toast.success('Data wishlist berhasil diperbarui!');
                }, 400);
            },
        });
    };

    const processedWishlists = [...rawItems]
        .filter((item) => {
            if (filterStatus === 'purchased') return item.is_purchased;
            if (filterStatus === 'saving') return !item.is_purchased;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'latest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

            if (sortBy === 'date_asc') {
                if (!a.target_date) return 1;
                if (!b.target_date) return -1;
                return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
            }
            if (sortBy === 'date_desc') {
                if (!a.target_date) return 1;
                if (!b.target_date) return -1;
                return new Date(b.target_date).getTime() - new Date(a.target_date).getTime();
            }

            if (sortBy === 'priority_high') {
                const weight = { high: 3, medium: 2, low: 1 };
                return weight[b.priority] - weight[a.priority];
            }
            return 0;
        });

    const openCreateModal = () => {
        setEditItem(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (item: WishlistItem) => {
        setEditItem(item);
        clearErrors();
        setData({
            item_name: item.item_name,
            price: item.price.toString(),
            target_date: item.target_date ? item.target_date.split('T')[0] : '',
            priority: item.priority,
            product_url: item.product_url || '',
            image: null,
            notes: item.notes || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditItem(null);
        reset();
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(route('wishlists.destroy', deleteId), {
                onSuccess: () => {
                    setDeleteId(null);
                    toast.success('Barang impian berhasil dihapus!');
                },
                onError: () => toast.error('Gagal menghapus data.'),
            });
        }
    };

    const handleTogglePurchase = (id: number) => {
        router.post(
            route('wishlists.toggle-purchase', id),
            {},
            {
                onSuccess: () => toast.success('Status pembelian berhasil diperbarui!'),
                onError: () => toast.error('Gagal mengubah status.'),
            },
        );
    };

    const formatRupiah = (angka: number | string) => {
        const value = typeof angka === 'string' ? parseFloat(angka) : angka;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
    };

    // Fungsi Utama Kalkulator Cerdas Tabungan
    const calculateSavingsPlan = (price: number | string, currentAmount: number | string | undefined, targetDateStr: string | null) => {
        const targetPrice = typeof price === 'string' ? parseFloat(price) : price;
        const collected = typeof currentAmount === 'string' ? parseFloat(currentAmount) : (currentAmount ?? 0);
        const needed = targetPrice - collected;

        if (needed <= 0) {
            return <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">🎉 Dana Terpenuhi!</span>;
        }

        if (!targetDateStr) {
            return <span className="text-muted-foreground text-xs italic">Set target tanggal beli</span>;
        }

        const today = new Date();
        const targetDate = new Date(targetDateStr);
        const timeDiff = targetDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysLeft <= 0) {
            return <span className="text-xs font-semibold text-red-500">⚠️ Target terlewati</span>;
        }

        const perDay = Math.ceil(needed / daysLeft);
        const perMonth = Math.ceil(needed / (daysLeft / 30));

        return (
            <div className="flex flex-col gap-0.5 text-left text-[11px] leading-tight">
                <div className="text-foreground font-medium">
                    <span className="font-bold text-amber-600">{formatRupiah(perDay)}</span> /hari
                </div>
                {daysLeft >= 30 && (
                    <div className="text-muted-foreground text-[10px]">
                        atau <span className="font-semibold">{formatRupiah(perMonth)}</span> /bulan
                    </div>
                )}
                <div className="text-muted-foreground/80 mt-0.5 text-[9px] italic">({daysLeft} hari tersisa)</div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wishlist" />

            <Toaster position="top-right" richColors closeButton />

            <div className="w-full space-y-6 p-6">
                {/* Header & Tombol Utama */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
                            Daftar Impian & Wishlist Planner
                        </h2>
                        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                            Catat, kelola, dan pantau perkembangan target barang impian Anda di sini. Rencana tabungan otomatis dihitung berdasarkan
                            rekaman alokasi pengeluaran Anda.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Wishlist
                        </Button>
                    </div>
                </div>

                {/* Toolbar Filter & Sort Panel */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
                        <Button variant="outline" size="icon" onClick={handleRefreshTable} disabled={isTableLoading} title="Refresh tabel">
                            <RefreshCw className={`h-4 w-4 ${isTableLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Urutkan..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">Terbaru Ditambahkan</SelectItem>
                                <SelectItem value="date_asc">Target Beli: Terdekat</SelectItem>
                                <SelectItem value="date_desc">Target Beli: Terjauh</SelectItem>
                                <SelectItem value="priority_high">Prioritas: Tertinggi</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="saving">Status: Menabung</SelectItem>
                                <SelectItem value="purchased">Status: Sudah Dibeli</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Dialog Utama Form (Tambah / Edit) */}
                <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent className="sm:max-w-[650px]">
                        <form onSubmit={submit} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>{editItem ? 'Edit Barang Impian' : 'Tambah Barang Impian'}</DialogTitle>
                                <DialogDescription>Isi detail informasi target barang impian kamu di bawah ini.</DialogDescription>
                            </DialogHeader>

                            <div className="grid max-h-[60vh] gap-4 overflow-y-auto px-1 py-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="item_name">Nama Barang</Label>
                                    <Input
                                        id="item_name"
                                        value={data.item_name}
                                        onChange={(e) => setData('item_name', e.target.value)}
                                        placeholder="Contoh: MacBook Pro"
                                    />
                                    <InputError message={errors.item_name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="price">Harga Perkiraan (Rp)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={data.price}
                                            onChange={(e) => setData('price', e.target.value)}
                                            placeholder="Contoh: 15000000"
                                        />
                                        <InputError message={errors.price} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="target_date">Target Beli</Label>
                                        <Input
                                            id="target_date"
                                            type="date"
                                            value={data.target_date}
                                            onChange={(e) => setData('target_date', e.target.value)}
                                        />
                                        <InputError message={errors.target_date} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="priority">Prioritas</Label>
                                        <Select value={data.priority} onValueChange={(value) => setData('priority', value as any)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Rendah</SelectItem>
                                                <SelectItem value="medium">Sedang</SelectItem>
                                                <SelectItem value="high">Tinggi</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.priority} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="image">
                                            Foto Produk {editItem && <span className="text-muted-foreground text-xs">(Opsional)</span>}
                                        </Label>
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setData('image', e.target.files ? e.target.files[0] : null)}
                                        />
                                        <InputError message={errors.image} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="product_url">Link Produk (URL)</Label>
                                    <Input
                                        id="product_url"
                                        type="url"
                                        value={data.product_url}
                                        onChange={(e) => setData('product_url', e.target.value)}
                                        placeholder="https://example.com/item"
                                    />
                                    <InputError message={errors.product_url} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Catatan Tambahan</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Tulis detail spesifikasi toko, warna, ukuran, dll."
                                        rows={3}
                                    />
                                    <InputError message={errors.notes} />
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

                {/* Dialog Pratinjau Gambar */}
                <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                    <DialogContent className="flex flex-col items-center justify-center p-6 sm:max-w-[500px]">
                        <DialogHeader className="w-full text-left">
                            <DialogTitle>Pratinjau Gambar</DialogTitle>
                        </DialogHeader>
                        {previewImage && (
                            <img src={previewImage} alt="Preview" className="mt-2 max-h-[70vh] w-full rounded-md border object-contain shadow-sm" />
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modal Konfirmasi Hapus */}
                <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Apakah kamu benar-benar yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Data barang impian ini akan dihapus secara permanen dari sistem database.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Ya, Hapus Data
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Tabel Data Utama */}
                <div className="bg-card w-full overflow-x-auto rounded-md border shadow-sm">
                    <Table className="w-full min-w-[1000px] table-auto border-separate text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[120px] border text-center">Aksi</TableHead>
                                <TableHead className="border">Nama Barang</TableHead>
                                <TableHead className="border">Harga Target</TableHead>
                                <TableHead className="border">Dana Terkumpul</TableHead>
                                <TableHead className="border bg-amber-500/[0.04] font-semibold text-amber-800 dark:text-amber-400">
                                    <span className="flex items-center gap-1">
                                        <BrainCircuit className="h-3.5 w-3.5 text-amber-500" /> Rencana Menabung
                                    </span>
                                </TableHead>
                                <TableHead className="border">Prioritas</TableHead>
                                <TableHead className="border">Target Beli</TableHead>
                                <TableHead className="border">Detail</TableHead>
                                <TableHead className="w-[90px] border text-center">Gambar</TableHead>
                                <TableHead className="border">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-foreground">
                            {isTableLoading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell colSpan={10} className="p-3 text-center">
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : processedWishlists.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-muted-foreground h-24 text-center">
                                        Tidak ada barang impian yang cocok dengan kriteria saat ini.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                processedWishlists.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="border px-2 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
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

                                                <Button
                                                    size="sm"
                                                    variant={item.is_purchased ? 'outline' : 'default'}
                                                    className={`h-8 gap-1 px-2 text-xs ${!item.is_purchased && 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                                    onClick={() => handleTogglePurchase(item.id)}
                                                    title={item.is_purchased ? 'Batalkan Status Pembelian' : 'Tandai Sudah Dibeli'}
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {item.is_purchased ? 'Batal' : 'Beli'}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border px-3 py-2 font-semibold">{item.item_name}</TableCell>
                                        <TableCell className="border px-3 py-2 font-medium">{formatRupiah(item.price)}</TableCell>

                                        <TableCell className="border px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatRupiah(item.current_amount ?? 0)}
                                        </TableCell>

                                        <TableCell className="border bg-amber-500/[0.01] px-3 py-2">
                                            {item.is_purchased ? (
                                                <span className="text-xs font-bold text-emerald-600">✓ Sukses Dibeli</span>
                                            ) : (
                                                calculateSavingsPlan(item.price, item.current_amount, item.target_date)
                                            )}
                                        </TableCell>

                                        <TableCell className="border px-3 py-2">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    item.priority === 'high'
                                                        ? 'border-red-500/20 bg-red-500/10 text-red-500 capitalize'
                                                        : item.priority === 'medium'
                                                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-500 capitalize'
                                                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 capitalize'
                                                }
                                            >
                                                {item.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="border px-3 py-2 text-xs">
                                            {item.target_date ? (
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                                                    {new Date(item.target_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="border px-3 py-2">
                                            <div className="flex items-center gap-1.5">
                                                {item.product_url ? (
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-500" asChild>
                                                        <a href={item.product_url} target="_blank" rel="noopener noreferrer" title="Buka Tautan Toko">
                                                            <LinkIcon className="h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                ) : null}
                                                {item.notes ? (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 cursor-help text-amber-500"
                                                        title={item.notes}
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                    </Button>
                                                ) : null}
                                                {!item.product_url && !item.notes && <span className="text-muted-foreground text-xs">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="border px-3 py-2 text-center">
                                            {item.image ? (
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                                                    onClick={() => setPreviewImage(`/storage/${item.image}`)}
                                                >
                                                    <ImageIcon className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <div className="text-muted-foreground/40 bg-muted/40 mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-dashed">
                                                    <ImageIcon className="h-4 w-4" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="border px-3 py-2">
                                            {item.is_purchased ? (
                                                <Badge className="gap-1 bg-emerald-500 py-1 whitespace-nowrap text-white hover:bg-emerald-600">
                                                    <CheckCircle2 className="h-3 w-3" /> Sudah Dibeli
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-muted-foreground gap-1 py-1 whitespace-nowrap">
                                                    <ShoppingBag className="h-3 w-3" /> Menabung
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {wishlists && last_page > 1 && (
                    <div className="flex flex-col gap-4 px-2 py-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-muted-foreground text-xs">
                            Menampilkan <span className="font-medium">{from || 0}</span> hingga <span className="font-medium">{to || 0}</span> dari{' '}
                            <span className="font-medium">{total || 0}</span> data wishlist
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
