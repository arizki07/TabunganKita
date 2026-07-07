<?php

namespace App\Http\Controllers\Master;

use App\Helpers\NotificationHelper;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class WishlistController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_name'    => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'target_date'  => 'nullable|date',
            'priority'     => 'required|in:low,medium,high',
            'product_url'  => 'nullable|url|max:255',
            'image'        => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'notes'        => 'nullable|string',
        ]);

        $userId = Auth::id();
        $validated['user_id'] = $userId;
        $validated['is_purchased'] = false;

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('wishlists', 'public');
        }

        $wishlist = Wishlist::create($validated);

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser(
                $broadcastUser->id,
                'Target Impian Baru! 🎯',
                "'" . Auth::user()->name . "' menambahkan '{$wishlist->item_name}' ke dalam daftar impian.",
                '/wishlists'
            );
        }

        return redirect()->back()->with('success', 'Barang impian berhasil ditambahkan!');
    }

    public function update(Request $request, Wishlist $wishlist)
    {
        $validated = $request->validate([
            'item_name'    => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'target_date'  => 'nullable|date',
            'priority'     => 'required|in:low,medium,high',
            'product_url'  => 'nullable|url|max:255',
            'image'        => 'nullable|mixed',
            'notes'        => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            if ($wishlist->image) {
                Storage::disk('public')->delete($wishlist->image);
            }
            $validated['image'] = $request->file('image')->store('wishlists', 'public');
        } else {
            unset($validated['image']);
        }

        $wishlist->update($validated);

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser(
                $broadcastUser->id,
                'Wishlist Diperbarui ✏️',
                "Daftar impian '{$wishlist->item_name}' telah diperbarui oleh " . Auth::user()->name . ".",
                '/wishlists'
            );
        }

        return redirect()->back()->with('success', 'Barang impian berhasil diperbarui!');
    }

    public function destroy(Wishlist $wishlist)
    {
        $name = $wishlist->item_name;

        if ($wishlist->image) {
            Storage::disk('public')->delete($wishlist->image);
        }
        $wishlist->delete();

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser(
                $broadcastUser->id,
                'Wishlist Dihapus 🗑️',
                "Barang impian '{$name}' telah dihapus dari daftar oleh " . Auth::user()->name . ".",
                '/wishlists'
            );
        }

        return redirect()->back()->with('success', 'Barang impian berhasil dihapus!');
    }

    public function togglePurchase(Wishlist $wishlist)
    {
        $wishlist->is_purchased = !$wishlist->is_purchased;
        $wishlist->purchased_at = $wishlist->is_purchased ? now() : null;
        $wishlist->save();

        if ($wishlist->is_purchased) {
            $judul = 'Impian Tercapai! 🎉';
            $pesan = "Selamat! Impian '{$wishlist->item_name}' telah berhasil dibeli oleh " . Auth::user()->name . ".";
        } else {
            $judul = 'Status Wishlist Berubah 🎯';
            $pesan = "Status pembelian untuk '{$wishlist->item_name}' telah dibatalkan oleh " . Auth::user()->name . ".";
        }

        $allBroadcastUsers = User::whereNotNull('fcm_token')->get();
        foreach ($allBroadcastUsers as $broadcastUser) {
            NotificationHelper::sendToUser($broadcastUser->id, $judul, $pesan, '/wishlists');
        }

        return redirect()->back()->with('success', 'Status pembelian berhasil diperbarui!');
    }
}
