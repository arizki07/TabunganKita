<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Wallet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'wallet_name',
        'type',
        'balance',
        'color_hex',
        'notes',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke Transaksi (Satu kantong punya banyak riwayat transaksi)
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
