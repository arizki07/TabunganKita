<?php

use App\Http\Controllers\Master\WalletController;
use App\Http\Controllers\NotificationController;
use App\Models\Transaction;
use App\Models\Wishlist;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        $totalIncome = Transaction::where('type', 'income')->sum('amount');
        $totalExpense = Transaction::where('type', 'expense')->sum('amount');
        $currentBalance = $totalIncome - $totalExpense;

        $recentTransactions = Transaction::with(['wishlist', 'user'])
            ->orderBy('transaction_date', 'desc')
            ->latest()
            ->take(5)
            ->get();

        $urgentWishlists = Wishlist::where('is_purchased', false)
            ->withSum(['transactions as current_amount' => function ($query) {
                $query->where('type', 'expense');
            }], 'amount')
            ->orderBy('priority', 'desc')
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($wishlist) {
                $wishlist->current_amount = $wishlist->current_amount ?? 0;
                return $wishlist;
            });

        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $monthlyTrends = Transaction::where('transaction_date', '>=', $sixMonthsAgo)
            ->select(
                DB::raw("DATE_FORMAT(transaction_date, '%b') as month"),
                DB::raw("SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income"),
                DB::raw("SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense"),
                DB::raw("MIN(transaction_date) as raw_date")
            )
            ->groupBy('month')
            ->orderBy('raw_date', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => $item->month,
                    'income' => (float) $item->income,
                    'expense' => (float) $item->expense,
                ];
            });

        $categoryData = Transaction::where('type', 'expense')
            ->whereMonth('transaction_date', Carbon::now()->month)
            ->whereYear('transaction_date', Carbon::now()->year)
            ->select('category as name', DB::raw('SUM(amount) as value'))
            ->groupBy('category')
            ->orderBy('value', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'value' => (float) $item->value,
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'current_balance' => (float) $currentBalance,
                'total_income'    => (float) $totalIncome,
                'total_expense'   => (float) $totalExpense,
            ],
            'recentTransactions' => $recentTransactions,
            'urgentWishlists'    => $urgentWishlists,
            'monthlyTrends'      => $monthlyTrends,
            'categoryData'       => $categoryData,
        ]);
    })->name('dashboard');

    Route::get('report', function (Request $request) {
        // Default range adalah '1_month'
        $range = $request->query('range', '1_month');
        $startDate = Carbon::now();

        // Tentukan tanggal mulai berdasarkan filter range
        switch ($range) {
            case '1_week':
                $startDate = Carbon::now()->subDays(6)->startOfDay();
                $label = "1 Minggu Terakhir";
                break;
            case '6_months':
                $startDate = Carbon::now()->subMonths(5)->startOfMonth();
                $label = "6 Bulan Terakhir";
                break;
            case '1_year':
                $startDate = Carbon::now()->subYears(1)->startOfMonth();
                $label = "1 Tahun Terakhir";
                break;
            case '1_month':
            default:
                $startDate = Carbon::now()->startOfMonth();
                $label = "Bulan Ini";
                break;
        }

        // 1. Hitung total pemasukan dan pengeluaran pada periode terpilih
        $totalIncome = Transaction::where('type', 'income')
            ->where('transaction_date', '>=', $startDate)
            ->sum('amount');

        $totalExpense = Transaction::where('type', 'expense')
            ->where('transaction_date', '>=', $startDate)
            ->sum('amount');

        $netSavings = $totalIncome - $totalExpense;

        // 2. Rekap pengeluaran per kategori pada periode tersebut
        $categorySummary = Transaction::where('type', 'expense')
            ->where('transaction_date', '>=', $startDate)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderBy('total', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'total' => (float) $item->total,
                ];
            });

        // 3. Ambil daftar transaksi yang terjadi di dalam rentang waktu tersebut
        $transactions = Transaction::with(['wishlist', 'wallet'])
            ->where('transaction_date', '>=', $startDate)
            ->orderBy('transaction_date', 'desc')
            ->get();

        return Inertia::render('transaction/ReportView', [
            'report' => [
                'range' => $range,
                'label' => $label,
                'total_income' => (float) $totalIncome,
                'total_expense' => (float) $totalExpense,
                'net_savings' => (float) $netSavings,
            ],
            'categorySummary' => $categorySummary,
            'transactions' => $transactions,
        ]);
    })->name('transaction.report');

    Route::resource('/wallet', WalletController::class);
    Route::post('/update-fcm-token', [NotificationController::class, 'updateToken'])->name('fcm.update');
    Route::post('/toggle-notification', [NotificationController::class, 'toggleNotification'])->name('fcm.toggle');
    Route::get('/test-notification', [NotificationController::class, 'testSendNotification'])->name('fcm.test');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/wishlist.php';
require __DIR__ . '/transaction.php';
