const CACHE_NAME = "broke-buddy-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


/* ================= INSTALL ================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            })
            .then(() => {

                return self.skipWaiting();

            })

    );

});


/* ================= ACTIVATE ================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(
                            name =>
                                name !== CACHE_NAME
                        )
                        .map(
                            name =>
                                caches.delete(name)
                        )

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


/* ================= FETCH ================= */

self.addEventListener("fetch", event => {

    const request =
        event.request;

    /* Only handle GET requests */
    if (request.method !== "GET") {
        return;
    }


    /* Only cache our own app files */
    const url =
        new URL(request.url);

    if (
        url.origin !==
        self.location.origin
    ) {
        return;
    }


    event.respondWith(

        fetch(request)
            .then(response => {

                if (
                    response &&
                    response.status === 200
                ) {

                    const responseClone =
                        response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {

                            cache.put(
                                request,
                                responseClone
                            );

                        });

                }

                return response;

            })
            .catch(() => {

                return caches.match(request);

            })

    );

});