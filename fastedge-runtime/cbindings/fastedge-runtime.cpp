#include <cassert>
#include <chrono>
#include <cstdlib>
#include <iostream>
#ifdef MEM_STATS
#include <string>
#endif

#include <wasi/libc-environ.h>

// TODO: remove these once the warnings are fixed
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Winvalid-offsetof"
#pragma clang diagnostic ignored "-Wdeprecated-enum-enum-conversion"
#include "js/Array.h"
#include "js/CompilationAndEvaluation.h"
#include "js/ContextOptions.h"
#include "js/Initialization.h"
#include "js/SourceText.h"
#include "js/Vector.h"
#include "jsapi.h"
#include "jsfriendapi.h"

#pragma clang diagnostic pop

#include "core/allocator.h"
#include "core/encode.h"
#include "fastedge-builtins.h"
#include "third-party/wizer.h"
#include "wit-interface/fastedge-api.h"
#ifdef MEM_STATS
#include "memory-reporting.h"
#endif

using std::chrono::duration_cast;
using std::chrono::microseconds;
using std::chrono::system_clock;

using JS::Value;

using JS::RootedObject;
using JS::RootedString;
using JS::RootedValue;

using JS::HandleObject;
using JS::HandleValue;
using JS::HandleValueArray;
using JS::MutableHandleValue;

using JS::PersistentRooted;
using JS::PersistentRootedVector;

#ifdef MEM_STATS
size_t size_of_cb(const void *ptr) { return ptr ? sizeof(ptr) : 0; }

static bool dump_mem_stats(JSContext *cx) {
  SimpleJSRuntimeStats rtStats(&size_of_cb);
  if (!JS::CollectRuntimeStats(cx, &rtStats, nullptr, false))
    return false;
  std::string rtPath = "rt";
  size_t rtTotal;
  ReportJSRuntimeExplicitTreeStats(rtStats, rtPath, nullptr, false, &rtTotal);

  printf("compartment counts: %zu sys, %zu usr\n", JS::SystemCompartmentCount(cx),
         JS::UserCompartmentCount(cx));
  printf("GC heap total: %zu\n",
         size_t(JS_GetGCParameter(cx, JSGC_TOTAL_CHUNKS)) * js::gc::ChunkSize);
  printf("GC heap unused: %zu\n",
         size_t(JS_GetGCParameter(cx, JSGC_UNUSED_CHUNKS)) * js::gc::ChunkSize);

  return true;
}
#endif // MEM_STATS

/* The class of the global object. */
static JSClass global_class = {"global", JSCLASS_GLOBAL_FLAGS, &JS::DefaultGlobalClassOps};

JS::PersistentRootedObject GLOBAL;
JS::PersistentRootedObject unhandledRejectedPromises;
JS::PersistentRootedObject requestObj;


void gc_callback(JSContext *cx, JSGCStatus status, JS::GCReason reason, void *data) {
  if (debug_logging_enabled())
    printf("gc for reason %s, %s\n", JS::ExplainGCReason(reason), status ? "end" : "start");
}

static void rejection_tracker(JSContext *cx, bool mutedErrors, JS::HandleObject promise,
                              JS::PromiseRejectionHandlingState state, void *data) {
  RootedValue promiseVal(cx, JS::ObjectValue(*promise));

  switch (state) {
  case JS::PromiseRejectionHandlingState::Unhandled: {
    if (!JS::SetAdd(cx, unhandledRejectedPromises, promiseVal)) {
      // Note: we unconditionally print these, since they almost always indicate
      // serious bugs.
      fprintf(stderr, "Adding an unhandled rejected promise to the promise "
                      "rejection tracker failed");
    }
    return;
  }
  case JS::PromiseRejectionHandlingState::Handled: {
    bool deleted = false;
    if (!JS::SetDelete(cx, unhandledRejectedPromises, promiseVal, &deleted)) {
      // Note: we unconditionally print these, since they almost always indicate
      // serious bugs.
      fprintf(stderr, "Removing an handled rejected promise from the promise "
                      "rejection tracker failed");
    }
  }
  }
}

