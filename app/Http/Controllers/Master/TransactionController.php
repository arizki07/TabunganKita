<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TransactionController extends Controller
{
    /**
     * Simpan transaksi baru
     */
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

        $validated['user_id'] = auth()->id() ?? 1;

        if ($request->hasFile('attachment')) {
            $validated['attachment'] = $request->file('attachment')->store('attachments', 'public');
        }

        // Eksekusi Pemotongan / Penambahan Saldo Kantong otomatis
        $wallet = Wallet::findOrFail($validated['wallet_id']);
        if ($validated['type'] === 'income') {
            $wallet->increment('balance', $validated['amount']);
        } else {
            $wallet->decrement('balance', $validated['amount']);
        }

        Transaction::create($validated);
        return redirect()->back()->with('success', 'Transaksi berhasil dicatat dan saldo kantong terupdate!');
    }

    /**
     * Update transaksi
     */
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
        return redirect()->back()->with('success', 'Transaksi berhasil diperbarui!');
    }

    /**
     * Hapus transaksi beserta lampirannya
     */
    public function destroy(Transaction $transaction)
    {
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
        return redirect()->back()->with('success', 'Transaksi berhasil dihapus!');
    }
}
