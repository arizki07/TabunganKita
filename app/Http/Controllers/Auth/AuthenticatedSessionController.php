<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialUserEntity;
use Webauthn\AuthenticatorSelectionCriteria;
use Webauthn\PublicKeyCredentialParameters;
use Webauthn\AuthenticationExtensions\AuthenticationExtensionsClientInputs;
use ParagonIE\ConstantTime\Base64UrlSafe;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function getRegistrationOptions(Request $request)
    {
        $user = $request->user();

        $rpEntity = new PublicKeyCredentialRpEntity('TabunganKita', 'tabungankita.ahmadrizki.my.id');

        $userEntity = new PublicKeyCredentialUserEntity(
            (string) $user->id,
            (string) $user->id,
            $user->name
        );

        $challenge = random_bytes(32);

        $creationOptions = new PublicKeyCredentialCreationOptions(
            $rpEntity,
            $userEntity,
            $challenge,
            [new PublicKeyCredentialParameters('public-key', -7)]
        );

        return response()->json([
            'challenge' => Base64UrlSafe::encodeUnpadded($challenge),
            'rpId' => 'tabungankita.ahmadrizki.my.id',
            'user' => [
                'id' => Base64UrlSafe::encodeUnpadded((string)$user->id),
                'name' => $user->email,
                'displayName' => $user->name,
            ],
            'pubKeyCredParams' => [
                ['type' => 'public-key', 'alg' => -7]
            ]
        ]);
    }

    public function verifyRegistration(Request $request)
    {
        $id = $request->input('id');
        $rawId = $request->input('rawId');
        $type = $request->input('type');
        $response = $request->input('response');

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $decodedPublicKey = "...";

        \App\Models\UserPublicKey::create([
            'user_id'       => $user->id,
            'credential_id' => $id,
            'public_key'    => $decodedPublicKey,
            'counter'       => 0,
        ]);

        $user->update([
            'is_biometric_enabled' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registrasi biometrik sukses dan telah aktif!'
        ]);
    }

    public function getLoginOptions(Request $request)
    {
        $user = \App\Models\User::where('email', $request->email)->firstOrFail();

        $allowedCredentials = $user->publicKeys()->get()->map(function ($key) {
            return ['type' => 'public-key', 'id' => base64_decode($key->credential_id)];
        })->toArray();

        return response()->json([
            'challenge' => \ParagonIE\ConstantTime\Base64UrlSafe::encodeUnpadded(random_bytes(32)),
            'rpId' => 'tabungankita.ahmadrizki.my.id',
            'allowCredentials' => $allowedCredentials,
        ]);
    }
}
