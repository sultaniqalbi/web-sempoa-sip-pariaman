<?php

namespace App\Core;

use App\Core\Router;
use App\Core\Container;
use App\Database\Connection;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class Application
{
    private Container $container;
    private Router $router;
    private Logger $logger;

    public function __construct()
    {
        $this->container = Container::getInstance();
        $this->setupServices();
    }

    private function setupServices(): void
    {
        // Singleton Logger
        $this->container->singleton(Logger::class, function () {
            $logger = new Logger('app');
            $logPath = defined('STORAGE_PATH') ? STORAGE_PATH . '/logs/app.log' : APP_ROOT . '/storage/logs/app.log';
            $logger->pushHandler(new StreamHandler($logPath, Logger::DEBUG));
            return $logger;
        });

        // Singleton Database Connection
        $this->container->singleton('db', function () {
            $config = Config::get('database');
            return new Connection(
                $config['driver'] ?? 'mysql',
                $config['host'] ?? 'localhost',
                $config['port'] ?? 3306,
                $config['database'] ?? 'sempoa_sip',
                $config['username'] ?? 'root',
                $config['password'] ?? '',
                $config['options'] ?? []
            );
        });
        $this->container->singleton(Connection::class, function () {
            return $this->container->get('db');
        });

        // Singleton Router
        $this->container->singleton('router', function () {
            return new Router($this->container);
        });

        $this->router = $this->container->get('router');
        $this->logger = $this->container->get(Logger::class);

        $this->registerRepositories();
        $this->registerServices();
        $this->registerMiddleware();
        $this->registerRoutes();
    }

    private function registerRepositories(): void
    {
        $repositories = [
            'user' => \App\Repositories\UserRepository::class,
            'siswa' => \App\Repositories\SiswaRepository::class,
            'guru' => \App\Repositories\GuruRepository::class,
            'absensi' => \App\Repositories\AbsensiRepository::class,
            'galeri' => \App\Repositories\GaleriRepository::class,
            'pembayaran' => \App\Repositories\PembayaranRepository::class,
            'jadwal' => \App\Repositories\JadwalRepository::class,
        ];

        foreach ($repositories as $name => $class) {
            if (class_exists($class)) {
                $instanceClosure = function () use ($class) {
                    return new $class($this->container->get(Connection::class));
                };
                $this->container->singleton($name, $instanceClosure);
                $this->container->singleton($class, $instanceClosure);
            }
        }
    }

    private function registerServices(): void
    {
        $services = [
            'auth' => \App\Services\AuthService::class,
            'siswa' => \App\Services\SiswaService::class,
            'guru' => \App\Services\GuruService::class,
            'absensi' => \App\Services\AbsensiService::class,
            'galeri' => \App\Services\GaleriService::class,
            'pembayaran' => \App\Services\PembayaranService::class,
            'jadwal' => \App\Services\JadwalService::class,
        ];

        foreach ($services as $name => $class) {
            if (class_exists($class)) {
                $serviceClosure = function () use ($class) {
                    return $this->container->build($class);
                };
                $this->container->bind($name, $serviceClosure);
                $this->container->bind($class, $serviceClosure);
            }
        }
    }

    private function registerMiddleware(): void
    {
        if (class_exists(\App\Middleware\AuthMiddleware::class)) {
            $this->router->registerMiddleware('auth', \App\Middleware\AuthMiddleware::class);
        }
        if (class_exists(\App\Middleware\RoleMiddleware::class)) {
            $this->router->registerMiddleware('role', \App\Middleware\RoleMiddleware::class);
        }
    }

    private function registerRoutes(): void
    {
        // ============== Public Web Routes ==============
        $this->router->get('/', 'Web\HomeController@index');
        $this->router->get('/program/:slug', 'Web\ProgramController@show');
        $this->router->get('/galeri-view', 'Web\GaleriController@index');

        // ============== Auth Routes ==============
        $this->router->get('/login', 'Auth\AuthController@loginForm');
        $this->router->post('/login', 'Auth\AuthController@login');
        $this->router->get('/register', 'Auth\AuthController@registerForm');
        $this->router->post('/register', 'Auth\AuthController@register');
        $this->router->post('/logout', 'Auth\AuthController@logout');

        // ============== Dedicated RFID Hardware Endpoint ==============
        $this->router->get('/api/absensi/rfid', 'Api\AbsensiController@rfidTap');
        $this->router->post('/api/absensi/rfid', 'Api\AbsensiController@rfidTap');
        $this->router->get('/api/ping', 'Api\AbsensiController@ping');

        // ============== Auth & Data API Routes ==============
        $this->router->post('/api/login', 'Api\AuthController@login');
        $this->router->post('/api/register', 'Api\AuthController@register');
        $this->router->post('/api/logout', 'Api\AuthController@logout');

        $this->router->get('/api/absensi', 'Api\AbsensiController@index');
        $this->router->post('/api/absensi', 'Api\AbsensiController@store');

        $this->router->get('/api/galeri', 'Api\GaleriController@index');
        $this->router->post('/api/galeri', 'Api\GaleriController@store');
        $this->router->delete('/api/galeri/:id', 'Api\GaleriController@destroy');

        $this->router->get('/api/siswa', 'Api\SiswaController@index');
        $this->router->post('/api/siswa', 'Api\SiswaController@store');

        $this->router->get('/api/pembayaran', 'Api\PembayaranController@index');
        $this->router->post('/api/pembayaran', 'Api\PembayaranController@store');

        // ============== Admin Routes ==============
        $this->router->group('/admin', ['middleware' => 'auth,role:admin,owner'], function ($router) {
            $router->get('/dashboard', 'Admin\DashboardController@index');
            $router->get('/siswa', 'Admin\SiswaController@index');
            $router->get('/guru', 'Admin\GuruController@index');
            $router->get('/absensi', 'Admin\AbsensiController@index');
            $router->get('/pembayaran', 'Admin\PembayaranController@index');
            $router->get('/keuangan', 'Admin\KeuanganController@index');
            $router->get('/galeri', 'Admin\GaleriController@index');
            $router->get('/jadwal', 'Admin\JadwalController@index');
            $router->get('/riwayat', 'Admin\RiwayatController@index');
        });

        // ============== Owner Routes ==============
        $this->router->group('/owner', ['middleware' => 'auth,role:owner'], function ($router) {
            $router->get('/dashboard', 'Owner\DashboardController@index');
            $router->get('/keuangan', 'Owner\KeuanganController@index');
            $router->get('/siswa', 'Owner\SiswaController@index');
            $router->get('/guru', 'Owner\GuruController@index');
            $router->get('/jadwal', 'Owner\JadwalController@index');
            $router->get('/riwayat', 'Owner\RiwayatController@index');
        });

        // ============== Guru Routes ==============
        $this->router->group('/guru', ['middleware' => 'auth,role:guru'], function ($router) {
            $router->get('/dashboard', 'Guru\DashboardController@index');
            $router->get('/absensi', 'Guru\AbsensiController@index');
            $router->get('/kelas', 'Guru\KelasController@index');
        });

        // ============== Orang Tua Routes ==============
        $this->router->group('/ortu', ['middleware' => 'auth,role:ortu'], function ($router) {
            $router->get('/dashboard', 'Ortu\DashboardController@index');
            $router->get('/anak', 'Ortu\AnakController@index');
            $router->get('/pembayaran', 'Ortu\PembayaranController@index');
        });
    }

    public function get(string $key)
    {
        return $this->container->get($key);
    }

    public function getRouter(): Router
    {
        return $this->router;
    }

    public function getLogger(): Logger
    {
        return $this->logger;
    }

    public function getContainer(): Container
    {
        return $this->container;
    }
}
