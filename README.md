# filesharingportal

running http at port 3000

```
--env=MINIO_ENDPOINT=your.minio.endpoint
--env=MINIO_PORT=443
--env=MINIO_USE_SSL=TRUE
--env=MINIO_ACCESS_KEY=your-token
--env=MINIO_SECRET_KEY=your-key
--env=MINIO_BUCKET=your-bucket-name
--env=BASE_URLS=comma.separated/temp,urls.for,multiple.base.url,
```
optional if you use cf zero trust
```
--env=CF_TUNNEL_KEY=your-cf-tunnel-key
```
otherwize it will create random cf url for you, please looking for console output e.g.
```
2023-03-10 10:49:20 2023-03-10T15:49:20Z INF +--------------------------------------------------------------------------------------------+
2023-03-10 10:49:20 2023-03-10T15:49:20Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2023-03-10 10:49:20 2023-03-10T15:49:20Z INF |  https://jesse-http-controllers-investigate.trycloudflare.com                              |
2023-03-10 10:49:20 2023-03-10T15:49:20Z INF +--------------------------------------------------------------------------------------------+
```
