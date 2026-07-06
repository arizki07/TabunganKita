<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function toggleBiometric(Request $request)
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        /** @var \App\Models\User|\Illuminate\Contracts\Auth\Authenticatable $user */
        $user = Auth::user();

        // Memeriksa apakah user sudah punya data public key terdaftar sebelum mengaktifkan
        // Jika Intelephense masih garis merah, kita panggil sebagai property collection atau gunakan check manual
        $hasKeys = \App\Models\UserPublicKey::where('user_id', $user->id)->exists();

        if ($request->enabled && !$hasKeys) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan lakukan registrasi biometrik terlebih dahulu.'
            ], 400);
        }

        $user->update([
            'is_biometric_enabled' => $request->enabled
        ]);

        return response()->json([
            'success' => true,
            'message' => $request->enabled ? 'Biometrik diaktifkan.' : 'Biometrik dinonaktifkan.'
        ]);
    }
}
