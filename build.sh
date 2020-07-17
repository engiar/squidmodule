REGISTRY_URL="https://hub.docker.com"
DOCKER_ID="engiar"
REPOSITORY="squidmodule"

docker pull node:stretch-slim
docker build -t squid/module:latest .
docker tag squid/module:latest ${DOCKER_ID}/${REPOSITORY}:latest
docker login
docker push ${DOCKER_ID}/${REPOSITORY}:latest