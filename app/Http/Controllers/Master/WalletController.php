<?php

namespace App\Http\Controllers\Master;

use App\Helpers\NotificationHelper;
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
        $request->validate([
            'wallet_name' => 'required|string|max:255',
            'type'        => 'required|in:bank,cash,e-wallet,credit_card,paylater_loan',
            'balance'     => $request->type === 'paylater_loan' ? 'required|numeric' : 'required|numeric|min:0',
            'color_hex'   => 'required|string|max:7',
            'notes'       => 'nullable|string|max:255',
        ]);

        $data = $request->all();
        $userId = auth()->id() ?? 1;
        $data['user_id'] = $userId;

        if ($data['type'] === 'paylater_loan' && $data['balance'] > 0) {
            $data['balance'] = $data['balance'] * -1;
        }

        $wallet = Wallet::create($data);

        NotificationHelper::sendToUser($userId, 'Kantong Baru Dibuat! 💼', "Kantong '{$wallet->wallet_name}' berhasil ditambahkan ke sistem.");

        return redirect()->back()->with('success', 'Kantong baru berhasil dibuat!');
    }

    public function update(Request $request, Wallet $wallet)
    {
        $request->validate([
            'wallet_name' => 'required|string|max:255',
            'type'        => 'required|in:bank,cash,e-wallet,credit_card,paylater_loan',
            'color_hex'   => 'required|string|max:7',
            'notes'       => 'nullable|string|max:255',
        ]);

        $wallet->update($request->all());

        NotificationHelper::sendToUser($wallet->user_id, 'Kantong Diperbarui ✏️', "Informasi kantong '{$wallet->wallet_name}' telah diubah.");

        return redirect()->back()->with('success', 'Data kantong berhasil diperbarui!');
    }

    public function destroy(Wallet $wallet)
    {
        $userId = $wallet->user_id;
        $name = $wallet->wallet_name;

        $wallet->delete();

        NotificationHelper::sendToUser($userId, 'Kantong Dihapus 🗑️', "Kantong '{$name}' telah dihapus dari sistem.");

        return redirect()->back()->with('success', 'Kantong berhasil dihapus dari sistem!');
    }
}
