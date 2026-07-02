<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wishlist_id')->nullable()->constrained()->nullOnDelete(); // Terisi jika pengeluaran untuk beli wishlist
            $table->foreignId('wallet_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title'); // Contoh: "Gaji Bulanan" atau "Beli Kopi"
            $table->enum('type', ['income', 'expense']);
            $table->string('category')->nullable(); // Langsung berupa teks, misal: "Makanan", "Transport"
            $table->decimal('amount', 15, 2);
            $table->date('transaction_date');
            $table->text('description')->nullable();

            $table->string('payment_method')->nullable(); // Cash, BCA, GoPay, dll
            $table->string('attachment')->nullable(); // Path untuk gambar struk/bon

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction');
    }
};
