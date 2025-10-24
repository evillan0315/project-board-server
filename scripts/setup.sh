#!/bin/bash
# ===============================================================
# FilePath: ~/scripts/install_asdf_full_ubuntu.sh
# Title: Full ASDF Installer with Dependencies (Ubuntu 20.04+)
# Reason: Install ASDF, required build tools, and setup Node.js
#         and Python automatically with global configuration.
# ===============================================================

set -e

echo "=== Step 1: Install system dependencies ==="
sudo apt update
sudo apt install -y \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    libffi-dev \
    liblzma-dev \
    tk-dev \
    libncurses5-dev \
    libncursesw5-dev \
    xz-utils \
    wget \
    curl \
    llvm \
    git \
    libgdbm-dev \
    libnss3-dev \
    libgdbm-compat-dev \
    libdb-dev \
    libexpat1-dev \
    libmpdec-dev \
    libuuid1 \
    uuid-dev \
    libedit-dev \
    libbluetooth-dev \
    bash-completion \
    python3-venv \
    python3-pip \
    ca-certificates

# For OpenSSL compatibility (on older Ubuntu 20.04 systems)
sudo apt install -y libssl1.1 || sudo apt install -y libssl3 || true

echo "✅ System dependencies installed."
sudo apt autoremove -y
# ===============================================================
# Step 2: Install ASDF
# ===============================================================

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"    # linux, darwin, etc.
ARCH="$(uname -m)"                               # x86_64, arm64, etc.

case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  aarch64) ARCH="arm64" ;;
esac

echo "=== Step 2: Installing ASDF ==="
LATEST_VERSION=$(wget -qO- https://api.github.com/repos/asdf-vm/asdf/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')
if [ -z "$LATEST_VERSION" ]; then
  echo "❌ Failed to retrieve ASDF version. Exiting."
  exit 1
fi

ASDF_DIR="$HOME/.asdf"
ASDF_BIN_DIR="$ASDF_DIR/bin"
TARBALL_URL="https://github.com/asdf-vm/asdf/releases/download/${LATEST_VERSION}/asdf-${LATEST_VERSION}-${OS}-${ARCH}.tar.gz"

echo "📦 Installing ASDF version ${LATEST_VERSION} from:"
echo "➡️  ${TARBALL_URL}"

# rm -rf "$ASDF_DIR"
mkdir -p "$ASDF_BIN_DIR"

wget -q "$TARBALL_URL" -O /tmp/asdf.tar.gz
tar -xzf /tmp/asdf.tar.gz -C "$ASDF_BIN_DIR"
rm /tmp/asdf.tar.gz
chmod +x "$ASDF_BIN_DIR/asdf"

# ===============================================================
# Step 3: Configure Environment
# ===============================================================
if [[ "$SHELL" == *"bash"* ]]; then
  SHELL_RC="$HOME/.bashrc"
elif [[ "$SHELL" == *"zsh"* ]]; then
  SHELL_RC="$HOME/.zshrc"
else
  SHELL_RC="$HOME/.profile"
fi

if ! grep -q 'ASDF_DIR' "$SHELL_RC"; then
  cat <<'EOF' >> "$SHELL_RC"

# >>> asdf setup >>>
export ASDF_DIR="$HOME/.asdf"
export PATH="$ASDF_DIR/bin:$ASDF_DIR/shims:$PATH"
# <<< asdf setup <<<
EOF
fi

# Activate ASDF for this session
export ASDF_DIR="$HOME/.asdf"
export PATH="$ASDF_DIR/bin:$ASDF_DIR/shims:$PATH"

echo "✅ ASDF installed and environment configured."


echo "=== Step 3: Install ASDF plugins (Node.js, Python) ==="
declare -A PLUGINS=(
  ["nodejs"]="https://github.com/asdf-vm/asdf-nodejs.git"
  ["python"]="https://github.com/danhper/asdf-python.git"
)

for plugin in "${!PLUGINS[@]}"; do
  if asdf plugin list | grep "$plugin"; then
    echo "✔ Plugin '$plugin' already added."
  else
    echo "➕ Adding plugin '$plugin'..."
    asdf plugin add "$plugin" "${PLUGINS[$plugin]}"
  fi
done

# ===============================================================
# Step 5: Install Latest Node.js and Python Versions
# ===============================================================
echo "=== Step 5: Installing latest Node.js and Python ==="

LATEST_NODE=$(asdf latest nodejs)
LATEST_PYTHON=$(asdf latest python)

echo "Latest Node.js: $LATEST_NODE"
echo "Latest Python: $LATEST_PYTHON"

if asdf list nodejs | grep $LATEST_NODE; then
  echo "✔ Node.js $LATEST_NODE already installed."
else
  echo "⬇ Installing Node.js $LATEST_NODE..."
  asdf install nodejs "$LATEST_NODE"
fi

if asdf list python | grep $LATEST_PYTHON; then
  echo "✔ Python $LATEST_PYTHON already installed."
else
  echo "⬇ Installing Python $LATEST_PYTHON..."
  asdf install python "$LATEST_PYTHON"
fi

echo "=== Step 6: Set global versions ==="
asdf set -u nodejs "$LATEST_NODE"
asdf set -u python "$LATEST_PYTHON"
asdf reshim
echo ""
echo "=== Step 7: Install Playwright globally via npm ==="
if npm list -g playwright >/dev/null 2>&1; then
  echo "✔ Playwright is already installed globally."
else
  echo "⬇ Installing Playwright globally..."
  npm install -g playwright
fi

echo "=== Step 7: Create Whisper virtual environment ==="
VENV_DIR="$HOME/.venvs/whisper"
mkdir -p "$(dirname "$VENV_DIR")"

PY_CMD=$(asdf which python || which python3)

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating new Whisper virtual environment..."
  "$PY_CMD" -m venv "$VENV_DIR"
else
  echo "✔ Whisper virtual environment already exists."
fi

# Activate the environment
source "$VENV_DIR/bin/activate"

echo "=== Step 8: Install Whisper inside virtual environment ==="
if pip show openai-whisper >/dev/null 2>&1; then
  echo "✔ Whisper already installed in virtual environment."
else
  echo "⬇ Installing Whisper and dependencies..."
  pip install --upgrade pip setuptools wheel
  pip install openai-whisper
fi

echo "=== Step 9: Validate installations ==="
deactivate
asdf reshim

echo "Node.js version: $(node -v)"
echo "Python version: $($PY_CMD --version)"
echo "Playwright version: $(npx playwright --version)"
source "$VENV_DIR/bin/activate"
echo "Whisper CLI check:"
whisper --help | head -n 2
deactivate

echo "✅ ASDF environment setup complete!"
echo "📦 Node.js ($LATEST_NODE), Python ($LATEST_PYTHON), Playwright, and Whisper virtual environment ready."

