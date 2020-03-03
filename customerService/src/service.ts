import * as faye from 'faye';

const FAYE_URL = 'http://localhost:8000/faye';

const customerList = [{ id: 1, name: 'Acme, Inc.' }];
let lastId = customerList.length;

// Faye connection
let client;

/**
 * callback handler. This is registered for '/get-customers' topic.
 *
 * @param packet inbound request payload
 */
function getCustomers(packet): void {
  const message = parsePacket(packet);
  console.log(
    `\n========== <<< 'get-customers' message >>> ==========\n${JSON.stringify(
      message,
    )}\n=============================================\n`,
  );

  // filter customers list if there's a `customerId` param
  const customers =
    message.data && message.data.customerId
      ? customerList.filter(
          cust => cust.id === parseInt(message.data.customerId, 10),
        )
      : customerList;

  client.publish('/get-customers_res', getPayload({ customers }, message.id));
}

/**
 * Callback handler. This is registered for '/add-customer' topic.
 *
 * @param message inbound request payload
 */
function addCustomer(message): void {
  console.log(
    `\n========== <<< 'add-customer' message >>> ==========\n${JSON.stringify(
      message,
    )}\n=============================================\n`,
  );

  customerList.push({
    id: lastId + 1,
    name: message.data.name,
  });
  lastId++;
}

function getPayload(value, id) {
  return {
    err: null,
    response: value,
    isDisposed: true,
    id: id,
  };
}

async function main() {
  try {
    client = new faye.Client(FAYE_URL);
    console.log(
      'Faye customer service starts...\n===============================',
    );

    client.subscribe('/get-customers_ack', getCustomers);
    client.subscribe('/add-customer', addCustomer);
  } catch (err) {
    console.log('Error connecting to Faye: ', err.stack);
  }
}

main();
