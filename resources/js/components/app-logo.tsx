export default function AppLogo() {
    return (
        <>
            <div className="flex items-center gap-2 py-1">
                <img src="/assets/logo.png" alt="Logo TabunganKita" className="size-9 object-contain" />

                <div className="grid flex-1 text-left text-sm">
                    <span className="text-foreground truncate leading-none font-semibold">TabunganKita</span>
                </div>
            </div>
        </>
    );
}
