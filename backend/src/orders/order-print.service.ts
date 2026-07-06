import { Injectable, Logger } from '@nestjs/common';
import { PrinterService } from 'src/printer/printer.service';
import { PrintJob, PrintItem } from 'src/printer/dto/print-job.dto';

export interface PrintJobContext {
  orderId: number;
  table: string | null;
  customerName: string | null;
  operatorName?: string;
  isReprint?: boolean;
}

export interface PrintJobBuilder {
  map: Map<string, PrintJob>;
  addItem: (location: string, item: PrintItem) => void;
  addItemIfLocation: (
    location: string | null | undefined,
    item: PrintItem,
  ) => void;
}

@Injectable()
export class OrderPrintService {
  private readonly logger = new Logger(OrderPrintService.name);

  constructor(private readonly printerService: PrinterService) {}

  createBuilder(context: PrintJobContext): PrintJobBuilder {
    const map = new Map<string, PrintJob>();

    const addItem = (location: string, item: PrintItem) => {
      if (!map.has(location)) {
        map.set(location, {
          orderId: context.orderId,
          table: context.table,
          customerName: context.customerName,
          operatorName: context.operatorName,
          location,
          isReprint: context.isReprint,
          items: [],
        });
      }
      map.get(location)!.items.push(item);
    };

    const addItemIfLocation = (
      location: string | null | undefined,
      item: PrintItem,
    ) => {
      const loc = location?.trim();
      if (loc) addItem(loc, item);
    };

    return { map, addItem, addItemIfLocation };
  }

  dispatchAsync(orderId: number, map: Map<string, PrintJob>): void {
    if (map.size === 0) return;

    this.printerService.printOrder([...map.values()]).catch((err) => {
      const message = err?.message ?? 'Erro desconhecido';
      this.logger.warn(`Falha ao imprimir pedido ${orderId}: ${message}`);
    });
  }

  async dispatchSync(
    orderId: number,
    map: Map<string, PrintJob>,
  ): Promise<void> {
    try {
      await this.printerService.printOrder([...map.values()]);
    } catch (err: any) {
      const message = err?.message ?? 'Erro desconhecido';
      this.logger.error(`Falha ao reimprimir pedido ${orderId}: ${message}`);
      throw err;
    }
  }
}
