cmake_minimum_required(VERSION 3.27)

include("../StarlingMonkey/cmake/add_as_subproject.cmake")

# add_builtin(fastedge::runtime SRC handler.cpp)

add_builtin(fastedge::fastedge SRC builtins/fastedge.cpp)

# Create an extension builtin that patches the Response class
add_builtin(fastedge::response_extensions SRC builtins/fetch/response-json.cpp DEPENDENCIES builtin_web_fetch)


project(fastedge)
