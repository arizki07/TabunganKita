<?php

namespace App\Http\Controllers;

use App\Helpers\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class NotificationController extends Controller
{
    public function updateToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        try {
            $user->update([
                'fcm_token' => $request->token
            ]);

            $waktuLogin = now()->timezone('Asia/Jakarta')->format('H:i') . ' WIB';

            $metodeSession = session('login_method', 'password');
            $namaMetode = ($metodeSession === 'biometric') ? 'Biometrik (FaceID/TouchID)' : 'Email & Password';

            $judulNotif = 'Peringatan Keamanan Akun 🛡️';
            $pesanNotif = 'Akun (' . $user->name . ') baru saja berhasil masuk menggunakan ' . $namaMetode . ' pada pukul ' . $waktuLogin . '.';

            $allBroadcastUsers = \App\Models\User::whereNotNull('fcm_token')->get();

            foreach ($allBroadcastUsers as $broadcastUser) {
                NotificationHelper::sendToUser(
                    $broadcastUser->id,
                    $judulNotif,
                    $pesanNotif,
                    '/dashboard'
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'FCM Token updated and broadcast login notification sent to all devices.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server Error'], 500);
        }
    }

    public function toggleNotification(Request $request)
    {
        $request->validate([
            'enabled' => 'required|boolean'
        ]);

        $user = auth()->user();

        // Update status toggle di database
        $user->is_notification_enabled = $request->enabled;

        // Jika user MEMATIKAN notifikasi, hapus juga fcm_token-nya demi keamanan
        if (!$request->enabled) {
            $user->fcm_token = null;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => $request->enabled ? 'Notifikasi diaktifkan.' : 'Notifikasi dimatikan.'
        ]);
    }

    /**
     * Endpoint Sementara untuk Uji Coba Kirim Notifikasi ke Diri Sendiri
     */
    public function testSendNotification()
    {
        $user = Auth::user();

        // Pastikan user memiliki token
        if (!$user->fcm_token) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak memiliki FCM Token. Silakan refresh halaman frontend Anda.'
            ], 400);
        }

        // Inisialisasi Firebase Messaging
        $messaging = app('firebase.messaging');

        // Buat struktur notifikasi
        $message = CloudMessage::withTarget('token', $user->fcm_token)
            ->withNotification(Notification::create(
                'Halo ' . $user->name . '!', // Judul Notifikasi
                'Ini adalah uji coba push notification Firebase pertama Anda!' // Isi Notifikasi
            ))
            ->withData([
                'action_url' => '/dashboard',
                'timestamp' => now()->toDateTimeString()
            ]);

        try {
            // Kirim ke FCM Server
            $messaging->send($message);

            return response()->json([
                'success' => true,
                'message' => 'Notifikasi berhasil dikirim!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim notifikasi: ' . $e->getMessage()
            ], 500);
        }
    }
}
