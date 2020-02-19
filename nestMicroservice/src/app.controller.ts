import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

interface Customer {
  id: number;
  name: string;
}

const customerList: Customer[] = [{ id: 1, name: 'nestjs.com' }];

@Controller()
export class AppController {
  logger = new Logger('AppController');

  /**
   * Register a message handler for 'get-customers' requests
   */
  @MessagePattern('/get-customers')
  async getCustomers(data: any): Promise<any> {
    const customers =
      data && data.customerId
        ? customerList.filter(cust => cust.id === parseInt(data.customerId, 10))
        : customerList;
    return { customers };
  }
}
