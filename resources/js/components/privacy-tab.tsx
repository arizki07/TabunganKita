import { cn } from '@/lib/utils';
import axios from 'axios';
import { Bell, Fingerprint } from 'lucide-react';
import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PrivacyTab({ className = '', auth, ...props }: any) {
    const [isNotifEnabled, setIsNotifEnabled] = useState<boolean>(auth?.user?.is_notification_enabled ?? true);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(auth?.user?.is_biometric_enabled ?? false);

    const handleNotifToggle = () => {
        const newValue = !isNotifEnabled;
        setIsNotifEnabled(newValue);
        axios.post('/toggle-notification', { enabled: newValue }).catch(() => setIsNotifEnabled(!newValue));
    };
    const handleBiometricToggle = async () => {
        // 1. Jika User ingin MEMATIKAN
        if (isBiometricEnabled) {
            try {
                await axios.post('/toggle-biometric', { enabled: false });
                setIsBiometricEnabled(false);
            } catch (err) {
                console.error('Gagal menonaktifkan:', err);
            }
            return;
        }

        // 2. Jika User ingin MENGAKTIFKAN
        try {
            const { data: options } = await axios.get('/webauthn/register/options');

            // Decode base64 dari server ke bentuk Uint8Array yang dibutuhkan browser
            const challenge = Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
            const userId = Uint8Array.from(atob(options.user.id.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

            const credential = (await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: { name: 'TabunganKita', id: options.rpId || window.location.hostname },
                    user: { id: userId, name: options.user.name, displayName: options.user.displayName },
                    pubKeyCredParams: options.pubKeyCredParams,
                    authenticatorSelection: {
                        userVerification: 'required',
                        authenticatorAttachment: 'platform', // Memaksa FaceID/TouchID bawaan device, bukan USB Key external
                    },
                    timeout: 60000,
                },
            })) as PublicKeyCredential | null;

            if (!credential) throw new Error('Pendaftaran dibatalkan');

            const response = credential.response as AuthenticatorAttestationResponse;

            // Encode kembali array buffer ke base64 agar bisa dikirim via JSON ke Laravel
            const credentialData = {
                id: credential.id,
                rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
                type: credential.type,
                response: {
                    clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
                    attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
                },
            };

            // Kirim ke server untuk diverifikasi sekaligus mengaktifkan status is_biometric_enabled
            await axios.post('/webauthn/register/verify', credentialData);

            setIsBiometricEnabled(true);
            alert('FaceID / Biometrik berhasil diaktifkan!');
        } catch (err) {
            console.error('FaceID gagal:', err);
            alert('FaceID gagal. Pastikan perangkat Anda mendukung biometrik atau Anda tidak membatalkan proses.');
        }
    };
    return (
        <div className={cn('w-full', className)} {...props}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Kartu Notifikasi */}
                <div className="bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30">
                            <Bell size={24} />
                        </div>
                        <div className="flex-1">
                            <span className="text-foreground block text-sm font-bold">Notifikasi Transaksi</span>
                            <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                                Dapatkan pemberitahuan instan setiap kali ada mutasi saldo atau aktivitas di akun Anda.
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
                        <span className="text-xs font-medium text-neutral-500">{isNotifEnabled ? 'Fitur Aktif' : 'Fitur Nonaktif'}</span>
                        <ToggleButton enabled={isNotifEnabled} onClick={handleNotifToggle} />
                    </div>
                </div>

                {/* Kartu Biometrik */}
                <div className="bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30">
                            <Fingerprint size={24} />
                        </div>
                        <div className="flex-1">
                            <span className="text-foreground block text-sm font-bold">Login Biometrik</span>
                            <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                                Masuk ke aplikasi lebih aman dan cepat menggunakan FaceID atau sidik jari perangkat Anda.
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
                        <span className="text-xs font-medium text-neutral-500">{isBiometricEnabled ? 'Fitur Aktif' : 'Fitur Nonaktif'}</span>
                        <ToggleButton enabled={isBiometricEnabled} onClick={handleBiometricToggle} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Komponen Pembantu Toggle
const ToggleButton = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
            enabled ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-700',
        )}
    >
        <span
            className={cn(
                'pointer-events-none h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                enabled ? 'translate-x-5' : 'translate-x-0',
            )}
        />
    </button>
);