bool init_js() {
  JS_Init();

  JSContext *cx = JS_NewContext(JS::DefaultHeapMaxBytes);
  if (!cx) {
    return false;
  }
  if (!js::UseInternalJobQueues(cx) || !JS::InitSelfHostedCode(cx)) {
    return false;
  }

  // TCL: What is this defaulted to?? Do we need it?
  bool ENABLE_PBL = std::string(std::getenv("ENABLE_PBL")) == "1";
  if (ENABLE_PBL) {
    JS_SetGlobalJitCompilerOption(cx, JSJitCompilerOption::JSJITCOMPILER_PORTABLE_BASELINE_ENABLE,
                                  1);
    JS_SetGlobalJitCompilerOption(
        cx, JSJitCompilerOption::JSJITCOMPILER_PORTABLE_BASELINE_WARMUP_THRESHOLD, 0);
  }

  // TODO: check if we should set a different creation zone.
  JS::RealmOptions options;
  options.creationOptions().setStreamsEnabled(true).setWeakRefsEnabled(
      JS::WeakRefSpecifier::EnabledWithoutCleanupSome);

  JS::DisableIncrementalGC(cx);
  // JS_SetGCParameter(cx, JSGC_MAX_EMPTY_CHUNK_COUNT, 1);

  RootedObject global(
      cx, JS_NewGlobalObject(cx, &global_class, nullptr, JS::FireOnNewGlobalHook, options));
  if (!global) {
    return false;
  }

  JSAutoRealm ar(cx, global);
  if (!JS::InitRealmStandardClasses(cx)) {
    return false;
  }

  JS::SetPromiseRejectionTrackerCallback(cx, rejection_tracker);

  CONTEXT = cx;
  GLOBAL.init(cx, global);
  unhandledRejectedPromises.init(cx, JS::NewSetObject(cx));
  if (!unhandledRejectedPromises) {
    return false;
  }

  // builtins::Performance::timeOrigin.emplace(std::chrono::high_resolution_clock::now());

  return true;
}

static bool report_unhandled_promise_rejections(JSContext *cx) {
  RootedValue iterable(cx);
  if (!JS::SetValues(cx, unhandledRejectedPromises, &iterable))
    return false;

  JS::ForOfIterator it(cx);
  if (!it.init(iterable))
    return false;

  RootedValue promise_val(cx);
  RootedObject promise(cx);
  while (true) {
    bool done;
    if (!it.next(&promise_val, &done))
      return false;

    if (done)
      break;

    promise = &promise_val.toObject();
    // Note: we unconditionally print these, since they almost always indicate
    // serious bugs.
    fprintf(stderr, "Promise rejected but never handled: ");
    RootedValue result(cx, JS::GetPromiseResult(promise));
    dump_promise_rejection(cx, result, promise, stderr);
  }

  return true;
}

static void DumpPendingException(JSContext *cx, const char *description) {
  JS::ExceptionStack exception(cx);
  if (!JS::GetPendingExceptionStack(cx, &exception)) {
    fprintf(stderr,
            "Error: exception pending after %s, but got another error "
            "when trying to retrieve it. Aborting.\n",
            description);
  } else {
    fprintf(stderr, "Exception while %s: ", description);
    dump_value(cx, exception.exception(), stderr);
    print_stack(cx, exception.stack(), stderr);
  }
}

static void abort(JSContext *cx, const char *description) {
  // Note: we unconditionally print messages here, since they almost always
  // indicate serious bugs.
  if (JS_IsExceptionPending(cx)) {
    DumpPendingException(cx, description);
  } else {
    fprintf(stderr,
            "Error while %s, but no exception is pending. "
            "Aborting, since that doesn't seem recoverable at all.\n",
            description);
  }

  if (JS::SetSize(cx, unhandledRejectedPromises) > 0) {
    fprintf(stderr, "Additionally, some promises were rejected, but the "
                    "rejection never handled:\n");
    report_unhandled_promise_rejections(cx);
  }

  // Respond with status `500` if no response was ever sent.
  // HandleObject fetch_event = builtins::FetchEvent::instance();
  // if (hasWizeningFinished() && !builtins::FetchEvent::response_started(fetch_event)) {
  //   builtins::FetchEvent::respondWithError(cx, fetch_event);
  // }

  fflush(stderr);
  exit(1);
}

