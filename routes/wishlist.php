<?php

use App\Http\Controllers\Master\WishlistController;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::middleware(['auth'])->group(function () {
    Route::get('wishlist', function () {
        $wishlists = Wishlist::withSum(['transactions as current_amount' => function ($query) {
            $query->where('type', 'expense');
        }], 'amount')
            ->orderBy('created_at', 'desc')
            ->paginate(5);

        // Map data untuk memastikan current_amount bernilai 0 jika belum ada transaksi
        $wishlists->getCollection()->transform(function ($wishlist) {
            $wishlist->current_amount = $wishlist->current_amount ?? 0;
            return $wishlist;
        });
        return Inertia::render('wishlist/Wishlist-view', [
            'wishlists' => $wishlists
        ]);
    })->name('wishlist.view');

    Route::controller(WishlistController::class)->group(function () {
        Route::post('v1/wishlists', 'store')->name('wishlists.store');
        Route::post('v1/wishlist/{wishlist}/update', 'update')->name('wishlists.update');
        Route::delete('v1/wishlist/{wishlist}', 'destroy')->name('wishlists.destroy');
        Route::post('v1/wishlist/{wishlist}/toggle', 'togglePurchase')->name('wishlists.toggle-purchase');
    });
});
