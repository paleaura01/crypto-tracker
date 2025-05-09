export function load() {
    return {
        headers: {
            'Cache-Control': 'no-cache, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    };
}