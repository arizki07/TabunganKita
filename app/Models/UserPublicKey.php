<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPublicKey extends Model
{
    use HasFactory;
    protected $table = 'user_public_keys';
    protected $fillable = [
        'user_id',
        'credential_id',
        'public_key',
        'counter',
    ];
}
