import { KvStore } from "fastedge::kv";
import {
  Action,
  decodeValueArray,
  stringifyValueScoreTuples,
  validateQueryParams,
} from "./utils";

async function eventHandler(event: FetchEvent): Promise<Response> {
  try {
    const { request: req } = event;
    const url = new URL(req.url);

    const params = validateQueryParams(url.searchParams);
    if (params.error) {
      throw new Error(params.error);
    }

    const myStore = KvStore.open(params.store);
    const action = params.action as Action;

    const responseObj: Record<string, string> = {
      Store: params.store,
      Action: action,
    };

    switch (action) {
      case "get": {
        const response = myStore.get(params.key);
        responseObj["Key"] = params.key;
        responseObj["Response"] = decodeValueArray(response);
        break;
      }
      case "scan": {
        const response = myStore.scan(params.match);
        responseObj["Match"] = params.match;
        responseObj["Response"] = response.join(", ");
        break;
      }
      case "zrange": {
        const { key, min, max } = params;
        const response = myStore.zrangeByScore(
          key,
          parseFloat(min),
          parseFloat(max)
        );
        responseObj["Key"] = key;
        responseObj["Min"] = min;
        responseObj["Max"] = max;
        responseObj["Response"] = stringifyValueScoreTuples(response);
        break;
      }
      case "zscan": {
        const { key, match } = params;
        const response = myStore.zscan(key, match);
        responseObj["Key"] = key;
        responseObj["Match"] = match;
        responseObj["Response"] = stringifyValueScoreTuples(response);
        break;
      }
      case "bfExists": {
        const { key, item } = params;
        const exists = myStore.bfExists(key, item);
        responseObj["Key"] = key;
        responseObj["Item"] = item;
        responseObj["Response"] = exists ? "true" : "false";
        break;
      }
    }

    return Response.json(responseObj);
  } catch (error: Error | unknown) {
    return Response.json(
      { error: `${(error as Error).message}` },
      { status: 500 }
    );
  }
}

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(eventHandler(event));
});
