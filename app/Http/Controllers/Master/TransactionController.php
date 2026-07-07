<?php

namespace App\Http\Controllers\Master;

use App\Helpers\NotificationHelper;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TransactionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'wallet_id'        => 'required|exists:wallets,id',
            'wishlist_id'      => 'nullable|exists:wishlists,id',
            'title'            => 'required|string|max:255',
            'type'             => 'required|in:income,expense',
            'category'         => 'required|string|max:255',
            'amount'           => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'description'      => 'nullable|string',
            'payment_method'   => 'required|string',
            'attachment'       => 'nullable|image|max:2048'
        ]);

        $userId = auth()->id() ?? 1;
        $validated['user_id'] = $userId;

        if ($request->hasFile('attachment')) {
            $validated['attachment'] = $request->file('attachment')->store('attachments', 'public');
        }

        $wallet = Wallet::findOrFail($validated['wallet_id']);

        if ($validated['type'] === 'income') {
            $wallet->increment('balance', $validated['amount']);
            $simbol = "➕ Pemasukan Baru";
            $teksPesan = "Dana masuk sebesar Rp " . number_format($validated['amount'], 0, ',', '.') . " untuk '{$validated['title']}'.";
        } else {
            $wallet->decrement('expense', $validated['amount']);
            $simbol = "➖ Pengeluaran Baru";
            $teksPesan = "Dana keluar sebesar Rp " . number_format($validated['amount'], 0, ',', '.') . " untuk '{$validated['title']}'.";
        }

        Transaction::create($validated);

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser($broadcastUser->id, $simbol, $teksPesan, '/transactions');
        }

        return redirect()->back()->with('success', 'Transaksi berhasil dicatat dan saldo kantong terupdate!');
    }

    public function update(Request $request, Transaction $transaction)
    {
        $validated = $request->validate([
            'wishlist_id'      => 'nullable|exists:wishlists,id',
            'title'            => 'required|string|max:255',
            'type'             => 'required|in:income,expense',
            'category'         => 'required|string|max:255',
            'amount'           => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'description'      => 'nullable|string',
            'payment_method'   => 'required|string|max:255',
            'attachment'       => 'nullable',
        ]);

        if ($request->hasFile('attachment')) {
            if ($transaction->attachment) {
                Storage::disk('public')->delete($transaction->attachment);
            }
            $validated['attachment'] = $request->file('attachment')->store('attachments', 'public');
        } else {
            unset($validated['attachment']);
        }

        $transaction->update($validated);

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser(
                $broadcastUser->id,
                'Transaksi Diperbarui 📝',
                "Catatan transaksi '{$transaction->title}' berhasil diubah oleh " . Auth::user()->name . ".",
                '/transactions'
            );
        }

        return redirect()->back()->with('success', 'Transaksi berhasil diperbarui!');
    }

    public function destroy(Transaction $transaction)
    {
        $title = $transaction->title;

        if ($transaction->attachment) {
            Storage::disk('public')->delete($transaction->attachment);
        }

        if ($transaction->wallet_id) {
            $wallet = Wallet::find($transaction->wallet_id);
            if ($wallet) {
                if ($transaction->type === 'income') {
                    $wallet->decrement('balance', $transaction->amount);
                } else {
                    $wallet->increment('balance', $transaction->amount);
                }
            }
        }

        $transaction->delete();

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser(
                $broadcastUser->id,
                'Transaksi Dihapus 🗑️',
                "Catatan transaksi '{$title}' telah dihapus oleh " . Auth::user()->name . ".",
                '/transactions'
            );
        }

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus!');
    }
}
