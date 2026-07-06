<?php

namespace App\Helpers;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Messaging\WebPushConfig;
use Kreait\Firebase\Messaging\ApnsConfig;

class NotificationHelper
{
    public static function sendToUser(int $userId, string $title, string $body, string $actionUrl = '/dashboard')
    {
        $user = User::find($userId);

        if (!$user || !$user->fcm_token || !$user->is_notification_enabled) {
            return false;
        }

        $messaging = app('firebase.messaging');

        $webPushConfig = WebPushConfig::fromArray([
            'notification' => [
                'title' => $title,
                'body' => $body,
                'icon' => '/assets/logo.png',
            ],
            'fcm_options' => [
                'link' => $actionUrl,
            ],
        ]);

        $apnsConfig = ApnsConfig::fromArray([
            'payload' => [
                'aps' => [
                    'sound' => 'default',
                    'badge' => 1,
                ],
            ],
        ]);

        $message = CloudMessage::withTarget('token', $user->fcm_token)
            ->withNotification(Notification::create($title, $body))
            ->withData(['action_url' => $actionUrl])
            ->withWebPushConfig($webPushConfig)
            ->withApnsConfig($apnsConfig);

        try {
            $messaging->send($message);
            return true;
        } catch (\Exception $e) {

            if (str_contains($e->getMessage(), 'InvalidRegistrationToken')) {
                $user->update(['fcm_token' => null]);
            }

            Log::error('FCM Helper Error: ' . $e->getMessage());
            return false;
        }
    }
}
