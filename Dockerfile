FROM node:24.12.0-bookworm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN pnpm install

EXPOSE 3000

CMD ["pnpm", "dev"]