bool eval_stdin(JSContext *cx, MutableHandleValue result) {
  char *code = NULL;
  size_t len = 0;
  if (getdelim(&code, &len, EOF, stdin) < 0) {
    return false;
  }

  JS::CompileOptions opts(cx);

  // This ensures that we're eagerly loading the sript, and not lazily generating bytecode for
  // functions.
  // https://searchfox.org/mozilla-central/rev/5b2d2863bd315f232a3f769f76e0eb16cdca7cb0/js/public/CompileOptions.h#571-574
  opts.setForceFullParse();

  // TODO: investigate passing a filename to Wizer and using that here to
  // improve diagnostics.
  // TODO: furthermore, investigate whether Wizer by now allows us to pass an
  // actual path and open that, instead of having to redirect `stdin` for a
  // subprocess of `js-compute-runtime`.
  opts.setFileAndLine("<stdin>", 1);

  JS::SourceText<mozilla::Utf8Unit> srcBuf;
  if (!srcBuf.init(cx, code, strlen(code), JS::SourceOwnership::TakeOwnership)) {
    return false;
  }

  JS::RootedScript script(cx);
  {
    // Disabling GGC during compilation seems to slightly reduce the number of
    // pages touched post-deploy.
    // (Whereas disabling it during execution below meaningfully increases it,
    // which is why this is scoped to just compilation.)
    JS::AutoDisableGenerationalGC noGGC(cx);
    script = JS::Compile(cx, opts, srcBuf);
    if (!script)
      return false;
  }

  // TODO(performance): verify that it's better to perform a shrinking GC here, as manual
  // testing indicates. Running a shrinking GC here causes *fewer* 4kb pages to
  // be written to when processing a request, at least for one fairly large
  // input script.
  //
  // A hypothesis for why this is the case could be that the objects allocated
  // by parsing the script (but not evaluating it) tend to be read-only, so
  // optimizing them for compactness makes sense and doesn't fragment writes
  // later on.
  // https://github.com/original_repo/issues/222
  JS::PrepareForFullGC(cx);
  JS::NonIncrementalGC(cx, JS::GCOptions::Shrink, JS::GCReason::API);

  // Execute the top-level script.
  if (!JS_ExecuteScript(cx, script, result))
    return false;

  // Ensure that any pending promise reactions are run before taking the
  // snapshot.
  while (js::HasJobsPending(cx)) {
    js::RunJobs(cx);

    if (JS_IsExceptionPending(cx))
      abort(cx, "running Promise reactions");
  }

  // Report any promise rejections that weren't handled before snapshotting.
  // TODO: decide whether we should abort in this case, instead of just
  // reporting.
  if (JS::SetSize(cx, unhandledRejectedPromises) > 0) {
    report_unhandled_promise_rejections(cx);
  }

  // TODO(performance): check if it makes sense to increase the empty chunk count *before*
  // running GC like this. The working theory is that otherwise the engine might
  // mark chunk pages as free that then later the allocator doesn't turn into
  // chunks without further fragmentation. But that might be wrong.
  // https://github.com/original_repo/issues/223
  // JS_SetGCParameter(cx, JSGC_MAX_EMPTY_CHUNK_COUNT, 10);

  // TODO(performance): verify that it's better to *not* perform a shrinking GC here, as
  // manual testing indicates. Running a shrinking GC here causes *more* 4kb
  // pages to be written to when processing a request, at least for one fairly
  // large input script.
  //
  // A hypothesis for why this is the case could be that most writes are to
  // object kinds that are initially allocated in the same vicinity, but that
  // the shrinking GC causes them to be intermingled with other objects. I.e.,
  // writes become more fragmented due to the shrinking GC.
  // https://github.com/original_repo/issues/224
  JS::PrepareForFullGC(cx);
  JS::NonIncrementalGC(cx, JS::GCOptions::Normal, JS::GCReason::API);

  // Ignore the first GC, but then print all others, because ideally GCs
  // should be rare, and developers should know about them.
  // TODO: consider exposing a way to parameterize this, and/or specifying a
  // dedicated log target for telemetry messages like this.
  JS_SetGCCallback(cx, gc_callback, nullptr);

  return true;
}

void init() {
  assert(isWizening());

  if (!init_js())
    exit(1);

  JSContext *cx = CONTEXT;
  RootedObject global(cx, GLOBAL);
  JSAutoRealm ar(cx, global);

  // bool ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS =
  //     std::string(std::getenv("ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS")) == "1";
  // FastedgeOptions options;
  // options.setExperimentalHighResolutionTimeMethodsEnabled(
  //     ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS);

  define_fastedge_runner(cx, global);

  RootedValue result(cx);
  if (!eval_stdin(cx, &result))
    abort(cx, "evaluating JS");

  fflush(stdout);
  fflush(stderr);

  // Define this to print a simple memory usage report.
#ifdef MEM_STATS
  dump_mem_stats(cx);
#endif

  markWizeningAsFinished();
}

WIZER_INIT(init);


static void process_pending_jobs(JSContext *cx, double *total_compute) {
  auto pre_reactions = system_clock::now();
  if (debug_logging_enabled()) {
    // printf("Running promise reactions\n");
    printf("process_pending_jobs -> Running promise reactions\n");
    fflush(stdout);
  }

  while (js::HasJobsPending(cx)) {
    printf("process_pending_jobs -> HasJobsPending\n");
    fflush(stdout);
    js::RunJobs(cx);
    if (JS_IsExceptionPending(cx)) {

      printf("process_pending_jobs -> abort : JS_IsExceptionPending\n");
      abort(cx, "running Promise reactions");
    }
    fflush(stdout);
  }

  double diff = duration_cast<microseconds>(system_clock::now() - pre_reactions).count();
  *total_compute += diff;
  if (debug_logging_enabled())
    printf("Running promise reactions took %fms\n", diff / 1000);
}


