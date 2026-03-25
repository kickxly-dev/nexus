# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for Nexus Security Toolkit backend
# Run from /backend:  pyinstaller nexus.spec

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=[],  # Data files (wordlists) are kept separate alongside the exe
    hiddenimports=[
        # FastAPI / Uvicorn internals
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.loops.asyncio',
        'uvicorn.loops.uvloop',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.http.httptools_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.protocols.websockets.websockets_impl',
        'uvicorn.protocols.websockets.wsproto_impl',
        'uvicorn.lifespan',
        'uvicorn.lifespan.off',
        'uvicorn.lifespan.on',
        'fastapi',
        'starlette',
        'starlette.middleware',
        'starlette.middleware.cors',
        'starlette.responses',
        'starlette.routing',
        'anyio',
        'anyio.abc',
        'anyio._backends._asyncio',
        'anyio._backends._trio',
        # DNS
        'dns',
        'dns.asyncresolver',
        'dns.resolver',
        'dns.rdatatype',
        'dns.rdataclass',
        'dns.name',
        'dns.flags',
        # HTTP
        'httpx',
        'httpcore',
        'h11',
        # HTML parsing
        'bs4',
        'html.parser',
        # Nmap
        'nmap',
        # WHOIS
        'whois',
        # Scapy
        'scapy',
        'scapy.layers',
        'scapy.layers.inet',
        'scapy.layers.l2',
        # Crypto / hashing
        'hashlib',
        'hmac',
        'passlib',
        'passlib.hash',
        # Stdlib extras
        'email.mime',
        'email.mime.text',
        'logging.handlers',
        'multiprocessing',
        'multiprocessing.util',
        'encodings',
        'encodings.utf_8',
        'encodings.ascii',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas', 'PIL', 'test', 'unittest'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='nexus-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,   # Keep console=True so stdout (READY:<port>) is readable by Electron
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
