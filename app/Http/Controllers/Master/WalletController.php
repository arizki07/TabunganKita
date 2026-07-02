<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletController extends Controller
{
    /**
     * Tampilkan daftar kantong keuangan
     */
    public function index()
    {
        $wallets = Wallet::orderBy('wallet_name', 'asc')->get();

        return Inertia::render('wallet/Wallet-view', [
            'wallets' => $wallets
        ]);
    }

    public function store(Request $request)
    {
        // 1. Ubah validasi agar menerima tipe baru dan izinkan nilai minus khusus untuk paylater
        $request->validate([
            'wallet_name' => 'required|string|max:255',
            'type'        => 'required|in:bank,cash,e-wallet,credit_card,paylater_loan', // <-- Tambahkan paylater_loan di sini
            'balance'     => $request->type === 'paylater_loan'
                ? 'required|numeric' // <-- Kalau paylater, boleh minus (hapus min:0)
                : 'required|numeric|min:0', // <-- Kalau dompet biasa, wajib minimal 0
            'color_hex'   => 'required|string|max:7',
            'notes'       => 'nullable|string|max:255',
        ]);

        // 2. Ambil semua data inputan
        $data = $request->all();
        $data['user_id'] = auth()->id() ?? 1;

        // 3. Pastikan nilainya disimpan sebagai negatif jika tipenya paylater
        if ($data['type'] === 'paylater_loan' && $data['balance'] > 0) {
            $data['balance'] = $data['balance'] * -1;
        }

        Wallet::create($data);

        return redirect()->back()->with('success', 'Kantong baru berhasil dibuat!');
    }

    public function update(Request $request, Wallet $wallet)
    {
        $request->validate([
            'wallet_name' => 'required|string|max:255',
            'type'        => 'required|in:bank,cash,e-wallet,credit_card,paylater_loan', // <-- Tambahkan juga di sini
            'color_hex'   => 'required|string|max:7',
            'notes'       => 'nullable|string|max:255',
        ]);

        $wallet->update($request->all());

        return redirect()->back()->with('success', 'Data kantong berhasil diperbarui!');
    }

    /**
     * Hapus kantong tabungan
     */
    public function destroy(Wallet $wallet)
    {
        $wallet->delete();
        return redirect()->back()->with('success', 'Kantong berhasil dihapus dari sistem!');
    }
}
