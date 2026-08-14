import tableService from "./service";
import { createTableSchema, updateTableSchema } from "./validation";
import { successResponse } from "@/lib/api-response";
import { TABLE_MESSAGES } from "./constants";
import { AppError, HTTP_STATUS } from "@/exceptions";

class TableController {
  async getTables(restaurantId: string) {
    const tables = await tableService.getTables(restaurantId);
    return successResponse(TABLE_MESSAGES.FETCHED, tables);
  }

  async getTable(id: string, restaurantId: string) {
    const table = await tableService.getTableById(id, restaurantId);
    return successResponse(TABLE_MESSAGES.FETCHED, table);
  }

  async createTable(data: unknown, restaurantId: string) {
    const parsedData = createTableSchema.safeParse(data);
    if (!parsedData.success) {
      throw new AppError("Validation Error", HTTP_STATUS.BAD_REQUEST, parsedData.error.issues);
    }
    const table = await tableService.createTable(parsedData.data, restaurantId);
    return successResponse(TABLE_MESSAGES.CREATED, table, HTTP_STATUS.CREATED);
  }

  async updateTable(id: string, restaurantId: string, data: unknown) {
    const parsedData = updateTableSchema.safeParse(data);
    if (!parsedData.success) {
      throw new AppError("Validation Error", HTTP_STATUS.BAD_REQUEST, parsedData.error.issues);
    }
    const table = await tableService.updateTable(id, restaurantId, parsedData.data);
    return successResponse(TABLE_MESSAGES.UPDATED, table);
  }

  async deleteTable(id: string, restaurantId: string) {
    const table = await tableService.deleteTable(id, restaurantId);
    return successResponse(TABLE_MESSAGES.DELETED, table);
  }
}

const tableController = new TableController();
export default tableController;
