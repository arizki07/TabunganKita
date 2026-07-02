<?php

namespace App\Http\Controllers\Master;

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

        $validated['user_id'] = Auth::id();
        $validated['is_purchased'] = false;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('wishlists', 'public');
            $validated['image'] = $path;
        }

        Wishlist::create($validated);

        return redirect()->back()->with('success', 'Barang impian berhasil ditambahkan!');
    }

    /**
     * Update data (Mendukung Multipart FormData Method Spoofing '_method' = 'PUT')
     */
    public function update(Request $request, Wishlist $wishlist)
    {
        $validated = $request->validate([
            'item_name'    => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'target_date'  => 'nullable|date',
            'priority'     => 'required|in:low,medium,high',
            'product_url'  => 'nullable|url|max:255',
            'image'        => 'nullable|mixed', // Bisa berupa file baru atau string path lama
            'notes'        => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            if ($wishlist->image) {
                Storage::disk('public')->delete($wishlist->image);
            }
            $validated['image'] = $request->file('image')->store('wishlists', 'public');
        } else {
            unset($validated['image']); // Tetapkan gambar lama jika tidak diubah
        }

        $wishlist->update($validated);

        return redirect()->back()->with('success', 'Barang impian berhasil diperbarui!');
    }

    /**
     * Hapus data beserta file fisiknya
     */
    public function destroy(Wishlist $wishlist)
    {
        if ($wishlist->image) {
            Storage::disk('public')->delete($wishlist->image);
        }

        $wishlist->delete();

        return redirect()->back()->with('success', 'Barang impian berhasil dihapus!');
    }

    /**
     * Ubah status is_purchased secara instan
     */
    public function togglePurchase(Wishlist $wishlist)
    {
        $wishlist->is_purchased = !$wishlist->is_purchased;
        $wishlist->purchased_at = $wishlist->is_purchased ? now() : null;
        $wishlist->save();

        return redirect()->back()->with('success', 'Status pembelian berhasil diperbarui!');
    }
}
