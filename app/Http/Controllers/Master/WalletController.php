<?php

namespace App\Http\Controllers\Master;

use App\Helpers\NotificationHelper;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser(
                $broadcastUser->id,
                'Kantong Baru Dibuat! 💼',
                "Kantong '{$wallet->wallet_name}' berhasil ditambahkan ke sistem oleh " . Auth::user()->name . ".",
                '/dashboard'
            );
        }

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

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser(
                $broadcastUser->id,
                'Kantong Diperbarui ✏️',
                "Informasi kantong '{$wallet->wallet_name}' telah diubah oleh " . Auth::user()->name . ".",
                '/dashboard'
            );
        }

        return redirect()->back()->with('success', 'Data kantong berhasil diperbarui!');
    }

    public function destroy(Wallet $wallet)
    {
        $name = $wallet->wallet_name;

        $wallet->delete();

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser(
                $broadcastUser->id,
                'Kantong Dihapus 🗑️',
                "Kantong '{$name}' telah dihapus dari sistem oleh " . Auth::user()->name . ".",
                '/dashboard'
            );
        }

        return redirect()->back()->with('success', 'Kantong berhasil dihapus dari sistem!');
    }
}
