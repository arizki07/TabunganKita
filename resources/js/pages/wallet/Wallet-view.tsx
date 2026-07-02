import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle, // Tambahkan ikon peringatan utang
    Briefcase,
    CreditCard,
    DollarSign,
    Edit2,
    Layers,
    LoaderCircle,
    MoreVertical,
    Plus,
    Trash2,
    Wallet as WalletIcon,
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Wallets', href: '/wallet' }];

interface WalletItem {
    id: number;
    wallet_name: string;
    // Tambahkan tipe paylater_loan di interface
    type: 'cash' | 'bank' | 'e-wallet' | 'credit_card' | 'paylater_loan';
    balance: number | string;
    color_hex: string;
    notes: string | null;
}

interface Props {
    wallets: WalletItem[];
    flash?: { success?: string; error?: string };
}

export default function WalletIndex({ wallets = [], flash = {} }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<WalletItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        wallet_name: '',
        type: 'bank',
        balance: '',
        color_hex: '#3b82f6',
        notes: '',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Transformasi nilai jika tipenya paylater/pinjaman dan nilainya positif, ubah jadi minus saat saldo awal dibuat
        if (!editItem && data.type === 'paylater_loan' && parseFloat(data.balance) > 0) {
            data.balance = (parseFloat(data.balance) * -1).toString();
        }

        if (editItem) {
            put(route('wallet.update', editItem.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('wallet.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const openCreateModal = () => {
        setEditItem(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (item: WalletItem) => {
        setEditItem(item);
        clearErrors();
        setData({
            wallet_name: item.wallet_name,
            type: item.type,
            balance: item.balance.toString(),
            color_hex: item.color_hex,
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
            router.delete(route('wallet.destroy', deleteId), {
                onBefore: () => {
                    setDeleteId(null);
                },
                onSuccess: () => {
                    toast.success('Kantong tabungan berhasil dihapus!');
                },
                onError: () => {
                    toast.error('Gagal menghapus kantong tabungan.');
                },
            });
        }
    };

    const formatRupiah = (angka: number | string) => {
        const value = typeof angka === 'string' ? parseFloat(angka) : angka;
        // Gunakan format standar Indonesia, Recharts/Intl otomatis menangani tanda kurung atau minus (-) untuk angka negatif
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
    };

    const getWalletIcon = (type: string) => {
        switch (type) {
            case 'cash':
                return <DollarSign className="h-5 w-5" />;
            case 'e-wallet':
                return <Layers className="h-5 w-5" />;
            case 'credit_card':
                return <CreditCard className="h-5 w-5" />;
            case 'paylater_loan':
                return <AlertCircle className="h-5 w-5 text-red-200" />; // Ikon khusus pinjaman/kredit
            default:
                return <Briefcase className="h-5 w-5" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kantong Ku" />
            <Toaster position="top-right" richColors closeButton />

            <div className="w-full space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border bg-blue-500/10 text-blue-500 shadow-sm">
                            <WalletIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-foreground text-2xl font-bold tracking-tight">Kantong Tabungan Kita</h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Pisahkan alokasi dana tabungan atau pantau kewajiban cicilan paylater Anda secara transparan.
                            </p>
                        </div>
                    </div>
                    <Button onClick={openCreateModal} className="self-end sm:self-auto">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Kantong
                    </Button>
                </div>

                {/* Grid Visual Render Kartu Tabungan */}
                {wallets.length === 0 ? (
                    <div className="text-muted-foreground bg-card rounded-lg border border-dashed py-12 text-center">
                        Kamu belum memiliki kantong tabungan. Yuk buat wadah pertamamu!
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {wallets.map((wallet) => {
                            const balanceNum = typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance;
                            const isNegatif = balanceNum < 0;

                            return (
                                <div
                                    key={wallet.id}
                                    className="relative overflow-hidden rounded-xl border p-5 text-white shadow-md transition-all hover:scale-[1.02]"
                                    style={{ backgroundColor: wallet.color_hex }}
                                >
                                    {/* Efek Pola Kartu Bank */}
                                    <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10" />

                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium capitalize">
                                            {getWalletIcon(wallet.type)}
                                            {wallet.type.replace('_', ' ')}
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-white/80 hover:bg-white/10 hover:text-white"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-28">
                                                <DropdownMenuItem onClick={() => openEditModal(wallet)} className="cursor-pointer gap-2">
                                                    <Edit2 className="h-3.5 w-3.5 text-blue-500" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteId(wallet.id)}
                                                    className="cursor-pointer gap-2 text-red-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mt-6">
                                        <span className="block text-xs font-medium tracking-wider text-white/70">
                                            {isNegatif ? 'SISA TAGIHAN / UTANG' : 'SALDO KANTONG'}
                                        </span>
                                        <span className={`mt-1 block text-2xl font-bold tracking-tight ${isNegatif ? 'text-red-200' : ''}`}>
                                            {formatRupiah(wallet.balance)}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/90">
                                        <span className="max-w-[140px] truncate font-semibold tracking-wide">{wallet.wallet_name}</span>
                                        <span className="max-w-[100px] truncate opacity-70">
                                            {isNegatif ? '⚠️ Butuh Pelunasan' : wallet.notes || '-'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Dialog Form Input */}
                <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent className="sm:max-w-[480px]">
                        <form onSubmit={submit} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>{editItem ? 'Edit Detail Kantong' : 'Buat Kantong Tabungan Baru'}</DialogTitle>
                                <DialogDescription>Tentukan target alokasi penyimpanan uang kas Anda secara spesifik.</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-1">
                                <div className="grid gap-2">
                                    <Label htmlFor="wallet_name">Nama Kantong / Rekening</Label>
                                    <Input
                                        id="wallet_name"
                                        value={data.wallet_name}
                                        onChange={(e) => setData('wallet_name', e.target.value)}
                                        placeholder="Contoh: SPayLater, Cicilan Laptop, Bank BCA"
                                    />
                                    <InputError message={errors.wallet_name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="type">Tipe Penyimpanan</Label>
                                        <Select value={data.type} onValueChange={(value) => setData('type', value as any)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih tipe..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bank">Rekening Bank</SelectItem>
                                                <SelectItem value="cash">Cash / Tunai</SelectItem>
                                                <SelectItem value="e-wallet">E-Wallet Digital</SelectItem>
                                                <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                                                {/* OPSI BARU UNTUK PAYLATER */}
                                                <SelectItem value="paylater_loan">Paylater / Pinjaman</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.type} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="color_hex">Aksen Warna Tema</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="color_hex"
                                                type="color"
                                                value={data.color_hex}
                                                onChange={(e) => setData('color_hex', e.target.value)}
                                                className="h-9 w-12 cursor-pointer p-1"
                                            />
                                            <span className="text-muted-foreground font-mono text-xs uppercase">{data.color_hex}</span>
                                        </div>
                                        <InputError message={errors.color_hex} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="balance">
                                        {data.type === 'paylater_loan' ? 'Jumlah Utang Saat Ini (Rp)' : 'Saldo Awal (Rp)'}
                                    </Label>
                                    <Input
                                        id="balance"
                                        type="number"
                                        value={data.balance}
                                        // Pastikan jika user mengetik tanda minus "-", kita bersihkan agar hanya angka positif yang dimasukkan
                                        onChange={(e) => setData('balance', e.target.value.replace('-', ''))}
                                        placeholder={data.type === 'paylater_loan' ? 'Contoh: 2268000 (Otomatis disimpan minus)' : 'Contoh: 1000000'}
                                        disabled={!!editItem}
                                    />
                                    <InputError message={errors.balance} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Keterangan / Deskripsi</Label>
                                    <Input
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Opsional: Tanggal jatuh tempo atau catatan kecil"
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />} Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* AlertDialog Konfirmasi Hapus */}
                <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus kantong tabungan ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Menghapus wadah ini tidak akan menghapus riwayat transaksi lama, namun relasi kas kantong pada tabel akan terputus.
                                Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Ya, Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
