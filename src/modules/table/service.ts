import tableRepository from "./repository";
import { CreateTableDTO, UpdateTableDTO } from "./dto";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { TABLE_MESSAGES } from "./constants";

class TableService {
  async getTables(restaurantId: string) {
    return tableRepository.findByRestaurantId(restaurantId);
  }

  async getTableById(id: string, restaurantId: string) {
    const table = await tableRepository.findById(id, restaurantId);
    if (!table) throw new AppError(TABLE_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    return table;
  }

  async createTable(data: CreateTableDTO, restaurantId: string) {
    const existingTable = await tableRepository.findByTableNumber(restaurantId, data.tableNumber);
    if (existingTable) {
      throw new AppError(TABLE_MESSAGES.ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }
    
    // Create the table first so we get its ID
    const table = await tableRepository.create({
      ...data,
      restaurantId,
    });

    // Option A: Use the Table ID as the unique QR code identifier.
    // E.g. https://domain.com/menu/tableId
    // We'll pass the table.id in the URL
    // We assume the frontend will be served from the NEXT_PUBLIC_APP_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const qrCodeUrl = `${appUrl}/menu/${table.id}`;

    return tableRepository.update(table.id, { qrCode: qrCodeUrl });
  }

  async updateTable(id: string, restaurantId: string, data: UpdateTableDTO) {
    const table = await this.getTableById(id, restaurantId);

    if (data.tableNumber && data.tableNumber !== table.tableNumber) {
      const existing = await tableRepository.findByTableNumber(restaurantId, data.tableNumber);
      if (existing) throw new AppError(TABLE_MESSAGES.ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    return tableRepository.update(id, data);
  }

  async deleteTable(id: string, restaurantId: string) {
    await this.getTableById(id, restaurantId);
    return tableRepository.delete(id);
  }
}

const tableService = new TableService();
export default tableService;
