# Setup Troubleshooting

## GitHub CLI Missing

Phase 7 publishing was blocked because the `gh` command was not available in PowerShell.

Install and authenticate GitHub CLI before retrying the commit/push/PR update flow:

```powershell
winget install --id GitHub.cli
gh auth login
gh auth status
```
