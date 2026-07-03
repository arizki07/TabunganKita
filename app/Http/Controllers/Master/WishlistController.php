<?php

namespace App\Http\Controllers\Master;

use App\Helpers\NotificationHelper;
use App\Http\Controllers\Controller;
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

        NotificationHelper::sendToUser($userId, 'Target Impian Baru! 🎯', "Menambahkan '{$wishlist->item_name}' ke dalam daftar impian Anda.");

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

        NotificationHelper::sendToUser($wishlist->user_id, 'Wishlist Diperbarui ✏️', "'{$wishlist->item_name}' telah berhasil diperbarui.");

        return redirect()->back()->with('success', 'Barang impian berhasil diperbarui!');
    }

    public function destroy(Wishlist $wishlist)
    {
        $userId = $wishlist->user_id;
        $name = $wishlist->item_name;

        if ($wishlist->image) {
            Storage::disk('public')->delete($wishlist->image);
        }
        $wishlist->delete();

        NotificationHelper::sendToUser($userId, 'Wishlist Dihapus 🗑️', "Barang impian '{$name}' dihapus dari daftar.");

        return redirect()->back()->with('success', 'Barang impian berhasil dihapus!');
    }

    public function togglePurchase(Wishlist $wishlist)
    {
        $wishlist->is_purchased = !$wishlist->is_purchased;
        $wishlist->purchased_at = $wishlist->is_purchased ? now() : null;
        $wishlist->save();

        $pesan = $wishlist->is_purchased ? "Selamat! 🎉 Impian '{$wishlist->item_name}' telah terbeli!" : "Status pembelian '{$wishlist->item_name}' dibatalkan.";
        NotificationHelper::sendToUser($wishlist->user_id, 'Status Wishlist Berubah 🎯', $pesan);

        return redirect()->back()->with('success', 'Status pembelian berhasil diperbarui!');
    }
}
