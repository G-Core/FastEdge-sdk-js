cmake_minimum_required(VERSION 3.27)

include("../StarlingMonkey/cmake/add_as_subproject.cmake")

# add_builtin(fastedge::runtime SRC handler.cpp)
add_builtin(fastedge::fastedge SRC builtins/fastedge.cpp)
add_builtin(fastedge::kv_store SRC builtins/kv-store.cpp)
add_builtin(fastedge::console_override SRC builtins/console-override.cpp)


project(fastedge)
