FROM node:13-alpine
RUN apk update && apk add git

WORKDIR /usr/src/app

RUN mkdir blockpy-edu
RUN mkdir pedal-edu

WORKDIR /usr/src/app/blockpy-edu/

RUN git clone https://github.com/blockpy-edu/skulpt skulpt

WORKDIR /usr/src/app/blockpy-edu/skulpt/

RUN npm install
RUN npm run devbuild

WORKDIR /usr/src/app/blockpy-edu/
RUN git clone https://github.com/blockpy-edu/BlockMirror BlockMirror
RUN git clone https://github.com/google/blockly blockly
WORKDIR /usr/src/app/pedal-edu/
RUN git clone https://github.com/pedal-edu/pedal pedal
RUN git clone https://github.com/pedal-edu/curriculum-ctvt curriculum-ctvt
RUN git clone https://github.com/pedal-edu/curriculum-sneks curriculum-sneks

WORKDIR /usr/src/app/blockpy-edu/


RUN git clone https://github.com/blockpy-edu/blockpy blockpy

WORKDIR /usr/src/app/blockpy-edu/blockpy/
RUN npm install
RUN npm run dev

# RUN npm start

# Open http://localhost:8601/ in your browser

COPY . .
EXPOSE 8601
CMD [ "npm", "run", "dev" ]

# docker run -p 8080:8601 -d scratch-node 