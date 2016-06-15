FROM ubuntu:14.04

RUN apt-get update && apt-get install -y libcurl3

RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
# Install Ruby and Rails dependencies
RUN apt-get install -y \
  ruby \
  ruby-dev \
  build-essential \
  libxml2-dev \
  libxslt1-dev \
  zlib1g-dev \
  libsqlite3-dev \
  nodejs \
  npm

RUN npm install

CMD ["npm", "start"]
EXPOSE 3000