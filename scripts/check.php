<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use Symfony\Component\Yaml\Yaml;

$root = dirname(__DIR__);
$required = ['curl','ctype','dom','gd','json','mbstring','openssl','session','simplexml','zip'];
foreach ($required as $extension) {
    if (!extension_loaded($extension)) { throw new RuntimeException("Missing PHP extension: $extension"); }
}
if (version_compare(PHP_VERSION, '8.3.11', '<')) { throw new RuntimeException('PHP 8.3.11+ is required.'); }
$count = 0;
foreach (['user/config', 'user/themes/wdx', 'user/plugins/wdx'] as $folder) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/' . $folder));
    foreach ($iterator as $file) {
        if ($file->getExtension() === 'yaml' && $file->getSize() > 0) { Yaml::parseFile($file->getPathname()); $count++; }
    }
}
$loader = new Twig\Loader\FilesystemLoader($root . '/user/themes/wdx/templates');
$twig = new Twig\Environment($loader);
foreach (['url','asset'] as $function) { $twig->addFunction(new Twig\TwigFunction($function, fn() => '')); }
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/user/themes/wdx/templates'));
foreach ($iterator as $file) {
    if (str_ends_with($file->getFilename(), '.twig')) { $twig->parse($twig->tokenize(new Twig\Source(file_get_contents($file->getPathname()), $file->getFilename()))); }
}
echo "PHP requirements, $count YAML files and all WDX Twig templates verified.\n";
