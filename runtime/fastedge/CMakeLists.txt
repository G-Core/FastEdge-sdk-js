cmake_minimum_required(VERSION 3.27)

include("../StarlingMonkey/cmake/add_as_subproject.cmake")

add_builtin(fastedge::fastedge SRC builtins/fastedge.cpp)
# add_builtin(fastedge::env SRC builtins/env.cpp)

project(fastedge)
