# Rancher Dashboard

## 构建 Docker 镜像

### 环境要求

- Docker 20.10.0 或更高版本
- Docker Buildx（用于多平台构建）

### 构建步骤

1. 构建 AMD64 (Linux) 平台镜像

```bash
# 创建并使用多平台构建器
docker buildx create --name multiplatform-builder --use

# 构建并推送镜像（基于 Rancher v2.10）
docker buildx build --platform linux/amd64 -t r.do-ny3.gocloudio.com/core/rancher:v2.10-head . --push
```

2. 本地测试运行

```bash
# 拉取镜像
docker pull r.do-ny3.gocloudio.com/core/rancher:v2.10-head

# 运行容器
docker run -d \
  --name rancher-test \
  --restart unless-stopped \
  --privileged \
  -p 80:80 \
  -p 443:443 \
  -e CATTLE_BOOTSTRAP_PASSWORD=password \
  r.do-ny3.gocloudio.com/core/rancher:v2.10-head
```

### 访问

- Web UI: https://localhost 或 http://localhost
- 默认密码: password（可通过 CATTLE_BOOTSTRAP_PASSWORD 环境变量修改）

### 注意事项

1. 确保 80 和 443 端口未被占用
2. 需要有 r.do-ny3.gocloudio.com 镜像仓库的访问权限
3. 首次访问可能需要等待几分钟才能完成初始化
4. 基于 Rancher v2.10 版本构建
