import { Head, router, useForm } from '@inertiajs/react';
import { Fingerprint, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import axios from 'axios';
interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });
    const [biometricLoading, setBiometricLoading] = useState(false);

    const handleBiometricLogin = async () => {
        setBiometricLoading(true);
        try {
            const { data: options } = await axios.post('/webauthn/login/options');

            const bufferFromBase64Url = (base64url: string) => {
                const padded = base64url.replace(/-/g, '+').replace(/_/g, '/');
                const binary = window.atob(padded);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return bytes.buffer;
            };

            const base64UrlFromBuffer = (buffer: ArrayBuffer) => {
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            };

            const challengeBuffer = bufferFromBase64Url(options.challenge);

            const allowCredentials = options.allowCredentials.map((cred: any) => ({
                type: cred.type,
                id: bufferFromBase64Url(cred.id),
            }));

            const assertion = (await navigator.credentials.get({
                publicKey: {
                    challenge: challengeBuffer,
                    allowCredentials: allowCredentials,
                    userVerification: 'required',
                    rpId: options.rpId,
                },
            })) as PublicKeyCredential | null;

            if (!assertion) throw new Error('Login dibatalkan');

            const response = assertion.response as AuthenticatorAssertionResponse;

            const verifyData = {
                id: assertion.id,
                rawId: base64UrlFromBuffer(assertion.rawId),
                type: assertion.type,
                response: {
                    clientDataJSON: base64UrlFromBuffer(response.clientDataJSON),
                    authenticatorData: base64UrlFromBuffer(response.authenticatorData),
                    signature: base64UrlFromBuffer(response.signature),
                    userHandle: response.userHandle ? base64UrlFromBuffer(response.userHandle) : null,
                },
            };

            const verifyResponse = await axios.post('/webauthn/login/verify', verifyData);

            if (verifyResponse.data.success) {
                router.visit(route('dashboard'));
            }
        } catch (err) {
            console.error('Login FaceID gagal:', err);
            alert('Login biometrik gagal. Pastikan akun Anda sudah terdaftar biometrik di perangkat ini.');
        } finally {
            setBiometricLoading(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember" name="remember" tabIndex={3} />
                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Log in
                    </Button>
                    {/* Tombol Biometrik */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2">Atau</span>
                        </div>
                    </div>

                    <Button type="button" variant="outline" className="w-full gap-2" onClick={handleBiometricLogin} disabled={biometricLoading}>
                        {biometricLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                        Login dengan FaceID
                    </Button>
                </div>

                {/* <div className="text-muted-foreground text-center text-sm">
                    Don't have an account?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Sign up
                    </TextLink>
                </div> */}
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
