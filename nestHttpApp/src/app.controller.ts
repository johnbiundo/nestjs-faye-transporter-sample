// tslint:disable: no-unused-expression
import {
  Controller,
  Get,
  Logger,
  Param,
  Response,
  Post,
  Body,
} from '@nestjs/common';

import {
  ClientFaye,
  InboundResponseIdentityDeserializer,
  OutboundMessageIdentitySerializer,
} from '@faye-tut/nestjs-faye-transporter';

import { tap, reduce, filter } from 'rxjs/operators';

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
   * Use HTTPie: http get localhost:3000/customers
   */
  @Get('customers')
  async getCustomers(): Promise<any> {
    this.logger.log('client#send -> topic: "get-customers"');
    return this.client.send('/get-customers', {});
  }

  /**
   * Request a customer by id from the configured microservice
   *
   * Use HTTPie: http get localhost:3000/customers/1
   */
  @Get('customers/:id')
  async getCustomersById(@Param('id') id: number): Promise<any> {
    this.logger.debug(`client#send -> topic: "get-customers", id: ${id}`);
    return this.client.send('/get-customers', { id });
  }

  /**
   * Route 'POST customer' emits an event with the topic 'add-customer' via NATS,
   * along with a payload containing the new customer information.
   *
   * Use HTTPie: http post localhost:3000/customer name=<some name>
   */
  @Post('customer')
  addCustomer(@Body() customer: any) {
    this.logger.debug(`#client#emit -> topic: "/add-customer"`);

    this.client.emit('/add-customer', { name: customer.name });
    return `Submitted customer ${customer.name}`;
  }

  /*====================================================
    Following are handlers for our Observable deep dive
    These aren't really relevant to the *main* flow of the
    tutorial, but are used to develop a deeper understanding
    of the underlying capabilities of Nest transporters

    See http://  ...
  =====================================================*/

  /**
   * Returning a promise
   *
   * Get results when promise resolves
   * (Response message only comes back after promise settles)
   *
   * Use HTTPie: http get localhost:3000/jobs-promise/1
   */
  @Get('jobs-promise/:duration')
  promise(@Param('duration') duration) {
    return this.client.send('/jobs-promise', duration);
  }

  /**
   * The promise is still an observable.  Nest always returns an observable
   * from ClientProxy#send
   *
   * Same call as above, but showing the response(even though we returned a
   * promise), has been converted to an observable, so we can operate on the
   * observable
   *
   * Use HTTPie: http get localhost:3000/jobs-promise-observable/1
   */
  @Get('jobs-promise-observable/:duration')
  async promise2(@Param('duration') duration, @Response() response) {
    const coldStream$ = this.client.send('/jobs-promise', duration);
    this.logger.log('Waiting 5 seconds before launching request...');

    // sleep 5 seconds, then launch
    setTimeout(() => {
      this.logger.log('... now launching request');
      // subscribing launches the request
      // since we are handling the response manually, we use @Response
      coldStream$.subscribe(resp => response.json(resp));
    }, 5000);
  }

  /**
   * Returning a simple observable **from the server**
   *
   * On the server side, we convert the promise to an observable. We are
   * returning a remote observable here, but it's entirely transparent at
   * this point since the observable only responds when it is complete.
   *
   * This has the same semantics, at this point, as returning a promise
   *
   * Use HTTPie: http get localhost:3000/jobs-observable/1
   */
  @Get('jobs-observable/:duration')
  jobsObservable(@Param('duration') duration) {
    return this.client.send('/jobs-observable', duration);
  }

  /**
   * Returning an observable that is aware of the stream, and sends us status
   * events.
   *
   * Here we are dealing with a remote observable that streams multiple results
   * back to us.  So we handle each of those results in our handler.
   *
   * Notice (by viewing the log) that we are getting multiple response messages
   * --each emitted result is transferred over the network and handed to our
   * **local** observable where we manage the response.
   *
   * We process each result with `tap` and call our `notify()` function to update
   * anyone interested in the status of the in progress jobs.
   *
   * We also run a `reduce` function at the completion of the stream to produce
   * a final summary result to return to our HTTP client requestor.
   *
   * Use HTTPie: http get localhost:3000/jobs-stream1/1
   */
  @Get('jobs-stream1/:duration')
  stream(@Param('duration') duration) {
    return this.client.send('/jobs-stream1', duration).pipe(
      // do notification
      tap(step => {
        this.notify(step);
      }),
      reduce(
        (acc, val) => {
          return {
            jobCount: acc.jobCount + 1,
            totalWorkTime: acc.totalWorkTime + val.workTime,
          };
        },
        { jobCount: 0, totalWorkTime: 0 },
      ),
    );
  }
  /**
   * Returning an observable that is aware of the stream, and sends us status
   * events.
   *
   * Here we are dealing with a remote observable that streams multiple results
   * back to us.  So we handle each of those results in our handler.
   *
   * Notice (by viewing the log) that we are getting multiple response messages
   * --each emitted result is transferred over the network and handed to our
   * **local** observable where we manage the response.
   *
   * The server also sends us a final total result at the completion of the stream,
   * which is what we return as the HTTP response (Nest handles this last part --
   * "flattening" the observable by returning only the final value in the stream
   *  automatically).
   *
   * Use HTTPie: http get localhost:3000/jobs-stream2/1
   */
  @Get('jobs-stream2/:duration')
  stream2(@Param('duration') duration) {
    return this.client.send('/jobs-stream2', duration).pipe(
      // do notification if this is a job completion event
      tap(step => {
        step.status && this.notify(step);
      }),
    );
  }

  /**
   * Returning a smart remote observable: Nest has sensible defaults
   *
   * Again, we deal with a remote observable that streams the interim results
   * back to us.  Since we don't explicitly handle the stream, Nest hands us the
   * final value emitted
   *
   * Use HTTPie: http get localhost:3000/jobs-stream-final/1
   */
  @Get('jobs-stream-final/:duration')
  stream3(@Param('duration') duration) {
    return this.client.send('/jobs-stream1', duration);
  }

  /**
   * Requests aren't initiated until the observable is subscribed
   *
   * Similar to our promise case above; this time working with our remote
   * observable.
   *
   * Showing that because `send` returns us a cold observable,
   * we can delay initiating the remote request until we subscribe
   *
   * Use HTTPie: http get localhost:3000/jobs-delayed-stream/1
   */
  @Get('jobs-delayed-stream/:duration')
  delayedStream(@Param('duration') duration, @Response() response) {
    this.logger.log('Waiting 5 seconds before launching request...');
    const coldStream$ = this.client.send('/jobs-stream1', duration).pipe(
      tap(step => {
        this.notify(step);
      }),
      reduce(
        (acc, val) => {
          return {
            jobCount: acc.jobCount + 1,
            totalWorkTime: acc.totalWorkTime + parseInt(val.workTime, 10),
          };
        },
        { jobCount: 0, totalWorkTime: 0 },
      ),
    );

    setTimeout(() => {
      coldStream$.subscribe(resp => response.json(resp));
    }, 5000);
  }

  /*
    Following is the handler for Part 4, testing multiple outstanding
    requests
  */

  @Get('race/:cid/:delay')
  race(@Param('cid') cid, @Param('delay') delay) {
    this.logger.log(`race with cid: ${cid}, delay: ${delay}`);
    return this.client
      .send('/race', {
        requestId: cid,
        requestDelay: parseInt(delay, 10),
      })
      .pipe(
        tap(result => {
          this.logger.log(
            `Request for id: ${cid} completed with result: ${JSON.stringify(
              result,
            )}`,
          );
        }),
      );
  }

  /********************************
    Utilities
  *********************************/

  /**
   * Utility method to simulate sending a notification (just logs to console as
   * if we did)
   *
   * @param notification string - the notification text
   */
  notify(notification) {
    this.logger.log(`=====>>>> Sending notification: ${notification.status}`);
  }
}
