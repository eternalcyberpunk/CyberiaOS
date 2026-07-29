# CyberiaOS

## Unpack `eternalcyberia-repo.zip`

Run:

```bash
python3 unpack_zip.py
```

By default, the script waits until the zip file exists and unpacks it automatically once detected.

Optional flags:

- `--zip` to point to a different archive path
- `--out` to choose a different extraction directory
- `--no-wait` to fail immediately if the zip is missing
- `--interval` to control how often detection is checked while waiting