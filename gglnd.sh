#!/bin/bash

######################
## GGLND APP DEPLOY ##
######################

shellName=`basename $0`
app=${shellName%.*}

if [ -z "$1" ]; then
        OPT="-d"
        else
        OPT=
fi

printf "Current dir is $(pwd)\n"
printf "Getting the latest code updates from git...\n"

git pull

printf "Checking if the container is already running...\n"
        check=$(docker inspect -f {{.State.Running}} $app)
        if [ "$check" != "true" ]; then
                printf "Container $app not running, starting it now...\n"
                printf "Starting the docker $app container...\n"

                ##this command includes npm install
                docker run $OPT --name $app --restart=always -v "$(pwd)/app":/usr/src/app -ti -p 82:8000 -p 83:1337 $app

                else
                        printf "Installing/Updating the npm packages...\n"
                        docker exec -ti $app npm install
        fi

printf "Updating the docker instance...\n"
docker container restart $app