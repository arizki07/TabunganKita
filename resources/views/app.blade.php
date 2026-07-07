<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Nama Apk">

    <title inertia>{{ config('app.name', 'TabunganKita') }}</title>
    <link rel="icon" type="image/png" href="/assets/logo.png">
    <link rel="apple-touch-icon" href="/assets/logo.png">
    < <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/assets/logo.png">

        @routes
        @viteReactRefresh

        @vite(['resources/js/app.tsx'])

        @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
