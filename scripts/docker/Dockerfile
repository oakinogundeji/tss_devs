# define base ubuntu image
FROM ubuntu:16.04
# maintainer
MAINTAINER Percayso Team <dev@percayso.com>
# update ubuntu and install dependencies
RUN apt-get update && apt-get -y install curl python git build-essential sudo vim unzip && \
    rm -rf /var/lib/apt/lists/*
# install node.js v 8.x
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN apt-get install -y nodejs
# install AWS-CLI
RUN curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" \
    -o "awscli-bundle.zip" && unzip awscli-bundle.zip && \
    awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws && \
    rm -rf awscli-bundle.zip awscli-bundle
# create percayso user
RUN useradd percayso -g sudo -m && passwd -d percayso
# set the user for subsequent commands
USER percayso
WORKDIR /home/percayso
