FROM node:16-alpine
WORKDIR /usr/src/app
ENV NODE_ENV development
ENV PATH "/workspace/node_modules/.bin:${PATH}"
RUN apk add --no-cache bash bash-completion git git-bash-completion openssh-client
RUN echo 'source /usr/share/bash-completion/bash_completion' >> ~/.bashrc
RUN echo 'source /usr/share/bash-completion/completions/git' >> ~/.bashrc
RUN sed -i -e "s/bin\/ash/bin\/bash/" /etc/passwd