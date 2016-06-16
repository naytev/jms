FROM node:6.2-onbuild

RUN apt-get update

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