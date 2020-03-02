DEP_DIRS="customerService customerApp"
BUILD_DIRS="customerService customerApp nestHttpApp nestMicroservice"
LINK_DIRS="nestHttpApp nestMicroservice"
# install dependencies for each project
for dir in $DEP_DIRS;
do
  echo "===> installing ${dir} \n"
  sh -c "cd ${dir} && npm i";
done

# npm link
# first link the nestjs-faye-transporter
echo "===> npm linking nestjs-faye-transporter"
sh -c "cd nestjs-faye-transporter && npm link"

# link the nest projects
for dir in $LINK_DIRS;
do
  echo "===> linking ${dir} \n"
  sh -c "cd ${dir} && npm link @faye-tut/nestjs-faye-transporter";
done

# build each project
for dir in $BUILD_DIRS;
do
  echo "===> building ${dir} \n"
  sh -c "cd ${dir} && npm run build";
done

