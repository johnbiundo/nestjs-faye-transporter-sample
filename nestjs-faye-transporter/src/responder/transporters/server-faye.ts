import { Server, CustomTransportStrategy } from '@nestjs/microservices';

import * as faye from 'faye';

export class ServerFaye extends Server implements CustomTransportStrategy {
  // Holds our client interface to the Faye broker.
  private fayeClient;

  constructor(private readonly options) {
    super();
    // super class establishes the serializer and deserializer; sets up
    // defaults unless overridden via `options`
    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  /**
   * listen() is required by `CustomTransportStrategy` It's called by the
   * framework when the transporter is instantiated, and kicks off a lot of
   * the machinery.
   */
  public listen(callback: () => void) {
    this.fayeClient = this.createFayeClient();
    this.start(callback);
  }

  /**
   * get and save a connection to the faye broker
   */
  public createFayeClient() {
    // pull out url, and strip serializer and deserializer properties
    // from options so we conform to the `faye.Client()` interface
    const { url, serializer, deserializer, ...options } = this.options;
    return new faye.Client(url, options);
  }

  /**
   * kick things off
   */
  public start(callback) {
    // register faye message handlers
    this.bindHandlers();
    // call any user-supplied callback from `main.ts` `app.listen()` call
    callback();
  }

  /**
   *
   */
  public bindHandlers() {
    /**
     * messageHandlers is populated by the Framework (on the `Server` superclass)
     *
     * It's a map of `pattern` -> `handler` key/value pairs
     * `handler` is the handler function in the user's controller class, decorated
     * by `@MessageHandler()` or `@EventHandler`, along with an additional boolean
     * property indicating its Nest pattern type: event or message (i.e.,
     * request/response)
     */
    this.messageHandlers.forEach((handler, pattern) => {
      // only handling `@MessagePattern()`s for now
      if (!handler.isEventHandler) {
        this.fayeClient.subscribe(
          `${pattern}_ack`,
          this.getMessageHandler(pattern, handler),
        );
      }
    });
  }

  public getMessageHandler(pattern: string, handler: Function): Function {
    return async message => {
      const inboundPacket = this.deserializer.deserialize(message);
      const response = await handler(inboundPacket.data);
      const outboundRawPacket = {
        err: null,
        response,
        isDisposed: true,
        id: (message as any).id,
      };
      const outboundPacket = this.serializer.serialize(outboundRawPacket);
      this.fayeClient.publish(`${pattern}_res`, outboundPacket);
    };
  }

  /**
   * close() is required by `CustomTransportStrategy`...
   */
  public close() {
    this.fayeClient = null;
  }
}
