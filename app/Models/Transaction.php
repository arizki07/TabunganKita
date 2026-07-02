<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'wallet_id',
        'wishlist_id',
        'title',
        'type',
        'category',
        'amount',
        'transaction_date',
        'description',
        'payment_method',
        'attachment',
    ];

    // Konversi tipe data otomatis
    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2', // Pastikan angka desimal presisi 2 di belakang koma
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke Wishlist (jika transaksi ini untuk beli barang impian)
    public function wishlist()
    {
        return $this->belongsTo(Wishlist::class);
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }
}
