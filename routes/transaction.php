<?php

use App\Http\Controllers\Master\TransactionController;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::get('transaction', function (Request $request) {
        $query = Transaction::with('wishlist', 'user');

        if ($request->has('type') && in_array($request->type, ['income', 'expense'])) {
            $query->where('type', $request->type);
        }

        if ($request->sort === 'oldest') {
            $query->orderBy('transaction_date', 'asc');
        } elseif ($request->sort === 'amount_desc') {
            $query->orderBy('amount', 'desc');
        } else {
            $query->orderBy('transaction_date', 'desc');
        }

        $transactions = $query->paginate(10)->withQueryString();
        $wishlists = Wishlist::orderBy('item_name', 'asc')->get();

        $wallets = Wallet::orderBy('wallet_name', 'asc')->get(['id', 'wallet_name', 'type', 'balance']);

        return Inertia::render('transaction/Transaction-view', [
            'transactions' => $transactions,
            'wishlists'    => $wishlists,
            'wallets'      => $wallets,
            'queryParams'  => $request->query() ?: null,
        ]);
    })->name('transaction.view');

    Route::controller(TransactionController::class)->group(function () {
        Route::post('v1/transaction', 'store')->name('transactions.store');
        Route::post('v1/transaction/{transaction}/update', 'update')->name('transactions.update');
        Route::delete('v1/transaction/{transaction}', 'destroy')->name('transactions.destroy');
    });
});
