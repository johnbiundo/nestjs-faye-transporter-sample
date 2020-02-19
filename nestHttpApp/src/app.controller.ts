import { Controller, Get, Logger, Param } from '@nestjs/common';

import {
  ClientFaye,
  InboundResponseIdentityDeserializer,
  OutboundMessageIdentitySerializer,
} from '@faye-tut/nestjs-faye-transporter';

import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Controller()
export class AppController {
  logger = new Logger('AppController');
  client: ClientFaye;

  constructor() {
    this.client = new ClientFaye({
      url: 'http://localhost:8000/faye',
      serializer: new OutboundMessageIdentitySerializer(),
      deserializer: new InboundResponseIdentityDeserializer(),
    });
  }

  /**
   * Request all customers from the configured microservice
   *
   * Use httPie: http get localhost:3000/customers
   */
  @Get('customers')
  async getCustomers(): Promise<any> {
    this.logger.log('client#send -> topic: "get-customers"');
    return this.client.send('/get-customers', {});
  }

  /**
   * Request a customer by id from the configured microservice
   *
   * Use httPie: http get localhost:3000/customers/1
   */
  @Get('customers/:id')
  async getCustomersById(@Param('id') id: number): Promise<any> {
    this.logger.debug(`client#send -> topic: "get-customers", id: ${id}`);
    return this.client.send('/get-customers', { id });
  }
}
