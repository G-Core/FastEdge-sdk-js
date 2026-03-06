const ALL_ACTIONS = ["get", "scan", "zscan", "zrange", "bfExists"] as const;

export type Action = (typeof ALL_ACTIONS)[number];

type ParamKey =
  | "action"
  | "store"
  | "key"
  | "match"
  | "min"
  | "max"
  | "item"
  | "error";

type Params = { [key in ParamKey]: string };

export function validateQueryParams(queryParams: URLSearchParams): Params {
  const validParams = {} as Params;

  // Validate 'action' parameter
  let action = queryParams.get("action") ?? "get";
  if (ALL_ACTIONS.includes(action as Action)) {
    validParams["action"] = action;
  } else {
    validParams[
      "error"
    ] = `Invalid action '${action}'. Supported actions are: ${ALL_ACTIONS.join(
      ", "
    )}`;
    return validParams;
  }

  const requiredParameters = {
    store: [...ALL_ACTIONS],
    key: ["get", "zrange", "zscan", "bfExists"],
    match: ["scan", "zscan"],
    min: ["zrange"],
    max: ["zrange"],
    item: ["bfExists"],
  } as Record<ParamKey, Array<string>>;

  for (const [key, actions] of Object.entries(requiredParameters)) {
    if (actions.includes(action)) {
      const value = queryParams.get(key);
      if (value && value !== "") {
        validParams[key as ParamKey] = value;
      } else {
        validParams[
          "error"
        ] = `Query parameters must provide '${key}' for a '${action}' action.`;
        return validParams;
      }
    }
  }

  return validParams;
}

export const decodeValueArray = (arrVal: ArrayBuffer | null) => {
  if (arrVal) {
    const decoder = new TextDecoder();
    return decoder.decode(arrVal);
  }
  return "";
};

export const stringifyValueScoreTuples = (
  tupleList: Array<[ArrayBuffer, number]>
): string => {
  let strResponse = "[";
  for (const tuple of tupleList) {
    strResponse += `{ Value: ${decodeValueArray(tuple[0])}, Score: ${
      tuple[1]
    } }, `;
  }
  strResponse += "]";
  return strResponse;
};
