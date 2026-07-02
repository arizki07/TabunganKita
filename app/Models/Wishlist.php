<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Wishlist extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'item_name',
        'price',
        'target_date',
        'priority',
        'product_url',
        'image',
        'notes',
        'is_purchased',
        'purchased_at',
    ];

    // Konversi tipe data otomatis
    protected $casts = [
        'is_purchased' => 'boolean', // Memastikan dikirim ke React sebagai true/false
        'target_date' => 'date',
        'purchased_at' => 'date',
        'price' => 'decimal:2',
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke Transaction (Satu wishlist bisa saja dicicil pembayarannya atau dibayar sekaligus)
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
