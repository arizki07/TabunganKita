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
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('item_name');
            $table->decimal('price', 15, 2);
            $table->date('target_date')->nullable(); // Target kapan mau dibeli
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');

            $table->text('product_url')->nullable(); // Link toko online
            $table->string('image')->nullable(); // Foto barang (opsional)
            $table->text('notes')->nullable();

            $table->boolean('is_purchased')->default(false);
            $table->date('purchased_at')->nullable(); // Tanggal realisasi beli

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishlists');
    }
};
