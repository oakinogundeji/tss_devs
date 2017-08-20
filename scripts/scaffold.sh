#!/bin/bash

#create dirs for utils, routes, test, models, static, views, socket
mkdir models routes test utils static views socket

#create app, server and .env files
touch app.js server.js .env

#cr8 static sub dirs
mkdir static/css static/imgs static/js

#cr8 basic static files
touch static/css/styles.css static/js/app.js

#cr8 base model and helpers
touch models/users.js models/user-utils.js

#cr8 routes.js
touch routes/routes.js

#cr8 socket.js
touch socket/socket.js

#cr8 isLoggedIn utility
touch utils/isLoggedIn.js

#cr8 views dirs n layout NB this assumes use of ejs as template engine

mkdir views/pages views/partials
touch views/layout.html views/partials/head.html views/partials/header.html views/partials/footer.html
touch views/pages/errors.html views/pages/index.html views/pages/login.html views/pages/signup.html
