#!/usr/bin/env sh

set -e

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -f "$DIR/.mvn/wrapper/maven-wrapper.jar" ] && [ -f "$DIR/.mvn/wrapper/maven-wrapper.properties" ]; then
  exec java -classpath "$DIR/.mvn/wrapper/maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperDownloader "$@"
fi

exec mvn "$@"
