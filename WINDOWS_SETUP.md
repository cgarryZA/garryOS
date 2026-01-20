# Windows Setup Guide for HomeOS

## Prerequisites

1. **Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop/
   - Make sure it's running before starting HomeOS

2. **Git for Windows** (if cloning the repo)
   - Download: https://git-scm.com/download/win

## Starting HomeOS on Windows

You have **3 options** to start HomeOS on Windows:

### Option 1: PowerShell Script (Recommended)

1. Open **PowerShell** as Administrator
2. Navigate to the project directory:
   ```powershell
   cd C:\path\to\garryOS
   ```
3. Run the PowerShell script:
   ```powershell
   .\scripts\start-dev.ps1
   ```

   **Note:** If you get an execution policy error, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Option 2: Batch File

1. Open **Command Prompt**
2. Navigate to the project directory:
   ```cmd
   cd C:\path\to\garryOS
   ```
3. Run the batch file:
   ```cmd
   scripts\start-dev.bat
   ```

### Option 3: Manual Docker Compose

1. Open **Command Prompt** or **PowerShell**
2. Navigate to the project directory:
   ```cmd
   cd C:\path\to\garryOS
   ```
3. Copy the environment file:
   ```cmd
   copy .env.example .env
   ```
4. Start the services:
   ```cmd
   cd infra
   docker-compose up -d --build
   ```

## Accessing HomeOS

Once started, open your browser and visit:

- **Frontend (UI)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Stopping HomeOS

### Using Scripts
The scripts will show you the stop command when they finish.

### Manual Stop
```cmd
cd C:\path\to\garryOS\infra
docker-compose down
```

## Viewing Logs

To see what's happening in the background:

```cmd
cd C:\path\to\garryOS\infra
docker-compose logs -f
```

Press `Ctrl+C` to stop viewing logs.

## Troubleshooting

### "Docker is not running"
- Start Docker Desktop
- Wait for it to fully start (whale icon in system tray should be steady, not animated)
- Try again

### "Port already in use"
Another service is using ports 3000, 8000, 5432, or 6379. Stop that service or change ports in `infra/docker-compose.yml`.

### "Permission denied"
Run PowerShell or Command Prompt as **Administrator**.

### Database issues
Reset the database:
```cmd
cd C:\path\to\garryOS\infra
docker-compose down -v
docker-compose up -d --build
```

**Warning:** This deletes all data!

## Next Steps

1. Visit http://localhost:3000 to access the HomeOS UI
2. Navigate to **Degree Tracker** to set up your academic tracking
3. Check out the API docs at http://localhost:8000/docs to see all available endpoints

## File Paths in Windows

When working with HomeOS on Windows, remember:
- Use backslashes `\` in file paths (e.g., `C:\Users\YourName\garryOS`)
- Or use forward slashes `/` which also work (e.g., `C:/Users/YourName/garryOS`)
- PowerShell supports both, Command Prompt prefers backslashes

## Development on Windows

If you're developing HomeOS on Windows:

1. **WSL2 Backend**: Docker Desktop uses WSL2 on Windows 10/11
   - This provides better performance
   - Make sure WSL2 is enabled in Docker Desktop settings

2. **File Watching**: Hot reload works on Windows but may be slower
   - Frontend changes will auto-reload
   - Backend changes will auto-reload

3. **Line Endings**: Git may convert line endings
   - Configure Git to preserve LF line endings:
     ```cmd
     git config --global core.autocrlf input
     ```

## Performance Tips

1. **Place project in WSL2 filesystem** for better performance:
   - Open Ubuntu/WSL2
   - Clone repo in WSL2 home directory
   - Access via `\\wsl$\Ubuntu\home\username\garryOS`

2. **Give Docker more resources**:
   - Open Docker Desktop Settings
   - Resources → Advanced
   - Increase CPU and Memory if you have resources available

## Support

If you encounter issues:
1. Check Docker Desktop is running
2. Check logs: `docker-compose logs -f`
3. Try resetting: `docker-compose down -v && docker-compose up -d --build`
