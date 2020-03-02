import { Observable } from 'rxjs';

import { IdentitySerializer } from '@nestjs/microservices/serializers/identity.serializer';
import { IncomingResponseDeserializer } from '@nestjs/microservices/deserializers/incoming-response.deserializer';

import * as faye from 'faye';
import * as uuid from 'uuid/v4';

export class ClientFaye {
  private readonly serializer;
  private readonly deserializer;
  protected fayeClient;

  constructor(protected readonly options) {
    this.fayeClient = this.connect();
    this.serializer = options.serializer || new IdentitySerializer();
    this.deserializer =
      options.deserializer || new IncomingResponseDeserializer();
  }

  public send(pattern, data): Observable<any> {
    return new Observable(observer => {
      return this.handleRequest({ pattern, data }, observer);
    });
  }

  public handleRequest(partialPacket, observer): Function {
    const packet = Object.assign(partialPacket, { id: uuid() });
    const serializedPacket = this.serializer.serialize(packet);

    const requestChannel = `${packet.pattern}_ack`;
    const responseChannel = `${packet.pattern}_res`;

    const subscriptionHandler = rawPacket => {
      const message = this.deserializer.deserialize(rawPacket);
      const { err, response, isDisposed } = message;
      if (err) {
        return observer.error(err);
      } else if (response !== undefined && isDisposed) {
        observer.next(response);
        return observer.complete();
      } else if (isDisposed) {
        return observer.complete();
      }
      observer.next(response);
    };

    const subscription = this.fayeClient.subscribe(
      responseChannel,
      subscriptionHandler,
    );

    subscription.then(() => {
      this.fayeClient.publish(requestChannel, serializedPacket);
    });

    return () => {
      this.fayeClient.unsubscribe(responseChannel);
    };
  }

  public connect() {
    if (this.fayeClient) {
      return this.fayeClient;
    }
    const { url, serializer, deserializer, ...options } = this.options;
    this.fayeClient = new faye.Client(url, options);
    this.fayeClient.connect();
    return this.fayeClient;
  }
}
