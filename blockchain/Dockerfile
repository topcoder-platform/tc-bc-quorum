FROM ubuntu:xenial-20210114
WORKDIR /work
# install build deps
RUN apt-get update
RUN apt-get install -y --no-install-recommends software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum
RUN apt-get update
RUN apt-get install -y build-essential unzip libdb-dev libsodium-dev zlib1g-dev libtinfo-dev solc sysvbanner wrk
RUN apt-get install -y wget git psmisc curl
RUN apt-get install -y net-tools iputils-ping telnet


# install constellation
ENV CVER "0.3.2"
ENV CREL="constellation-$CVER-ubuntu1604"
RUN wget -q https://github.com/jpmorganchase/constellation/releases/download/v$CVER/$CREL.tar.xz
RUN tar xfJ $CREL.tar.xz
RUN cp $CREL/constellation-node /usr/local/bin && chmod 0755 /usr/local/bin/constellation-node
RUN rm -rf $CREL


# install golang
ENV GOREL go1.9.3.linux-amd64.tar.gz
RUN wget -q https://dl.google.com/go/$GOREL
RUN tar xfz $GOREL
RUN mv go /usr/local/go
RUN rm -f $GOREL
ENV PATH $PATH:/usr/local/go/bin

RUN wget -q https://github.com/jpmorganchase/quorum/releases/download/v1.2.0/porosity
RUN mv porosity /usr/local/bin && chmod 0755 /usr/local/bin/porosity

# make/install quorum
RUN git clone https://github.com/jpmorganchase/quorum.git
RUN cd quorum && \
    git checkout tags/v2.0.2 && \
    make all && \
    cp build/bin/geth /usr/local/bin && \
    cp build/bin/bootnode /usr/local/bin


RUN git clone https://github.com/google/leveldb.git
RUN cd leveldb && git checkout tags/v1.19
RUN cd leveldb/ && \
    make && \
    cp -r out-static/lib* out-shared/lib* /usr/local/lib/ && \
    cd include/ && \
    cp -r leveldb /usr/local/include/ && \
    ldconfig
