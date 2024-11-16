// functions/_middleware.js
import largeGames from '../data/large.json';

// Create a map of game directories for faster lookup
const LARGE_GAME_DIRS = new Map(
  largeGames.map(game => [game.directory, true])
);

export async function onRequest({ request, env, next }) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Check if this is a request for a game file
    if (path.startsWith('/semag/')) {
        // Extract the game directory name
        const parts = path.split('/');
        const gameDir = parts[2]; // '/semag/gamedirectory/file' -> 'gamedirectory'

        // Check if this is a large game that should be served from R2
        if (LARGE_GAME_DIRS.has(gameDir)) {
            try {
                // Remove leading slash for R2 key
                const r2Key = path.substring(1);
                
                // Get the file from R2
                const object = await env.GAMES.get(r2Key);

                if (object === null) {
                    return new Response('Game file not found', { status: 404 });
                }

                // Get the file's content type
                const contentType = object.httpMetadata?.contentType || 
                                getContentType(path);

                // Return the R2 object with appropriate headers
                return new Response(object.body, {
                    headers: {
                        'content-type': contentType,
                        'cache-control': 'public, max-age=31536000',
                        'access-control-allow-origin': '*'
                    }
                });
            } catch (error) {
                console.error('R2 fetch error:', error);
                return new Response('Error fetching game file', { status: 500 });
            }
        }
    }

    // If not a large game or not a game request, let Pages handle it
    return next();
}

// Helper function to determine content type based on file extension
function getContentType(path) {
    const ext = path.split('.').pop().toLowerCase();
    const contentTypes = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'webp': 'image/webp',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ttf': 'font/ttf',
        'otf': 'font/otf',
        'woff': 'font/woff',
        'woff2': 'font/woff2'
    };
    return contentTypes[ext] || 'application/octet-stream';
}
