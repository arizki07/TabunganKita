<?php

namespace App\Helpers;

use App\Models\User;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class NotificationHelper
{
    /**
     * Fungsi Inti untuk mengirim notifikasi ke User tertentu
     */
    public static function sendToUser($userId, string $title, string $body, string $actionUrl = '/dashboard')
    {
        $user = User::find($userId);

        // Jika user tidak ditemukan atau fcm_token kosong, batalkan pengiriman
        if (!$user || !$user->fcm_token || !$user->is_notification_enabled) {
            return false; // Batalkan kirim jika user mematikan notifikasi
        }

        $messaging = app('firebase.messaging');

        $message = CloudMessage::withTarget('token', $user->fcm_token)
            ->withNotification(Notification::create($title, $body))
            ->withData([
                'action_url' => $actionUrl,
                'click_action' => $actionUrl, // Cadangan untuk beberapa jenis device browser
            ]);

        try {
            $messaging->send($message);
            return true;
        } catch (\Exception $e) {
            \Log::error('FCM Helper Error: ' . $e->getMessage());
            return false;
        }
    }
}
