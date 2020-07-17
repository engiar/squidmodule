FROM node:stretch-slim
RUN apt update -y ; apt-get install -y bc

RUN /bin/echo "A=\$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes | bc)" >> /etc/bash.bashrc
RUN /bin/echo "B=\$(echo  \"((\$A / 1048576) - 150)/1\" | bc)" >> /etc/bash.bashrc
RUN /bin/echo 'export NODE_OPTIONS="--max_old_space_size=$B"' >> /etc/bash.bashrc

WORKDIR /squidmodule/
COPY ./server.js /squidmodule/server.js
RUN chmod 777 /squidmodule/server.js ; chmod +x /squidmodule/server.js

