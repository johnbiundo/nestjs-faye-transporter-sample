BUILD_DIRS="customerApp customerService"
DEP_DIRS="$BUILD_DIRS faye-server"
# install dependencies for each project
for dir in $DEP_DIRS;
do
  echo "===> installing ${dir} \n"
  sh -c "cd ${dir} && npm i";
done
# build each project
for dir in $BUILD_DIRS;
do
  echo "===> building ${dir} \n"
  sh -c "cd ${dir} && npm run build";
done