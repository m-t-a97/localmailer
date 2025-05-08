FROM node:lts-jod

ARG DEBIAN_FRONTEND=noninteractive

USER root
WORKDIR /root

RUN apt update && apt install -y \
  apt-transport-https ca-certificates gnupg curl wget git zip unzip less zsh net-tools iputils-ping jq lsof

ENV HOME="/root"

# --------------------------------------
# Git
# --------------------------------------
# Need to add the devcontainer workspace folder as a safe directory to enable git 
# version control system to be enabled in the containers file system.
RUN git config --global --add safe.directory "/workspaces/localmailer"
# --------------------------------------

# --------------------------------------
# Oh my zsh
# --------------------------------------
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" -- \
  -t robbyrussell \
  -p git -p node -p npm

ENV SHELL=/bin/zsh
# --------------------------------------

# --------------------------------------
# NPM
# --------------------------------------
RUN corepack enable pnpm
RUN corepack prepare pnpm@10.0.0 --activate
# Bun.js
RUN curl -fsSL https://bun.sh/install | bash
# --------------------------------------

# --------------------------------------
# Ngrok
# --------------------------------------
RUN wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz && \
  tar -xvzf ngrok-v3-stable-linux-amd64.tgz && \
  mv ngrok /usr/local/bin/ && \
  rm ngrok-v3-stable-linux-amd64.tgz
# --------------------------------------

# --------------------------------------
# SSH
# --------------------------------------
RUN mkdir -p ~/.ssh
RUN touch ~/.ssh/config
RUN echo "Host github.com" >> ~/.ssh/config \
  && echo "    IdentityFile ~/.ssh/id_ed25519" >> ~/.ssh/config
RUN touch ~/.ssh/id_ed25519
# --------------------------------------
