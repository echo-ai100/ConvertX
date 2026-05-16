FROM debian:bookworm-slim AS base
LABEL org.opencontainers.image.source="https://github.com/C4illin/ConvertX"
WORKDIR /app

# 设置中科大镜像源
RUN sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list 2>/dev/null || true

# install bun (允许未验证的仓库以解决 GPG 密钥问题)
RUN apt-get update --allow-insecure-repositories && apt-get install -y --allow-unauthenticated \
  ca-certificates \
  curl \
  unzip \
  && rm -rf /var/lib/apt/lists/*

# if architecture is arm64, use the arm64 version of bun (使用国内镜像)
RUN ARCH=$(uname -m) && \
  if [ "$ARCH" = "aarch64" ]; then \
    curl -fsSL -o bun-linux-aarch64.zip "https://npmmirror.com/mirrors/bun/bun-v1.2.2/bun-linux-aarch64.zip"; \
  else \
    curl -fsSL -o bun-linux-x64-baseline.zip "https://npmmirror.com/mirrors/bun/bun-v1.2.2/bun-linux-x64-baseline.zip"; \
  fi

RUN unzip -j bun-linux-*.zip -d /usr/local/bin && \
  rm bun-linux-*.zip && \
  chmod +x /usr/local/bin/bun

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
WORKDIR /app
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# ENV NODE_ENV=production
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release

# install additional dependencies (使用中科大镜像)
RUN apt-get update --allow-insecure-repositories && apt-get install -y --allow-unauthenticated \
  assimp-utils \
  calibre \
  dcraw \
  dvisvgm \
  ffmpeg \
  ghostscript \
  graphicsmagick \
  imagemagick \
  inkscape \
  latexmk \
  libheif-examples \
  libjxl-tools \
  libreoffice \
  libva2 \
  libvips-tools \
  libemail-outlook-message-perl \
  lmodern \
  mupdf-tools \
  pandoc \
  poppler-utils \
  potrace \
  python3-numpy \
  python3-tinycss2 \
  texlive \
  texlive-fonts-recommended \
  texlive-latex-extra \
  texlive-latex-recommended \
  texlive-xetex \
  python3 \
  python3-pip \
  pipx \
  wget \
  --no-install-recommends \
  && pipx install "markitdown[all]" \
  && rm -rf /var/lib/apt/lists/*

# Add pipx bin directory to PATH
ENV PATH="/root/.local/bin:${PATH}"

# Install VTracer binary (直接从 GitHub 下载)
RUN ARCH=$(uname -m) && \
  if [ "$ARCH" = "aarch64" ]; then \
    VTRACER_ASSET="vtracer-aarch64-unknown-linux-musl.tar.gz"; \
  else \
    VTRACER_ASSET="vtracer-x86_64-unknown-linux-musl.tar.gz"; \
  fi && \
  curl -L -o /tmp/vtracer.tar.gz "https://github.com/nickolay/resvg-js/releases/download/resvg-js%404.0.0/${VTRACER_ASSET}" && \
  tar -xzf /tmp/vtracer.tar.gz -C /tmp/ && \
  mv /tmp/vtracer /usr/local/bin/vtracer && \
  chmod +x /usr/local/bin/vtracer && \
  rm /tmp/vtracer.tar.gz || true

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/public/ /app/public/
COPY --from=prerelease /app/dist /app/dist

# COPY . .
RUN mkdir data

EXPOSE 3000/tcp
# used for calibre
ENV QTWEBENGINE_CHROMIUM_FLAGS="--no-sandbox"
ENV NODE_ENV=production
ENTRYPOINT [ "bun", "run", "dist/src/index.js" ]
