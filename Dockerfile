FROM node:6.2-onbuild

RUN sudo add-apt-repository ppa:ubuntu-toolchain-r/test

RUN apt-get update
RUN sudo apt-get install -y libstdc++-4.9-dev
# Install Ruby and Rails dependencies
RUN apt-get install -y \
  ruby \
  ruby-dev \
  git \
  git-core \
  build-essential \
  libxml2-dev \
  libxslt1-dev \
  zlib1g-dev \
  libsqlite3-dev 

RUN gem install bundler

RUN git clone https://github.com/naytev/jms

WORKDIR jms

RUN npm install

CMD ["npm", "start"]
EXPOSE 3000