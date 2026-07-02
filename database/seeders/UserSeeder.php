<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Ahmad Rizki',
                'email' => 'ahmadrizki0704@gmail.com',
                'password' => Hash::make('28052026'),
                'role' => 'super',
                'created_at' => now(),
            ],
            [
                'name' => 'Ajeng Tri Utami',
                'email' => 'triutamiajeng9@gmail.com',
                'password' => Hash::make('28052026'),
                'role' => 'super',
                'created_at' => now(),
            ]
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}