void createRequestObject(JSContext *cx, fastedge_api::Request request) {
  JS::RootedObject jsRequestObj(cx, JS_NewPlainObject(cx));

  // Method
  JS::RootedValue method(cx);
  method.setString(JS_NewStringCopyZ(cx, request.method.c_str()));
  JS_SetProperty(cx, jsRequestObj, "method", method);

  // URL
  JS::RootedValue url(cx);
  url.setString(JS_NewStringCopyZ(cx, request.uri.c_str()));
  JS_SetProperty(cx, jsRequestObj, "url", url);

  // Headers
  size_t headersSize = request.headers.size();
  JS::RootedObject headers(cx, JS::NewArrayObject(cx, headersSize));
  for (size_t i = 0; i < headersSize; i++) {
    const auto& headerTuple = request.headers[i];
    JS::RootedObject headerItem(cx, JS::NewArrayObject(cx, 2)); // cx is your JSContext*

    JS::RootedValue key(cx);
    key.setString(JS_NewStringCopyZ(cx, headerTuple[0].c_str()));
    JS_SetElement(cx, headerItem, 0, key);

    JS::RootedValue val(cx);
    val.setString(JS_NewStringCopyZ(cx, headerTuple[1].c_str()));
    JS_SetElement(cx, headerItem, 1, val);

    JS_SetElement(cx, headers, i, headerItem);
  }
  JS_DefineProperty(cx, jsRequestObj, "headers", headers, JSPROP_ENUMERATE);

  // Body
  if (request.body != GCORE_FASTEDGE_NO_BODY) {
    JS::RootedValue body(cx);
    body.setString(JS_NewStringCopyZ(cx, request.body.c_str()));
    JS_SetProperty(cx, jsRequestObj, "body", body);
  }

  requestObj.init(cx, jsRequestObj);
}


bool reactor_main(fastedge_api::Request request) {
  assert(hasWizeningFinished());

  double total_compute = 0;
  auto start = system_clock::now();

  __wasilibc_initialize_environ();

  if (debug_logging_enabled()) {
    printf("Running JS handleRequest function for FastEdge Compute service version\n");
    fflush(stdout);
  }

  JSContext *cx = CONTEXT;
  JSAutoRealm ar(cx, GLOBAL);
  js::ResetMathRandomSeed(cx);

  createRequestObject(cx, request);

  JS::Value args[1];
  args[0].setObject(*requestObj);
  JS::HandleValueArray argsArray = JS::HandleValueArray::fromMarkedLocation(1, args);

  RootedValue process_main_val(cx);
  if (!JS_GetProperty(cx, GLOBAL, "process", &process_main_val)) {
    if (debug_logging_enabled()) {
      fprintf(stderr, "Error: Could not find: JS::process_main()");
      fflush(stdout);
    }
    return false;
  }

  RootedValue rval(cx);
  if (!JS_CallFunctionValue(cx, GLOBAL, process_main_val, argsArray, &rval)) {
    if (debug_logging_enabled()) {
      fprintf(stderr, "Error: Could not invoke: JS::process_main()");
      fflush(stdout);
    }
    return false;
  }

  fastedge_api::MainResponse& mainResponse = fastedge_api::MainResponse::getInstance();
  bool waitingForResponseObject = mainResponse.status <= 99;
  if (debug_logging_enabled()) {
    printf("reactor_main: EventLoop - mainResponse.status: %d \n", mainResponse.status);
  }
  int loopCount = 0;
  int MAX_LOOP_COUNT = 50; // use this to stop the loop if it runs too long - i.e. 500 error
  do {
    loopCount += 1;
    // First, drain the promise reactions queue.
    process_pending_jobs(cx, &total_compute);

    if (mainResponse.status >= 100 || loopCount >= MAX_LOOP_COUNT) {
      waitingForResponseObject = false;
    }

    if (debug_logging_enabled()) {
      printf("reactor_main: Loop -> HasJobsPending: %d \n", js::HasJobsPending(cx));
      printf("reactor_main: Loop -> waitingForResponseObject: %d \n", waitingForResponseObject);
    }
    fflush(stdout);

  } while (js::HasJobsPending(cx) || waitingForResponseObject);

  if (debug_logging_enabled() && waitingForResponseObject) {
    fprintf(stderr, "Service terminated with async tasks pending. "
                    "Use FetchEvent#waitUntil to extend the service's lifetime "
                    "if needed.\n");
  }

  auto end = system_clock::now();
  double diff = duration_cast<microseconds>(end - start).count();
  if (debug_logging_enabled()) {
    printf("Done. Total request processing time: %fms. Total compute time: %fms\n", diff / 1000,
           total_compute / 1000);
  }
  return true;
}
