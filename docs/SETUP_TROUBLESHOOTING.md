# Setup Troubleshooting

## Missing Node.js or npm

Symptoms:

- `npm : The term 'npm' is not recognized as the name of a cmdlet, function, script file, or operable program.`
- `npx : The term 'npx' is not recognized as the name of a cmdlet, function, script file, or operable program.`

Required action: install Node.js 20.x or newer and make sure `node`, `npm`, and `npx` are available on `PATH`.

### Windows

1. Install Node.js 20 LTS from `https://nodejs.org/`.
2. Open a new PowerShell window.
3. Verify:

```powershell
node --version
npm --version
npx --version
```

Alternative with winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

### macOS

Using Homebrew:

```bash
brew install node@20
node --version
npm --version
npx --version
```

### Linux

Using NodeSource on Debian/Ubuntu:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
npx --version
```

## PostgreSQL or Redis Not Running

If commands fail because PostgreSQL or Redis is unavailable, use the local Docker Compose services:

```bash
docker compose up -d
docker ps
```

Do not commit local `.env` files or real secrets.
