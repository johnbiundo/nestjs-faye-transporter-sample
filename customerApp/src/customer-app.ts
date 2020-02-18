import * as faye from 'faye';
import * as uuid from 'uuid/v4';

const FAYE_URL = 'http://localhost:8000/faye';

// Faye connection
let client;

/**
 * Issue 'get-customers' request, return response from message broker
 *
 * @param customerId
 * @param requestId
 * @param requestDelay
 */
async function getCustomers(customerId, requestId = 0, requestDelay = 0) {
  // build Nest-shaped message
  const payload = getPayload(
    '/get-customers',
    customerId
      ? { customerId, requestId, requestDelay }
      : { requestId, requestDelay },
    uuid(),
  );

  return new Promise((resolve, reject) => {
    // subscribe to the response message
    const subscription = client.subscribe('/get-customers_res', result => {
      // handle either objects or stringified results since Nest stringfies,
      // but Faye client lib automatically serializes/deserializes objects
      const parsedResult = parseResult(result);

      console.log(
        `==> Receiving 'get-customers' reply (request: ${requestId}): \n${JSON.stringify(
          parsedResult.response,
          null,
          2,
        )}\n`,
      );
    });

    // once response is subscribed, publish the request
    subscription.then(() => {
      console.log(
        `<== Sending 'get-customers' request with payload:\n${JSON.stringify(
          payload,
        )}\n`,
      );
      const pub = client.publish('/get-customers_ack', payload);
      pub.then(() => {
        // wait .5 second to ensure subscription handler executes
        // then unsubscribe and resolve
        setTimeout(() => {
          subscription.cancel();
          resolve();
        }, 500);
      });
    });
  });
}

/**
 * Issue 'add-customer' event
 *
 * @param name
 */
async function addCustomer(name) {
  const payload = getPayload('/add-customer', { name });
  try {
    await client.publish('/add-customer', payload);
    console.log(
      `<== Publishing add-customer event with payload:\n${JSON.stringify(
        payload,
      )}\n`,
    );
  } catch (error) {
    console.log('Error publishing event: ', error);
  }
}

function usage() {
  console.log('Usage: node customer-app add <customer-name> | get [id]');
  console.log('\t get [id]: send get-customers request and print response');
  console.log(
    '\t\t if id is passed, get matching customer by id, else get all\n',
  );
  console.log('\t add <customer-name> : send add-customer event');
  process.exit(0);
}

function getPayload(pattern, value, id?) {
  let payload = {
    pattern: pattern,
    data: value,
  };
  if (id) {
    payload = Object.assign(payload, { id });
  }
  return payload;
}

function parseResult(content) {
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

async function main() {
  try {
    client = new faye.Client(FAYE_URL);
    console.log('Faye customer app starts...\n===========================');

    // Call appropriate function based on cmd line arg
    if (process.argv[2] === 'add') {
      if (process.argv[3]) {
        await addCustomer(process.argv[3]);
      } else {
        usage();
      }
    } else if (process.argv[2] === 'get') {
      await getCustomers(process.argv[3]);
    } else {
      usage();
    }

    client.disconnect();
    process.exit(0);
  } catch (error) {
    console.log('Error connecting to Faye: ', error);
    process.exit(0);
  }
}

// make sure we get a command argument on OS cmd line
if (process.argv.length < 3) {
  usage();
}

main();
