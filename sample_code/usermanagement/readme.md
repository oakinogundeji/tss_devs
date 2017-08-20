# User Management

Please note the following:

- As is a best practice, i've used environment variables for sensitive information e.g. the database URL. In the app, this is exposed as process.env.DBURL, i've attached a sample for you to work with. Please endure that on your local machine and the production server, the actual file you use is called .env

- in this file you'll notice 2 DBURL fields, the one with a '#' preceding it is a comment and is disregarded by the 'dotenv' module. I used it for heroku. The other one is how you would use a local instance of mongodb.

Example .env file:

PORT=3000
DBURL=mongodb://localhost/wejustdoTest

# Documentation

WHAT: This project is a microservice that manages user information.

WHY: A standalone microservice which can be independently scaled to support user management
needs for a larger application.

HOW: The microservice exposes 4 endpoints which provide access to the data it manages. These
endpoints are RESTful and allow CRUD operations to be performed against the underlying data
resources.
The microservice has an entry point vis server.js which is a node.js http server which delegates
request handling to an underlying expressjs app (app.js). This pattern is a common one in the Node
world.
The express app is built as a RESTful service and uses middleware like helmet, hpp and nocache to
implement security best practices. It also supports a custom CORS implementation (lines 76-86 of
app.js).
The microservice is designed to use environmental variables (via dotenv, see line 2 of app.js), this
practice ensures the security of sensitive information e.g. API Keys etc.
The database connection and lifecycle management is implemented in app.js (lines 44-61), this is
also another common pattern in the Node world.
Route handlers are defined in a separate expressjs sub module (routes/routes.js) and bound to the
‘/api/’ path (line 95 in app.js), the pattern employed is to use ‘thin’ route handlers which delegate
the actual CRUD operation to helper functions (defined in models/userUtils directory). When these
helper functions complete their operation, the response object passed to them by the route handler is
used to send a response to the request originally intercepted by the handler.
The mongoose data models are defined in models/users.js and use bcrypt for password security, this
is activated when a user object is saved to the datastore and affects changes to the password
property of the document. Furthermore an index is created which is keyed to the username attribute
of the document objects. Use of an index greatly improves read performance by mongoDB (O(lgn)
vs O(n) ).

WALK THROUGH: Example request ‘POST /api/createUser’. The flow would be:
1. http server receives the request (server.js) and passes it on to the base http request handler
(app.js).
2. The express app receives the request and processes it through the middleware pipeline (line 74 in
app.js ensures that the POST body is extracted and a new ‘body’ property is created on the
incoming request object).
3. The express app matches the method and the path to the available handlers and passes the request
object to the corresponding handler if there’s a match (line 95 in app.js triggers lines 24-37 of
routes/routes.js).
4. Inside the route handler 2 checks are performed to ensure that the POST body contains a non
empty username and password. If these checks fail the response is terminated with a 409 HTTP
status code and the appropriate JSON message is returned e.g. {error: "Please provide password."}.
If all is well, then ‘createUser()’ helper method (models/userUtils/createUser.js) is invoked with 3arguments -username, password and a reference to the corresponding response object for that http
request.
5. Inside the createUser helper function a database connection is attempted (line 14), if a database
connection error occurs, then a 500 HTTP code is sent to the client with the appropriate JSON error
message e.g. {error: "Something went wrong. Please try again later."}.
- if no database connection error occurs, then a check is performed to see if a user with that
username already exists in the database, if such a user is found, it responds to the client with a 409
HTTP error and an appropriate JSON message e.g. {error: "A user with that username already
exists."}
- if no user with that username already exist, then it attempts to create a new user object using the
username and password values from the POST body. If a database error occurs while trying to save
the newly created user object, it responds to the client with a 500 HTTP code and a JSON message
e.g. {error: "Something went wrong. Please try again later."} otherwise it responds with a 200
HTTP code and the provided username form the POST body as a JSON string.
This pattern is how the microservice responds to requests. It is a modular and decoupled
architecture which makes it easy to refactor.
