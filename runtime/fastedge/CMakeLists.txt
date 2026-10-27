cmake_minimum_required(VERSION 3.27)

include("../StarlingMonkey/cmake/add_as_subproject.cmake")

# add_builtin(fastedge::runtime SRC handler.cpp)
add_builtin(fastedge::fastedge SRC builtins/fastedge.cpp)
add_builtin(fastedge::kv_store SRC builtins/kv-store.cpp)
add_builtin(fastedge::cache SRC builtins/cache.cpp)
add_builtin(fastedge::request_info SRC builtins/request-info.cpp)
add_builtin(fastedge::db_sql SRC builtins/db-sql.cpp)
add_builtin(fastedge::db_kv SRC builtins/db-kv.cpp)
add_builtin(fastedge::console_override SRC builtins/console-override.cpp)
add_builtin(componentize::embedding SRC builtins/embedding/embedding.cpp)
include_directories("${CMAKE_CURRENT_SOURCE_DIR}/../StarlingMonkey")


project(fastedge)
