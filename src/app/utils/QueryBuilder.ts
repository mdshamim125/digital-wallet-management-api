/* eslint-disable @typescript-eslint/no-explicit-any */
import { Query } from "mongoose";
import mongoose from "mongoose";
import { excludeField } from "../constants";

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // Filter method handles type, status, min/max amounts, and excludes unnecessary fields
  // filter(): this {
  //   const filter: Record<string, any> = { ...this.query };

  //   // Remove excluded fields
  //   for (const field of excludeField) {
  //     // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  //     delete filter[field];
  //   }

  //   // Handle minAmount / maxAmount
  //   if (filter.minAmount || filter.maxAmount) {
  //     filter.amount = {};
  //     if (filter.minAmount) {
  //       filter.amount.$gte = Number(filter.minAmount);
  //       delete filter.minAmount;
  //     }
  //     if (filter.maxAmount) {
  //       filter.amount.$lte = Number(filter.maxAmount);
  //       delete filter.maxAmount;
  //     }
  //   }

  //   // Only include type and status if they exist and are not "all"
  //   if (filter.type === "all" || !filter.type) delete filter.type;
  //   if (filter.status === "all" || !filter.status) delete filter.status;

  //   this.modelQuery = this.modelQuery.find(filter);
  //   return this;
  // }

  // Filter method handles type, status, min/max amounts, date range, and excludes unnecessary fields
  filter(): this {
    const filter: Record<string, any> = { ...this.query };

    // Remove excluded fields
    for (const field of excludeField) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete filter[field];
    }

    // Handle minAmount / maxAmount
    if (filter.minAmount || filter.maxAmount) {
      filter.amount = {};
      if (filter.minAmount) {
        filter.amount.$gte = Number(filter.minAmount);
        delete filter.minAmount;
      }
      if (filter.maxAmount) {
        filter.amount.$lte = Number(filter.maxAmount);
        delete filter.maxAmount;
      }
    }

    // Handle date range (startDate / endDate)

    if (filter.startDate || filter.endDate) {
      filter.createdAt = {};

      if (filter.startDate) {
        // Beginning of the day (00:00:00)
        const start = new Date(filter.startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
        delete filter.startDate;
      }

      if (filter.endDate) {
        // End of the day (23:59:59)
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
        delete filter.endDate;
      }
    }

    // Only include type and status if they exist and are not "all"
    if (filter.type === "all" || !filter.type) delete filter.type;
    if (filter.status === "all" || !filter.status) delete filter.status;

    this.modelQuery = this.modelQuery.find(filter);
    return this;
  }

  // Search method handles searchTerm for string fields and ObjectId fields
  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm;
    if (!searchTerm) return this;

    const orConditions: Record<string, any>[] = [];

    searchableFields.forEach((field) => {
      // ObjectId fields
      if (["from", "to"].includes(field)) {
        if (mongoose.Types.ObjectId.isValid(searchTerm)) {
          orConditions.push({ [field]: searchTerm });
        }
      }
      // Number fields
      else if (["amount", "fee"].includes(field)) {
        const numericValue = Number(searchTerm);
        if (!isNaN(numericValue)) {
          orConditions.push({ [field]: numericValue });
        }
      }
      // String fields
      else {
        orConditions.push({ [field]: { $regex: searchTerm, $options: "i" } });
      }
    });

    if (orConditions.length > 0) {
      this.modelQuery = this.modelQuery.find({ $or: orConditions });
    }

    return this;
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  build() {
    return this.modelQuery;
  }

  async getMeta() {
    // Clone the query without pagination
    const countQuery = this.modelQuery.model.find(this.modelQuery.getQuery());
    const totalDocuments = await countQuery.countDocuments();

    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;

    const totalPage = Math.ceil(totalDocuments / limit);

    return { page, limit, total: totalDocuments, totalPage };
  }
}
