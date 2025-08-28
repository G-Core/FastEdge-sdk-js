import * as staticServer from './static-assets/index.ts';
declare const servers: {
    static: typeof staticServer;
};
export { servers };
