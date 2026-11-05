<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;

class WdxPlugin extends Plugin
{
    public static function getSubscribedEvents(): array
    {
        return ['onTwigSiteVariables' => ['context', 0], 'onPagesInitialized' => ['feeds', 0]];
    }

    private function posts(): array
    {
        $journal = $this->grav['pages']->find('/journal');
        if (!$journal || !$journal->published()) { return []; }
        $posts = [];
        foreach ($journal->children() as $entry) {
            if ($entry->template() === 'item' && $entry->published() && $entry->routable()) { $posts[] = $entry; }
        }
        usort($posts, fn($a, $b) => $b->date() <=> $a->date() ?: strcmp($a->slug(), $b->slug()));
        return $posts;
    }

    public function context(): void
    {
        if ($this->isAdmin()) { return; }
        $posts = $this->posts();
        $this->grav['twig']->twig_vars['wdx_posts'] = $posts;
        $tags = [];
        foreach ($posts as $entry) { foreach (($entry->taxonomy()['tag'] ?? []) as $tag) { $tags[(string)$tag] = true; } }
        $this->grav['twig']->twig_vars['wdx_tags'] = array_keys($tags);
        $topic = $this->grav['uri']->query('tag');
        $this->grav['twig']->twig_vars['wdx_topic'] = is_string($topic) ? $topic : '';
    }

    public function feeds(): void
    {
        if ($this->isAdmin()) { return; }
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $base = rtrim((string)$this->grav['base_url'], '/');
        $route = $base !== '' && str_starts_with($path, $base . '/') ? substr($path, strlen($base)) : $path;
        if (!in_array($route, ['/journal.json', '/rss.xml', '/llms.txt', '/sitemap.xml'], true)) { return; }
        $origin = rtrim($this->config->get('site.production_url'), '/');
        $items = array_map(fn($entry) => [
            'title' => $entry->title(),
            'description' => (string)($entry->header()->summary ?? ''),
            'date' => gmdate(DATE_ATOM, $entry->date()),
            'url' => $origin . $entry->url(),
            'tags' => $entry->taxonomy()['tag'] ?? [],
        ], $this->posts());
        if ($route === '/journal.json') {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($items, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } elseif ($route === '/llms.txt') {
            header('Content-Type: text/plain; charset=utf-8');
            echo "# WOWK DIGITAL X\n\nIndependent digital studio.\n\n- Home: $origin/\n- Journal: $origin/journal\n- Lab: $origin/#lab\n- Public metadata: $origin/journal.json\n\n";
            foreach ($items as $item) { echo '- ' . str_replace(["\r", "\n"], ' ', $item['title']) . ': ' . $item['url'] . "\n"; }
        } else {
            $escape = fn($value) => htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
            header('Content-Type: application/xml; charset=utf-8');
            echo '<?xml version="1.0" encoding="UTF-8"?>';
            if ($route === '/sitemap.xml') {
                echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
                foreach (array_merge([$origin . '/', $origin . '/journal'], array_column($items, 'url')) as $url) { echo '<url><loc>' . $escape($url) . '</loc></url>'; }
                echo '</urlset>';
            } else {
                echo '<rss version="2.0"><channel><title>WOWK DIGITAL X Journal</title><link>' . $escape($origin . '/journal') . '</link><description>Notes and visual experiments.</description>';
                foreach ($items as $item) { echo '<item><title>' . $escape($item['title']) . '</title><description>' . $escape($item['description']) . '</description><link>' . $escape($item['url']) . '</link><guid>' . $escape($item['url']) . '</guid><pubDate>' . gmdate(DATE_RSS, strtotime($item['date'])) . '</pubDate></item>'; }
                echo '</channel></rss>';
            }
        }
        exit;
    }
}
