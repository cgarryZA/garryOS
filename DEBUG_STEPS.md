# Quick Debug Commands for Windows

## Check if containers are actually running:
```cmd
docker ps
```

## Check backend logs (MOST IMPORTANT):
```cmd
cd C:\Users\Christian\Documents\garryOS\infra
docker-compose logs backend
```

## Check if backend is listening inside container:
```cmd
docker exec homeos-backend curl http://localhost:8000/health
```

## Check port mappings:
```cmd
docker port homeos-backend
```

## Restart backend with logs visible:
```cmd
docker-compose restart backend
docker-compose logs -f backend
```

## If migrations failed, run them manually:
```cmd
docker exec homeos-backend alembic upgrade head
```

## Check database connection:
```cmd
docker exec homeos-postgres pg_isready
```

## Full nuclear reset:
```cmd
docker-compose down -v
docker-compose up -d --build
docker-compose logs -f
```
