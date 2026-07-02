import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}) {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-5 p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col">
                <Link href={route('login')} className="mb-4 flex items-center gap-2 self-center font-medium">
                    <div className="flex h-35 w-35 items-center justify-center">
                        <img src="/assets/logo.png" alt="Logo TabunganKita" className="h-full w-full object-contain" />
                    </div>
                </Link>

                <div className="flex flex-col">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">{children}</CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
