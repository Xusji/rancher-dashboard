# 使用多阶段构建
# 第一阶段：构建 Dashboard UI
FROM node:20.18.3 AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 yarn.lock
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install
RUN yarn add ts-loader -W

# 复制源代码
COPY . .

# 构建 Dashboard
ENV NODE_OPTIONS=--max_old_space_size=4096
ENV OUTPUT_DIR=dist/production
ENV ROUTER_BASE=/dashboard/
ENV RESOURCE_BASE=/dashboard/
RUN yarn run build

# 第二阶段：最终镜像
FROM rancher/rancher::v2.10-head

# 复制构建好的 Dashboard UI
COPY --from=builder /app/dist/production /usr/share/rancher/ui-dashboard/dashboard

# 设置环境变量
ENV CATTLE_DASHBOARD_UI_VERSION=v2.11.0-alpha8

# 设置默认的 UI 偏好
ENV CATTLE_UI_OFFLINE_PREFERRED=true

# 暴露端口
EXPOSE 80 443

# 使用默认的 entrypoint 